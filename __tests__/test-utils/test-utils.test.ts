// __tests__/test-utils/test-utils.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { createMockQueryClient, waitForQuery } from '../../src/test-utils/index'
import { QueryStatus } from '../../src/types/index'

describe('Test Utils', () => {
  let client: ReturnType<typeof createMockQueryClient>

  beforeEach(() => {
    client = createMockQueryClient({
      defaultOptions: {
        queries: {
          staleTime: 1000,
          cacheTime: 2000
        }
      }
    })
  })

  it('createMockQueryClient should create a client with default options', () => {
    expect(client).toBeDefined()
    expect(client.getQueryCache).toBeDefined()
  })

  it('should use provided default options', async () => {
    const result = await client.fetchQuery({
      queryKey: ['test'],
      queryFn: async () => 'test data'
    })

    expect(result).toBe('test data')
  })

  it('waitForQuery should resolve when query completes', async () => {
    // Start a query
    const queryPromise = client.fetchQuery({
      queryKey: ['wait-test'],
      queryFn: async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
        return 'completed'
      }
    })

    // Wait for it to complete
    const state = await waitForQuery(client, ['wait-test'])
    
    expect(state.status).toBe(QueryStatus.Success)
    expect(state.data).toBe('completed')
    
    // Ensure the original promise also resolves
    await expect(queryPromise).resolves.toBe('completed')
  })

  it('waitForQuery should reject on timeout', async () => {
    // Start a query that takes too long
    const queryPromise = client.fetchQuery({
      queryKey: ['timeout-test'],
      queryFn: async () => {
        await new Promise(resolve => setTimeout(resolve, 1000))
        return 'too slow'
      }
    })

    // Wait for it with a short timeout
    await expect(waitForQuery(client, ['timeout-test'], 50))
      .rejects.toThrow('did not complete within 50ms')

    // Clean up the long-running query
    queryPromise.catch(() => {}) // Ignore the error
  })
})
