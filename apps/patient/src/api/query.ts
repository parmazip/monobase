// Re-export SDK query keys and client
export { queryKeys } from '@monobase/sdk/react/query-keys'

// Create query client instance (should match SDK provider)
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 3,
    },
  },
})
