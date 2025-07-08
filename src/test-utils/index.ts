// src/test-utils/index.ts
import { QueryClient } from '@core/QueryClient'
import { QueryKey, QueryState, QueryClientConfig } from '@types'

/**
 * Creates a mock QueryClient for testing with sane defaults
 */
export function createMockQueryClient (config: QueryClientConfig = {}): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: 0,
        staleTime: 0,
        cacheTime: 0,
        refetchInterval: 0,
        ...config.defaultOptions?.queries
      },
      mutations: {
        ...config.defaultOptions?.mutations
      }
    },
    logger: {
      error: () => {},
      warn: () => {}
    },
    ...config
  })
}

/**
 * Utility to wait for a query to reach a certain state
 */
export async function waitForQuery<T> (
  client: QueryClient,
  queryKey: QueryKey,
  timeout = 5000
): Promise<QueryState<T>> {
  return await new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`Query ${JSON.stringify(queryKey)} did not complete within ${timeout}ms`))
    }, timeout)

    const key = JSON.stringify(queryKey)
    const query = client.getQueryCache().get<T>(key)

    if (query == null) {
      clearTimeout(timeoutId)
      reject(new Error(`Query ${key} not found`))
      return
    }

    const checkState = (): void => {
      if (query.state.status === 'success' || query.state.status === 'error') {
        clearTimeout(timeoutId)
        query.unsubscribe(checkState)
        resolve(query.state)
      }
    }

    query.subscribe(checkState)
  })
}
