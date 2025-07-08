// __tests__/hooks/useQueryClient.test.ts
import { renderHook } from '@testing-library/react'
import { useQueryClient } from '../../src/hooks/useQueryClient'
import { QueryClient } from '../../src/core/QueryClient'
import { describe, it, expect } from 'vitest'

describe('useQueryClient', () => {
  it('should return the global QueryClient instance', () => {
    const { result } = renderHook(() => useQueryClient())
    
    expect(result.current).toBeInstanceOf(QueryClient)
    expect(result.current).toBe(QueryClient.getInstance())
  })
})
