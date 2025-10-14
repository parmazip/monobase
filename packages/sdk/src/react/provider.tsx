import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthQueryProvider } from '@daveyplate/better-auth-tanstack'
import { setApiBaseUrl } from '../api'
import { initAuthClient, AuthClientContext } from './auth'
import type { ReactNode } from 'react'
import { useEffect, useRef, useMemo } from 'react'

export interface ApiProviderProps {
  queryClient?: QueryClient  // Optional - creates default if not provided
  apiBaseUrl: string
  children: ReactNode
}

// Default QueryClient configuration
const createDefaultQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
      gcTime: 1000 * 5,
    },
  },
})

export function ApiProvider({
  queryClient: providedQueryClient,
  apiBaseUrl,
  children
}: ApiProviderProps) {
  // Use provided queryClient or create a default one
  const queryClient = useMemo(
    () => providedQueryClient || createDefaultQueryClient(),
    [providedQueryClient]
  )

  // Initialize auth client and API base URL only once
  const authClient = useMemo(() => {
    setApiBaseUrl(apiBaseUrl)
    return initAuthClient(apiBaseUrl)
  }, [apiBaseUrl])

  return (
    <QueryClientProvider client={queryClient}>
      <AuthQueryProvider>
        <AuthClientContext.Provider value={authClient}>
          {children}
        </AuthClientContext.Provider>
      </AuthQueryProvider>
    </QueryClientProvider>
  )
}