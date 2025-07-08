// src/hooks/useQuery.ts
import { useEffect, useContext, useState, useCallback } from 'react'
import { Query } from '@core/Query'
import { QueryState, QueryOptions, QueryStatus } from '@types'
import { QueryClient } from '@core/QueryClient'
import { QueryClientContext } from '@react/QueryClientProvider'

/**
 * React hook for fetching data.
 *
 * @template T The type of the data returned by the query function.
 * @param options QueryOptions<T> - The options for the query.
 * @returns { data, error, status, updatedAt, refetch }
 */
export function useQuery<T> (options: QueryOptions<T>): QueryState<T> & { refetch: () => Promise<void> } {
  const client = useContext(QueryClientContext) ?? QueryClient.getInstance()

  // Merge with client's default options
  const mergedOptions: QueryOptions<T> = {
    staleTime: 0,
    cacheTime: 5 * 60_000,
    retry: 0,
    retryDelay: 1000,
    refetchInterval: 0,
    suspense: false,
    ...options
  }

  const key = JSON.stringify(mergedOptions.queryKey)

  // Get or create the Query instance from the provided client
  const cache = client.getQueryCache()
  let query = cache.get<T>(key)

  // If no existing query, create a new one
  if (query == null) {
    query = new Query<T>(key, mergedOptions)
    cache.set(key, query)
  } else {
    // Update options on existing query
    query.updateOptions(mergedOptions)
  }

  // Local React state for query result
  const [state, setState] = useState<QueryState<T>>(() => {
    // Start with loading state if this is a new query
    if (query.state.status === QueryStatus.Idle) {
      return { ...query.state, status: QueryStatus.Loading }
    }
    return { ...query.state }
  })

  // Manual refetch (force bypassing staleTime)
  const refetch = useCallback(async (): Promise<void> => {
    const originalStale = query.options.staleTime

    // Force refetch by setting staleTime to 0 and updatedAt to 0
    query.options.staleTime = 0
    query.state.updatedAt = 0

    try {
      await query.fetch()
      // Don't manually set state here - let the subscription handle it
    } catch (error) {
      // Let the subscription handle errors too
      console.error('Error in refetch:', error)
    } finally {
      query.options.staleTime = originalStale
    }
  }, [query])

  // Subscribe to query updates and fetch on mount or when key changes
  useEffect(() => {
    const handleUpdate = (): void => {
      const s = query.state
      setState({
        status: s.status,
        data: s.data as T,
        error: s.error,
        updatedAt: s.updatedAt
      })
    }

    // Subscribe to updates
    query.subscribe(handleUpdate)

    // Trigger initial fetch
    void query.fetch()

    // Cleanup subscription on unmount or key change
    return () => { query.unsubscribe(handleUpdate) }
  }, [key, query])

  // Suspense integration
  if (options.suspense === true) {
    if (state.status === QueryStatus.Loading) {
      // Create a promise that resolves when the query completes
      const suspensePromise = new Promise((resolve, reject) => {
        const unsubscribe = (): void => {
          query.unsubscribe(handleStateChange)
        }

        const handleStateChange = (): void => {
          if (query.state.status === QueryStatus.Success) {
            unsubscribe()
            resolve(query.state.data)
          } else if (query.state.status === QueryStatus.Error) {
            unsubscribe()
            const error = query.state.error instanceof Error
              ? query.state.error
              : new Error(String(query.state.error))
            reject(error)
          }
        }

        query.subscribe(handleStateChange)
      })

      // eslint-disable-next-line @typescript-eslint/no-throw-literal
      throw suspensePromise
    }

    if (state.status === QueryStatus.Error) {
      throw state.error
    }
  }

  return { ...state, refetch }
}
