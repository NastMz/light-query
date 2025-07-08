// src/hooks/useIsMutating.ts
import { useState, useEffect } from 'react'
import { useQueryClient } from './useQueryClient'

/**
 * Hook to check if any mutations are currently running
 */
export function useIsMutating (): number {
  const client = useQueryClient()
  const [count, setCount] = useState(() => client.getActiveMutationCount())

  useEffect(() => {
    const unsubscribe = client.subscribeToMutations(() => {
      setCount(client.getActiveMutationCount())
    })

    return unsubscribe
  }, [client])

  return count
}
