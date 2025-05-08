// src/core/QueryClient.ts
import { QueryCache } from '@core/QueryCache'
import { Query } from '@core/Query'
import { QueryOptions, MutationOptions, QueryKey } from '@types'

/**
 * Singleton client for fetching and mutating queries.
 */
export class QueryClient {
  private readonly cache = QueryCache.getInstance()
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
    } else {
      // Use the updateOptions method for existing queries
      query.updateOptions(options)
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
