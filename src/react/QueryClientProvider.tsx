// src/react/QueryClientProvider.tsx
import React, { createContext } from 'react'
import { QueryClient } from '@core/QueryClient'

/**
 * React Context to provide a QueryClient instance.
 */
export const QueryClientContext = createContext<QueryClient | null>(null)

/**
 * Wrap your app with this provider to supply the client to all hooks.
 */
export const QueryClientProvider: React.FC<{
  client: QueryClient
  children: React.ReactNode
}> = ({
  client,
  children
}) => (
  <QueryClientContext.Provider value={client}>
    {children}
  </QueryClientContext.Provider>
)
