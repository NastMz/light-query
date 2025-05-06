// src/hooks/useInfiniteQuery.ts
import { useState, useEffect, useContext } from 'react'
import { QueryState, QueryStatus } from '@types'
import { QueryClient } from '@core/QueryClient'
import { QueryClientContext } from '@react/QueryClientProvider'

type InfiniteQueryFn<T> = ({
  pageParam,
  queryKey
}: {
  pageParam?: any
  queryKey: string
}) => Promise<T>

export interface InfiniteQueryOptions<T> {
  queryKey: string[]
  queryFn: InfiniteQueryFn<T>
  getNextPageParam?: (lastPage: T, pages: T[]) => any
  staleTime?: number
  cacheTime?: number
  retry?: number
  retryDelay?: number
  refetchInterval?: number
  suspense?: boolean
}

/**
 * React hook for cursor/paginated queries.
 *
 * @template T The type of the data returned by the query function.
 */
export function useInfiniteQuery<T> (
  options: InfiniteQueryOptions<T>
): QueryState<T> & { pages: T[], fetchNextPage: () => Promise<void> } {
  // Use context client if available, else global singleton
  const ctxClient = useContext(QueryClientContext)
  const client = ctxClient ?? QueryClient.getInstance()
  const key = JSON.stringify(options.queryKey)

  const [pages, setPages] = useState<T[]>([])
  const [state, setState] = useState<QueryState<T>>({ status: QueryStatus.Idle, updatedAt: 0 })

  // Fetch one page
  const fetchPage = async (pageParam?: any): Promise<T> => {
    return await client.fetchQuery({
      queryKey: [...options.queryKey, pageParam],
      queryFn: async () => await options.queryFn({ pageParam, queryKey: key }),
      staleTime: options.staleTime,
      cacheTime: options.cacheTime,
      retry: options.retry,
      retryDelay: options.retryDelay,
      refetchInterval: options.refetchInterval,
      suspense: options.suspense
    })
  }

  // Fetch next page and append
  const fetchNextPage = async (): Promise<void> => {
    const lastPage = pages[pages.length - 1]
    const nextParam = options.getNextPageParam?.(lastPage, pages)
    const newPage = await fetchPage(nextParam)
    setPages(prev => [...prev, newPage])
  }

  // Initial load
  useEffect(() => {
    void (async (): Promise<void> => {
      setState({ status: QueryStatus.Loading, updatedAt: 0 })
      try {
        const first = await fetchPage()
        setPages([first])
        setState({ status: QueryStatus.Success, data: first, updatedAt: Date.now() })
      } catch (error) {
        setState({ status: QueryStatus.Error, error, updatedAt: Date.now() })
      }
    })()
  }, [key])

  return { ...state, pages, fetchNextPage }
}
