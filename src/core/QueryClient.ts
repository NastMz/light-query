// src/core/QueryClient.ts
import { QueryCache } from '@core/QueryCache'
import { Query } from '@core/Query'
import { QueryOptions, MutationOptions, QueryKey } from '@types'

/**
 * Singleton client for fetching and mutating queries.
 */
export class QueryClient {
  private readonly cache = new QueryCache()
  private static _instance: QueryClient

  /** Get or create the global client */
  static getInstance (): QueryClient {
    this._instance ??= new QueryClient()
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
    const key = JSON.stringify(options.queryKey)
    let query = this.cache.get<T>(key)
    if (query == null) {
      query = new Query<T>(key, options)
      this.cache.set(key, query)
    } else if (options.staleTime !== undefined) {
      // update staleTime if provided to respect new options
      query.options.staleTime = options.staleTime
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
    for (const [key, query] of this.cache.entries()) {
      if (keyPart === undefined || QueryClient.matchKey(key, keyPart)) {
        // force stale to refetch even with infinite staleTime
        query.state.updatedAt = 0
        const originalStale = query.options.staleTime
        query.options.staleTime = 0
        // refetch and restore staleTime, catch errors to avoid unhandled rejections
        const task = query.fetch()
          .catch(() => {})
          .finally(() => { query.options.staleTime = originalStale })
        tasks.push(task)
      }
    }
    await Promise.all(tasks)
  }

  /**
   * Run a mutation and call onSuccess/onError callbacks.
   */
  async mutate<TData, TVariables>(
    options: MutationOptions<TData, TVariables>,
    variables: TVariables
  ): Promise<TData> {
    try {
      const data = await options.mutationFn(variables)
      options.onSuccess?.(data)
      return data
    } catch (error) {
      options.onError?.(error)
      throw error
    }
  }
}

/** Global default client */
export const queryClient = QueryClient.getInstance()
