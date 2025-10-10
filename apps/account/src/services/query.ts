import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // How long data is considered fresh (no background refetch)
      staleTime: 1000 * 60 * 5, // 5 minutes
      // How long to keep data in cache
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
      // Retry failed requests
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch on window focus
      refetchOnWindowFocus: true,
      // Refetch on network reconnect
      refetchOnReconnect: true,
    },
    mutations: {
      // Retry failed mutations
      retry: 1,
      // Show error for 5 seconds
      gcTime: 1000 * 5,
    },
  },
})

// Query keys factory for consistent key management
export const queryKeys = {
  all: [] as const,

  // Person & Provider (adapted for provider app)
  person: () => [...queryKeys.all, 'person'] as const,
  personProfile: (id?: string) => [...queryKeys.person(), id] as const,
  provider: () => [...queryKeys.all, 'provider'] as const,
  providerProfile: (id?: string) => [...queryKeys.provider(), id] as const,

  // Notifications
  notifications: () => [...queryKeys.all, 'notifications'] as const,
  notificationsList: (params?: any) =>
    [...queryKeys.notifications(), 'list', params] as const,
  notification: (id: string) => [...queryKeys.notifications(), id] as const,

} as const
