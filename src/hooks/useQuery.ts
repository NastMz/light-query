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
  const key = JSON.stringify(options.queryKey)

  // Get or create the Query instance from the provided client
  const cache = client.getQueryCache()
  let query = cache.get<T>(key)

  // If no existing query, create a new one
  if (query == null) {
    query = new Query<T>(key, options)
    cache.set(key, query)
  } else {
    // Update options on existing query
    query.updateOptions(options)
  }

  // Local React state for query result
  const [state, setState] = useState<QueryState<T>>(() => ({ ...query.state }))

  // Manual refetch (force bypassing staleTime)
  const refetch = useCallback(async (): Promise<void> => {
    setState(prev => ({ ...prev, status: QueryStatus.Loading }))
    const originalStale = query.options.staleTime
    query.options.staleTime = 0
    try {
      await query.fetch()
      // Update our local state with the latest query state
      setState({ ...query.state })
    } catch (error) {
      // Handle error and update state
      setState({
        status: QueryStatus.Error,
        error,
        updatedAt: Date.now()
      })
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
  if (options.suspense === true && state.status === QueryStatus.Loading) {
    // eslint-disable-next-line @typescript-eslint/no-throw-literal
    throw query.fetch()
  }
  if (options.suspense === true && state.status === QueryStatus.Error) {
    throw state.error
  }

  return { ...state, refetch }
}
