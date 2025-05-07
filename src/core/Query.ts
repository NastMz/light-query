// src/core/Query.ts
import { retry } from '@utils/retry'
import { QueryFn, QueryState, QueryOptions, QueryStatus } from '@types'
import { QueryCache } from '@core/QueryCache'

/**
 * Manages fetching, caching, stale logic, retries, and subscriptions for one query key.
 *
 * @template T  The type returned by queryFn.
 */
export class Query<T> {
  key: string
  fn: QueryFn<T>
  options: Required<Pick<QueryOptions<T>, 'staleTime' | 'cacheTime' | 'retry' | 'retryDelay'>> & {
    refetchInterval: number
    suspense: boolean
  }

  state: QueryState<T>

  private readonly subscribers = new Set<() => void>()
  private readonly cacheTimer?: ReturnType<typeof setTimeout>
  private readonly intervalId?: ReturnType<typeof setInterval>

  constructor (key: string, options: QueryOptions<T>) {
    this.key = key
    this.fn = options.queryFn
    this.options = {
      staleTime: options.staleTime ?? 0,
      cacheTime: options.cacheTime ?? 5 * 60_000,
      retry: options.retry ?? 0,
      retryDelay: options.retryDelay ?? 1000,
      refetchInterval: options.refetchInterval ?? 0,
      suspense: options.suspense ?? false
    }
    this.state = { status: QueryStatus.Idle, updatedAt: 0 }

    // Set up automatic refetching if requested
    if (this.options.refetchInterval > 0) {
      this.intervalId = setInterval(async () => await this.fetch(), this.options.refetchInterval)
    }
  }

  /**
   * Subscribe to state updates.
   */
  subscribe (cb: () => void): void {
    this.subscribers.add(cb)
    // If someone re-subscribed, cancel any scheduled cleanup
    if (this.cacheTimer !== null) clearTimeout(this.cacheTimer)
  }

  /**
   * Unsubscribe and schedule cache cleanup if no more subscribers.
   */
  unsubscribe (cb: () => void): void {
    this.subscribers.delete(cb)
    if (this.subscribers.size === 0) {
      QueryCache.getInstance().scheduleCleanup(this.key, this.options.cacheTime)
      if (this.intervalId) clearInterval(this.intervalId)
    }
  }

  /** Notify all subscribers of state change */
  private notify (): void {
    this.subscribers.forEach(cb => cb())
  }

  /**
   * Perform the fetch according to staleTime, retry logic, and Suspense config.
   */
  async fetch (): Promise<void> {
    const now = Date.now()
    // If already loading, skip
    if (this.state.status === QueryStatus.Loading) return
    // If data is still fresh, skip
    if (this.state.updatedAt !== null && now - this.state.updatedAt < this.options.staleTime) {
      return
    }

    // Start loading
    this.state.status = QueryStatus.Loading
    this.notify()

    // Execute with retry if configured
    const call: () => Promise<T> = async () => await this.fn()
    try {
      const data = this.options.retry > 0
        ? await retry(call, this.options.retry, this.options.retryDelay)
        : await call()
      this.state = { data, status: QueryStatus.Success, updatedAt: Date.now() }
    } catch (error) {
      this.state = { error, status: QueryStatus.Error, updatedAt: Date.now() }
    }
    this.notify()

    // If using Suspense, throw promise or error
    if (this.options.suspense) {
      if (this.state.status === QueryStatus.Loading) throw new Error('Query is still loading')
      if (this.state.status === QueryStatus.Error) throw this.state.error
    }
  }
}
