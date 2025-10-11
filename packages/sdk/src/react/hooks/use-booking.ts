import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  searchProviders,
  getProviderWithSlots,
  type SearchProvidersParams,
  type PaginatedProviders,
} from '../../services/booking'
import type { ProviderWithSlots } from '../../types'
import { queryKeys } from '../query-keys'
import { ApiError } from '../../api'

// ============================================================================
// Provider Search Hooks
// ============================================================================

/**
 * Hook to search providers with filters
 */
export function useSearchProviders(params: SearchProvidersParams) {
  return useQuery({
    queryKey: queryKeys.bookingProviders(params as Record<string, unknown>),
    queryFn: () => searchProviders(params),
    retry: (failureCount, error) => {
      // Don't retry on client errors (4xx)
      if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
        return false
      }
      return failureCount < 3
    },
  })
}

/**
 * Hook to get provider with available slots and event data
 */
export function useProviderWithSlots(providerId: string, options?: {
  enabled?: boolean
  onError?: (error: Error) => void
}) {
  return useQuery({
    queryKey: queryKeys.bookingProviderSlots(providerId),
    queryFn: () => getProviderWithSlots(providerId),
    enabled: options?.enabled !== false && !!providerId,
    retry: (failureCount, error) => {
      // Don't retry on 404 (provider not found)
      if (error instanceof ApiError && error.status === 404) {
        return false
      }
      return failureCount < 3
    },
    meta: {
      onError: (error: Error) => {
        console.error('Failed to fetch provider slots:', error)
        if (error instanceof ApiError) {
          toast.error(error.message || 'Failed to load provider availability')
        } else {
          toast.error('Failed to load provider availability. Please try again.')
        }
        options?.onError?.(error)
      },
    },
  })
}
