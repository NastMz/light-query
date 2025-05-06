// src/hooks/useQuery.ts
import { useState, useEffect, useContext } from 'react'
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

  // Local state sync
  const [state, setState] = useState<QueryState<T>>(query.state)

  useEffect(() => {
    const onChange = (): void => setState({ ...query.state })
    query.subscribe(onChange)
    void query.fetch() // fetch on mount or key change
    return () => query.unsubscribe(onChange)
  }, [key])

  // Suspense integration
  if (options.suspense === true && state.status === QueryStatus.Loading) {
    // eslint-disable-next-line @typescript-eslint/no-throw-literal
    throw query.fetch()
  }
  if (options.suspense === true && state.status === QueryStatus.Error) {
    throw state.error
  }

  return { ...state, refetch: async () => await query.fetch() }
}
