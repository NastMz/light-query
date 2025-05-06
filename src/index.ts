// src/index.ts
/**
 * Public entrypoints for the light-query package.
 */
export { queryClient, QueryClient } from './core/QueryClient'
export * from './hooks/useQuery'
export * from './hooks/useMutation'
export * from './hooks/useInfiniteQuery'
export { QueryClientProvider } from './react/QueryClientProvider'
