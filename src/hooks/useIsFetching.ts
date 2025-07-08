// src/hooks/useIsFetching.ts
import { useState, useEffect } from 'react'
import { QueryKey } from '@types'
import { useQueryClient } from './useQueryClient'

/**
 * Hook to check if any queries are currently fetching
 */
export function useIsFetching (queryKey?: QueryKey): number {
  const client = useQueryClient()
  const [fetchingCount, setFetchingCount] = useState(0)

  useEffect(() => {
    const updateCount = (): void => {
      const queries = client.getQueries(queryKey)
      const loading = queries.filter(q => q.state.status === 'loading').length
      setFetchingCount(loading)
    }

    // Initial count
    updateCount()

    // Set up interval to check periodically
    const interval = setInterval(updateCount, 100)

    return () => {
      clearInterval(interval)
    }
  }, [client, queryKey])

  return fetchingCount
}
