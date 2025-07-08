// __tests__/core/QueryClient.config.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { QueryClient } from '../../src/core/QueryClient'
import { QueryError } from '../../src/types/index'

describe('QueryClient Configuration', () => {
  let client: QueryClient

  beforeEach(() => {
    client = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 5000,
          cacheTime: 10000,
          retry: 3,
          retryDelay: 2000
        }
      },
      maxCacheSize: 100
    })
  })

  afterEach(() => {
    // Clean up after each test
    client.getQueryCache().clear()
  })

  it('should use default options for queries', async () => {
    const mockFn = vi.fn().mockResolvedValue('test data')
    
    await client.fetchQuery({
      queryKey: ['test'],
      queryFn: mockFn
    })

    // Should use default options
    const query = client.getQueryCache().get('["test"]')
    expect(query?.options.staleTime).toBe(5000)
    expect(query?.options.cacheTime).toBe(10000)
    expect(query?.options.retry).toBe(3)
    expect(query?.options.retryDelay).toBe(2000)
  })

  it('should allow overriding default options', async () => {
    const mockFn = vi.fn().mockResolvedValue('test data')
    
    await client.fetchQuery({
      queryKey: ['test'],
      queryFn: mockFn,
      staleTime: 1000, // Override default
      retry: 1 // Override default
    })

    const query = client.getQueryCache().get('["test"]')
    expect(query?.options.staleTime).toBe(1000) // Overridden
    expect(query?.options.retry).toBe(1) // Overridden
    expect(query?.options.cacheTime).toBe(10000) // Still default
  })

  it('should handle QueryError correctly', () => {
    const error = new QueryError('Test error', ['test-key'], new Error('Original'))
    
    expect(error.message).toBe('Test error')
    expect(error.queryKey).toEqual(['test-key'])
    expect(error.originalError).toBeInstanceOf(Error)
    expect(error.name).toBe('QueryError')
    expect(error instanceof QueryError).toBe(true)
    expect(error instanceof Error).toBe(true)
  })

  it('should provide cache size information', async () => {
    // Clear any existing cache
    client.getQueryCache().clear()
    expect(client.getQueryCache().size()).toBe(0)
    
    // Add some queries
    await client.fetchQuery({
      queryKey: ['test1'],
      queryFn: () => Promise.resolve('data1')
    })
    
    await client.fetchQuery({
      queryKey: ['test2'],
      queryFn: () => Promise.resolve('data2')
    })
    
    expect(client.getQueryCache().size()).toBe(2)
  })
})
