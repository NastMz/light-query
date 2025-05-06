// src/core/QueryCache.ts
import { Query } from '@core/Query'

/**
 * In-memory cache of Query instances, keyed by JSON.stringify(queryKey).
 */
export class QueryCache {
  private readonly cache = new Map<string, Query<any>>()

  /**
   * Retrieve a Query by key.
   */
  get<T>(key: string): Query<T> | undefined {
    return this.cache.get(key) as Query<T>
  }

  /**
   * Store a Query instance under the given key.
   */
  set<T>(key: string, query: Query<T>): Query<T> {
    this.cache.set(key, query)
    return query
  }

  /**
   * Remove a cached Query.
   */
  remove (key: string): void {
    this.cache.delete(key)
  }

  /**
   * List all [key, Query] pairs.
   */
  entries (): Array<[string, Query<any>]> {
    return Array.from(this.cache.entries())
  }
}
