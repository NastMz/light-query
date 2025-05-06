// src/hooks/useQuery.ts
import { useEffect, useContext, useState } from 'react'
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
  if (query == null) {
    query = new Query<T>(key, options)
    cache.set(key, query)
  }

  // Local React state for query result
  const [state, setState] = useState<QueryState<T>>({
    status: QueryStatus.Loading,
    data: undefined,
    error: undefined,
    updatedAt: 0
  })

  // Fetch data on mount or when key changes
  useEffect(() => {
    let isMounted = true
    setState(prev => ({ ...prev, status: QueryStatus.Loading }))
    void query.fetch().then(() => {
      if (isMounted) {
        const s = query.state
        setState({ status: s.status, data: (s.data as T), error: s.error, updatedAt: s.updatedAt })
      }
    })
    return () => { isMounted = false }
  }, [key])

  // Manual refetch
  const refetch = async (): Promise<void> => {
    setState(prev => ({ ...prev, status: QueryStatus.Loading }))
    await query.fetch()
    const s = query.state
    setState({ status: s.status, data: (s.data as T), error: s.error, updatedAt: s.updatedAt })
  }

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
