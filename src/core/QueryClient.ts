// src/core/QueryClient.ts
import { QueryCache } from '@core/QueryCache'
import { Query } from '@core/Query'
import { QueryOptions, MutationOptions, QueryKey, QueryClientConfig, QueryState, QueryStatus } from '@types'

/**
 * Singleton client for fetching and mutating queries.
 */
export class QueryClient {
  private readonly cache = QueryCache.getInstance()
  private readonly config: QueryClientConfig
  private static _instance: QueryClient
  private readonly activeMutations = new Set<string>()
  private readonly mutationSubscribers = new Set<() => void>()

  constructor (config: QueryClientConfig = {}) {
    this.config = {
      defaultOptions: {
        queries: {
          staleTime: 0,
          cacheTime: 5 * 60_000,
          retry: 0,
          retryDelay: 1000,
          refetchInterval: 0,
          suspense: false,
          ...config.defaultOptions?.queries
        },
        mutations: {
          ...config.defaultOptions?.mutations
        }
      },
      maxCacheSize: config.maxCacheSize,
      logger: config.logger
    }
  }

  /** Get or create the global client */
  static getInstance (config?: QueryClientConfig): QueryClient {
    this._instance ??= new QueryClient(config)
    return this._instance
  }

  /** Access the raw cache */
  static getQueryCache (): QueryCache {
    return this.getInstance().cache
  }

  /**
   * Instance method to access this client's cache
   */
  getQueryCache (): QueryCache {
    return this.cache
  }

  /**
   * Fetch data with caching & config.
   * @template T
   */
  async fetchQuery<T>(options: QueryOptions<T>): Promise<T> {
    // Merge with default options
    const mergedOptions: QueryOptions<T> = {
      ...this.config.defaultOptions?.queries,
      ...options
    }

    const key = JSON.stringify(mergedOptions.queryKey)
    let query = this.cache.get<T>(key)
    if (query == null) {
      query = new Query<T>(key, mergedOptions)
      this.cache.set(key, query)
    } else {
      // Use the updateOptions method for existing queries
      query.updateOptions(mergedOptions)
    }

    // Check cache size limit
    if (this.config.maxCacheSize != null && this.cache.size() > this.config.maxCacheSize) {
      this.config.logger?.warn?.('Cache size limit exceeded', { size: this.cache.size(), limit: this.config.maxCacheSize })
    }

    await query.fetch()
    if (query.state.data === null || query.state.data === undefined) {
      throw new Error('Query data is null or undefined')
    }
    return query.state.data
  }

  /**
   * Match a serialized query key against a partial key (prefix or exact)
   */
  private static matchKey (serialized: string, keyPart: QueryKey): boolean {
    try {
      const key = JSON.parse(serialized) as QueryKey
      if (typeof keyPart === 'string') {
        return key === keyPart
      }
      if (Array.isArray(key) && Array.isArray(keyPart)) {
        return keyPart.length <= key.length && keyPart.every((p, i) => QueryClient.deepEqual(key[i], p))
      }
    } catch {
      return false
    }
    return false
  }

  /**
   * Deep equality check for query key segments
   */
  private static deepEqual (a: any, b: any): boolean {
    if (a === b) return true
    if (typeof a !== typeof b) return false
    if (a != null && b != null && typeof a === 'object') {
      if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length) return false
        return a.every((val, idx) => QueryClient.deepEqual(val, b[idx]))
      }
      const aKeys = Object.keys(a)
      const bKeys = Object.keys(b)
      if (aKeys.length !== bKeys.length) return false
      return aKeys.every(key => QueryClient.deepEqual(a[key], b[key]))
    }
    return false
  }

  /**
   * Invalidate (mark stale), refetch matched queries and wait for all to complete.
   */
  async invalidateQueries (keyPart?: QueryKey): Promise<void> {
    const tasks: Array<Promise<void>> = []
    const affectedQueries: string[] = []

    for (const [key, query] of this.cache.entries()) {
      if (keyPart === undefined || QueryClient.matchKey(key, keyPart)) {
        // Store affected query keys for later notification
        affectedQueries.push(key)

        // force stale to refetch even with infinite staleTime
        query.state.updatedAt = 0
        const originalStale = query.options.staleTime
        query.options.staleTime = 0

        // refetch and restore staleTime, catch errors to avoid unhandled rejections
        const task = query.fetch()
          .catch((error) => {
            console.error(`Error refetching query ${key}:`, error)
          })
          .finally(() => {
            query.options.staleTime = originalStale
            // Notify subscribers after fetch completion (success or error)
            query.forceNotify()
          })

        tasks.push(task)
      }
    }

    // Wait for all refetches to complete
    await Promise.all(tasks)

    // Force notification to ensure UI updates after all refetches complete
    for (const key of affectedQueries) {
      this.cache.notifyQueryChange(key)
    }
  }

  /**
   * Run a mutation and call onSuccess/onError callbacks.
   */
  async mutate<TData, TVariables>(
    options: MutationOptions<TData, TVariables>,
    variables: TVariables
  ): Promise<TData> {
    const mutationId = `${Date.now()}-${Math.random()}`
    this.activeMutations.add(mutationId)
    this.notifyMutationSubscribers()

    try {
      const data = await options.mutationFn(variables)
      options.onSuccess?.(data)
      return data
    } catch (error) {
      options.onError?.(error)
      throw error
    } finally {
      this.activeMutations.delete(mutationId)
      this.notifyMutationSubscribers()
    }
  }

  /**
   * Get all queries that match a key pattern
   */
  getQueries (keyPart?: QueryKey): Array<{ key: string, state: QueryState<any> }> {
    const results: Array<{ key: string, state: QueryState<any> }> = []

    for (const [key, query] of this.cache.entries()) {
      if (keyPart === undefined || QueryClient.matchKey(key, keyPart)) {
        results.push({ key, state: query.state })
      }
    }

    return results
  }

  /**
   * Cancel all queries that match a key pattern
   */
  cancelQueries (keyPart?: QueryKey): void {
    for (const [key, query] of this.cache.entries()) {
      if (keyPart === undefined || QueryClient.matchKey(key, keyPart)) {
        query.cancel()
      }
    }
  }

  /**
   * Set query data directly in the cache
   */
  setQueryData<T>(queryKey: QueryKey, data: T | ((oldData: T | undefined) => T)): void {
    const key = JSON.stringify(queryKey)
    let query = this.cache.get<T>(key)

    if (query == null) {
      query = new Query<T>(key, {
        queryKey,
        queryFn: async () => await Promise.resolve(data instanceof Function ? data(undefined) : data),
        ...this.config.defaultOptions?.queries
      })
      this.cache.set(key, query)
    }

    const newData = data instanceof Function ? data(query.state.data) : data
    query.state = {
      data: newData,
      status: QueryStatus.Success,
      updatedAt: Date.now()
    }
    query.forceNotify()
  }

  /**
   * Get query data from cache
   */
  getQueryData<T>(queryKey: QueryKey): T | undefined {
    const key = JSON.stringify(queryKey)
    const query = this.cache.get<T>(key)
    return query?.state.data
  }

  /**
   * Get the number of active mutations
   */
  getActiveMutationCount (): number {
    return this.activeMutations.size
  }

  /**
   * Clear all cached queries and active mutations
   */
  clear (): void {
    this.cache.clear()
    this.activeMutations.clear()
  }

  /**
   * Subscribe to mutation count changes
   */
  subscribeToMutations (callback: () => void): () => void {
    this.mutationSubscribers.add(callback)
    return () => {
      this.mutationSubscribers.delete(callback)
    }
  }

  /**
   * Notify mutation subscribers
   */
  private notifyMutationSubscribers (): void {
    this.mutationSubscribers.forEach(callback => {
      try {
        callback()
      } catch (error) {
        this.config.logger?.error?.('Error in mutation subscriber:', error)
      }
    })
  }
}

/** Global default client */
export const queryClient = QueryClient.getInstance()
