// src/index.ts
/**
 * Public entrypoints for the light-query package.
 */
export { queryClient, QueryClient } from './core/QueryClient'
export * from './hooks/useQuery'
export * from './hooks/useMutation'
export * from './hooks/useInfiniteQuery'
export * from './hooks/useQueryClient'
export * from './hooks/useIsFetching'
export * from './hooks/useIsMutating'
export { QueryClientProvider } from './react/QueryClientProvider'
export { QueryError, QueryStatus } from './types/index'
export { Logger, LogLevel } from './utils/logger'
export type { QueryKey, QueryOptions, MutationOptions, QueryClientConfig } from './types/index'

// Test utilities (optional export)
export { createMockQueryClient, waitForQuery } from './test-utils/index'
