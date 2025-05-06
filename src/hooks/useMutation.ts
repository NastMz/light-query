// src/hooks/useMutation.ts
import { useContext, useState } from 'react'
import { MutationOptions, QueryStatus, QueryState } from '@types'
import { QueryClient } from '@core/QueryClient'
import { QueryClientContext } from '@react/QueryClientProvider'

/**
 * React hook for performing mutations.
 *
 * @template TData, TVariables The type of the data returned by the mutation function and the type of the variables passed to it.
 * @param options MutationOptions<TData, TVariables>
 * @returns { mutate, status, data, error }
 */
export function useMutation<TData, TVariables> (
  options: MutationOptions<TData, TVariables>
): { mutate: (vars: TVariables) => Promise<TData> } & Pick<QueryState<TData>, 'status' | 'data' | 'error'> {
  // Use context client if available, otherwise fallback
  const ctxClient = useContext(QueryClientContext)
  const client = ctxClient ?? QueryClient.getInstance()
  const [state, setState] = useState<{
    status: QueryStatus
    data?: TData
    error?: unknown
  }>({ status: QueryStatus.Idle })

  const mutate = async (vars: TVariables): Promise<TData> => {
    setState({ status: QueryStatus.Loading })
    try {
      const data = await client.mutate(options, vars)
      setState({ status: QueryStatus.Success, data })
      return data
    } catch (error) {
      setState({ status: QueryStatus.Error, error })
      throw error
    }
  }

  return { mutate, status: state.status, data: state.data, error: state.error }
}
