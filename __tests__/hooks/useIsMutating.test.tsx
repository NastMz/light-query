// __tests__/hooks/useIsMutating.test.tsx
import React, { ReactNode } from 'react'
import { renderHook, act } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useIsMutating } from '../../src/hooks/useIsMutating'
import { useMutation } from '../../src/hooks/useMutation'
import { QueryClient } from '../../src/core/QueryClient'
import { QueryClientProvider } from '../../src/react/QueryClientProvider'

describe('useIsMutating', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient()
  })

  afterEach(() => {
    queryClient.clear()
  })

  const createWrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  it('should return 0 when no mutations are running', () => {
    const { result } = renderHook(() => useIsMutating(), { wrapper: createWrapper })
    expect(result.current).toBe(0)
  })

  it('should track active mutations', async () => {
    const mutationFn = vi.fn().mockImplementation(async () => {
      await new Promise(resolve => setTimeout(resolve, 100))
      return 'success'
    })

    const TestComponent = () => {
      const mutation = useMutation({ mutationFn })
      const mutatingCount = useIsMutating()
      
      return { mutation, mutatingCount }
    }

    const { result } = renderHook(() => TestComponent(), { wrapper: createWrapper })
    
    // Initially no mutations
    expect(result.current.mutatingCount).toBe(0)
    
    // Start a mutation
    act(() => {
      result.current.mutation.mutate('test')
    })
    
    // Should show 1 active mutation
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50))
    })
    
    expect(result.current.mutatingCount).toBe(1)
    
    // Wait for mutation to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100))
    })
    
    expect(result.current.mutatingCount).toBe(0)
  })

  it('should track multiple concurrent mutations', async () => {
    const mutationFn = vi.fn().mockImplementation(async () => {
      await new Promise(resolve => setTimeout(resolve, 100))
      return 'success'
    })

    const TestComponent = () => {
      const mutation1 = useMutation({ mutationFn })
      const mutation2 = useMutation({ mutationFn })
      const mutatingCount = useIsMutating()
      
      return { mutation1, mutation2, mutatingCount }
    }

    const { result } = renderHook(() => TestComponent(), { wrapper: createWrapper })
    
    // Start two mutations
    act(() => {
      result.current.mutation1.mutate('test1')
      result.current.mutation2.mutate('test2')
    })
    
    // Should show 2 active mutations
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50))
    })
    
    expect(result.current.mutatingCount).toBe(2)
    
    // Wait for mutations to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100))
    })
    
    expect(result.current.mutatingCount).toBe(0)
  })
})
