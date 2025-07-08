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
  // Timer ID for scheduled cache cleanup when no subscribers
  private cacheTimer?: ReturnType<typeof setTimeout>
  private intervalId?: ReturnType<typeof setInterval>
  private isRefetching = false
  private abortController?: AbortController
  // Batch notification system
  private pendingNotification = false
  private notificationTimer?: ReturnType<typeof setTimeout>

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
    this.setupRefetchInterval()
  }

  /**
   * Setup or update the refetch interval timer
   */
  private setupRefetchInterval (): void {
    // Clear any existing interval first
    if (this.intervalId !== undefined) {
      clearInterval(this.intervalId)
      this.intervalId = undefined
    }

    // Set up new interval if configured and there are active subscribers
    if (this.options.refetchInterval > 0) {
      this.intervalId = setInterval(() => {
        // Only refetch if there are active subscribers and not already refetching
        if (this.subscribers.size > 0 && !this.isRefetching) {
          void this.refetchWithoutStale()
        }
      }, this.options.refetchInterval)
    }
  }

  /**
   * Refetch data by temporarily ignoring staleTime
   */
  private async refetchWithoutStale (): Promise<void> {
    // Prevent concurrent refetches
    if (this.isRefetching) return

    this.isRefetching = true
    const originalStale = this.options.staleTime
    this.options.staleTime = 0
    try {
      await this.fetch()
    } catch (error) {
      console.error('Error in automatic refetch:', error)
    } finally {
      this.options.staleTime = originalStale
      this.isRefetching = false
    }
  }

  /**
   * Subscribe to state updates.
   */
  subscribe (cb: () => void): void {
    this.subscribers.add(cb)
    // If someone re-subscribed, cancel any scheduled cleanup
    if (this.cacheTimer !== undefined) {
      clearTimeout(this.cacheTimer)
      this.cacheTimer = undefined
    }
    // Immediately inform the new subscriber of current state
    cb()
  }

  /**
   * Unsubscribe and schedule cache cleanup if no more subscribers.
   */
  unsubscribe (cb: () => void): void {
    this.subscribers.delete(cb)
    if (this.subscribers.size === 0) {
      // Schedule cache removal and clear polling interval after cacheTime
      const cache = QueryCache.getInstance()
      this.cacheTimer = setTimeout(() => {
        if (this.intervalId != null) clearInterval(this.intervalId)
        cache.remove(this.key)
      }, this.options.cacheTime)
    }
  }

  /** Notify all subscribers of state change */
  private notify (): void {
    if (this.pendingNotification) return

    this.pendingNotification = true
    this.notificationTimer = setTimeout(() => {
      this.pendingNotification = false
      this.notificationTimer = undefined

      this.subscribers.forEach(cb => {
        try {
          cb()
        } catch (err) {
          console.error('Error in query subscriber:', err)
        }
      })
    }, 0)
  }

  /** Publicly accessible notify method to force updates */
  forceNotify (): void {
    this.notify()
  }

  /** Cancel the current request */
  cancel (): void {
    if (this.abortController != null) {
      this.abortController.abort()
      this.abortController = undefined
    }
  }

  /**
   * Perform the fetch according to staleTime, retry logic, and Suspense config.
   */
  async fetch (): Promise<void> {
    if (this.shouldSkipFetch()) return

    const signal = this.prepareForFetch()

    try {
      const data = await this.executeQuery(signal)
      this.handleSuccess(data, signal)
    } catch (error) {
      this.handleError(error, signal)
    } finally {
      this.cleanup(signal)
    }

    this.handleSuspense(signal)
  }

  private shouldSkipFetch (): boolean {
    const now = Date.now()
    if (this.state.status === QueryStatus.Loading) return true
    if (this.state.updatedAt !== null && now - this.state.updatedAt < this.options.staleTime) {
      return true
    }
    return false
  }

  private prepareForFetch (): AbortSignal {
    // Cancel any existing request
    if (this.abortController != null) {
      this.abortController.abort()
    }

    // Create new AbortController for this request
    this.abortController = new AbortController()
    const signal = this.abortController.signal

    // Start loading
    this.state.status = QueryStatus.Loading
    this.notify()

    return signal
  }

  private async executeQuery (signal: AbortSignal): Promise<T> {
    const call: () => Promise<T> = async () => {
      try {
        return await this.fn({ signal })
      } catch (error) {
        if (signal.aborted) throw error
        throw error
      }
    }

    return this.options.retry > 0
      ? await retry(call, this.options.retry, this.options.retryDelay)
      : await call()
  }

  private handleSuccess (data: T, signal: AbortSignal): void {
    if (!signal.aborted) {
      this.state = { data, status: QueryStatus.Success, updatedAt: Date.now() }
      this.notify()
    }
  }

  private handleError (error: unknown, signal: AbortSignal): void {
    if (!signal.aborted) {
      this.state = { error, status: QueryStatus.Error, updatedAt: Date.now() }
      this.notify()
    }
  }

  private cleanup (signal: AbortSignal): void {
    if (this.abortController != null && !signal.aborted) {
      this.abortController = undefined
    }
  }

  private handleSuspense (signal: AbortSignal): void {
    if (this.options.suspense && !signal.aborted) {
      if (this.state.status === QueryStatus.Loading) throw new Error('Query is still loading')
      if (this.state.status === QueryStatus.Error) throw this.state.error
    }
  }

  /**
   * Update options and reconfigure timers if needed
   */
  updateOptions (options: Partial<QueryOptions<T>>): void {
    let needsIntervalUpdate = false

    if (options.refetchInterval !== undefined &&
        options.refetchInterval !== this.options.refetchInterval) {
      this.options.refetchInterval = options.refetchInterval
      needsIntervalUpdate = true
    }

    if (options.staleTime !== undefined) {
      this.options.staleTime = options.staleTime
    }

    if (options.cacheTime !== undefined) {
      this.options.cacheTime = options.cacheTime
    }

    if (options.retry !== undefined) {
      this.options.retry = options.retry
    }

    if (options.retryDelay !== undefined) {
      this.options.retryDelay = options.retryDelay
    }

    if (options.suspense !== undefined) {
      this.options.suspense = options.suspense
    }

    // Update refetch interval if it changed
    if (needsIntervalUpdate) {
      this.setupRefetchInterval()
    }
  }
}
