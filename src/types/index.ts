// src/types/index.ts
/**
 * Shared type definitions and enums for light-query.
 */

/**
 * Custom error class for query-related errors.
 */
export class QueryError extends Error {
  constructor (
    message: string,
    public readonly queryKey: QueryKey,
    public readonly originalError?: unknown
  ) {
    super(message)
    this.name = 'QueryError'

    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, QueryError.prototype)
  }
}

/**
 * A unique cache key for a query.
 */
export type QueryKey = string | any[]

/**
 * A function returning a Promise of data with optional AbortSignal.
 */
export type QueryFn<T> = (context?: { signal?: AbortSignal }) => Promise<T>

/**
 * Possible statuses for queries and mutations.
 */
export enum QueryStatus {
  Idle = 'idle', // No request yet
  Loading = 'loading', // Request in progress
  Success = 'success', // Request succeeded
  Error = 'error', // Request failed
}

/**
 * Internal state container for a query.
 * @template T  The type of data returned by the query.
 */
export interface QueryState<T> {
  data?: T
  error?: unknown
  status: QueryStatus
  updatedAt: number // Timestamp of last successful fetch or error
}

/**
 * Configuration options for useQuery / fetchQuery.
 * @template T  The type returned by queryFn.
 */
export interface QueryOptions<T> {
  queryKey: QueryKey // Unique identifier
  queryFn: QueryFn<T> // Async function to fetch data
  staleTime?: number // ms before cache is considered stale
  cacheTime?: number // ms before unused cache is garbage-collected
  retry?: number // Number of retry attempts on error
  retryDelay?: number // Delay between retries (ms)
  refetchInterval?: number // Auto-refetch interval (ms)
  suspense?: boolean // Enable React Suspense (throws promise/error)
}

/**
 * A function that performs a mutation.
 * @template TData      The type of data returned on success.
 * @template TVariables The type of variables passed in.
 */
export type MutationFn<TData, TVariables> = (vars: TVariables) => Promise<TData>

/**
 * Configuration options for useMutation.
 * @template TData
 * @template TVariables
 */
export interface MutationOptions<TData, TVariables> {
  mutationFn: MutationFn<TData, TVariables>
  onSuccess?: (data: TData) => void // Callback on success
  onError?: (error: unknown) => void // Callback on error
}

/**
 * Global configuration for QueryClient
 */
export interface QueryClientConfig {
  defaultOptions?: {
    queries?: Partial<Omit<QueryOptions<any>, 'queryKey' | 'queryFn'>>
    mutations?: Partial<Omit<MutationOptions<any, any>, 'mutationFn'>>
  }
  maxCacheSize?: number
  logger?: {
    error?: (message: string, meta?: any) => void
    warn?: (message: string, meta?: any) => void
  }
}
