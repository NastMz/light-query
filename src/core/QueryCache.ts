// src/core/QueryCache.ts
import { Query } from '@core/Query'

/**
 * In-memory cache of Query instances, keyed by JSON.stringify(queryKey).
 */
export class QueryCache {
  private readonly cache = new Map<string, Query<any>>()
  private readonly cleanupTimers = new Map<string, ReturnType<typeof setTimeout>>()
  private static _instance: QueryCache

  static getInstance (): QueryCache {
    this._instance ??= new QueryCache()
    return this._instance
  }

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
    // Cancel any pending cleanup for this key
    const existingTimer = this.cleanupTimers.get(key)
    if (existingTimer != null) {
      clearTimeout(existingTimer)
      this.cleanupTimers.delete(key)
    }

    this.cache.set(key, query)
    return query
  }

  /**
   * Remove a cached Query.
   */
  remove (key: string): void {
    this.cache.delete(key)
    const timer = this.cleanupTimers.get(key)
    if (timer != null) {
      clearTimeout(timer)
      this.cleanupTimers.delete(key)
    }
  }

  /**
   * List all [key, Query] pairs.
   */
  entries (): Array<[string, Query<any>]> {
    return Array.from(this.cache.entries())
  }

  /**
   * Schedule cleanup of a query after timeout.
   */
  scheduleCleanup (key: string, timeout: number): void {
    // Cancel any existing cleanup timer
    const existingTimer = this.cleanupTimers.get(key)
    if (existingTimer != null) {
      clearTimeout(existingTimer)
    }

    // Schedule new cleanup
    const timer = setTimeout(() => {
      this.cache.delete(key)
      this.cleanupTimers.delete(key)
    }, timeout)

    this.cleanupTimers.set(key, timer)
  }

  /**
   * Clear all cached queries.
   */
  clear (): void {
    // Clear all cleanup timers
    this.cleanupTimers.forEach(timer => clearTimeout(timer))
    this.cleanupTimers.clear()

    // Clear cache
    this.cache.clear()
  }

  /**
   * Force notify subscribers of a specific query
   */
  notifyQueryChange (key: string): void {
    const query = this.get(key)
    if (query !== undefined) {
      query.forceNotify()
    }
  }

  /**
   * Get cache size for debugging
   */
  size (): number {
    return this.cache.size
  }
}
