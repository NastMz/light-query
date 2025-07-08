// src/hooks/useQueryClient.ts
import { useContext } from 'react'
import { QueryClient } from '@core/QueryClient'
import { QueryClientContext } from '@react/QueryClientProvider'

/**
 * Hook to get the current QueryClient instance
 */
export function useQueryClient (): QueryClient {
  const client = useContext(QueryClientContext)
  return client ?? QueryClient.getInstance()
}
