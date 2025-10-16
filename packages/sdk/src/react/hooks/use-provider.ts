import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../query-keys'
import * as providerService from '../../services/provider'
import type {
  Provider,
  ProviderQueryParams,
  ProviderCreateRequest,
  ProviderUpdateRequest,
} from '../../services/provider'
import type { Person } from '../../services/person'
import { ApiError } from '../../api'

/**
 * Provider Hooks
 * React Query hooks for provider data management
 */

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * List providers with optional filtering
 */
export function useProviders(params?: ProviderQueryParams) {
  return useQuery({
    queryKey: queryKeys.providersList(params),
    queryFn: () => providerService.listProviders(params),
  })
}

/**
 * Get a specific provider by ID
 * Person is automatically expanded for better DX
 */
export function useProvider(id: string) {
  return useQuery({
    queryKey: queryKeys.provider(id),
    queryFn: () => providerService.getProvider(id),
    enabled: !!id,
  })
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Create a new provider profile
 */
export function useCreateProvider() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ProviderCreateRequest) =>
      providerService.createProvider(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.providers() })
    },
  })
}

/**
 * Update an existing provider profile
 */
export function useUpdateProvider() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: ProviderUpdateRequest }) =>
      providerService.updateProvider(id, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.provider(variables.id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.providers() })
    },
  })
}

/**
 * Delete a provider profile
 */
export function useDeleteProvider() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => providerService.deleteProvider(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.provider(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.providers() })
    },
  })
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Transform provider for UI card display
 */
export function transformProviderForCard(provider: Provider) {
  const person = provider.person as Person

  return {
    id: provider.id,
    name: `${person.firstName} ${person.lastName}`,
    title: computeProviderTitle(provider.providerType, provider.yearsOfExperience),
    avatar: person.avatar?.url,
    bio: provider.biography,
    specialties: provider.minorAilmentsSpecialties || [],
    practiceLocations: provider.minorAilmentsPracticeLocations || [],
    languages: person.languagesSpoken || [],
  }
}

/**
 * Compute provider title based on type and experience
 */
function computeProviderTitle(providerType: string, yearsOfExperience?: number): string {
  if (providerType === 'pharmacist') {
    const years = yearsOfExperience ?? 0
    if (years >= 15) return 'Senior Pharmacist'
    if (years >= 10) return 'Clinical Pharmacist'
    if (years >= 5) return 'Consultant Pharmacist'
    return 'Pharmacist'
  }
  return 'Healthcare Provider'
}

// ============================================================================
// "My" Provider Hooks (Current User)
// ============================================================================

/**
 * Get current user's provider profile
 */
export function useMyProvider() {
  return useQuery({
    queryKey: ['provider', 'me'],
    queryFn: providerService.getMyProvider,
    retry: (failureCount, error: any) => {
      // Don't retry if:
      // - User is not authenticated (401) - retrying won't help
      // - Profile doesn't exist (404) - expected for onboarding flow
      if (error instanceof ApiError && (error.status === 401 || error.status === 404)) {
        return false
      }
      return failureCount < 3
    },
  })
}

/**
 * Create provider profile for current user
 */
export function useCreateMyProvider() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Omit<ProviderCreateRequest, 'person'>) =>
      providerService.createMyProvider(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider', 'me'] })
      queryClient.invalidateQueries({ queryKey: queryKeys.providers() })
    },
  })
}

/**
 * Update current user's provider profile
 */
export function useUpdateMyProvider() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (updates: ProviderUpdateRequest) =>
      providerService.updateMyProvider(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider', 'me'] })
      queryClient.invalidateQueries({ queryKey: queryKeys.providers() })
    },
  })
}

/**
 * Delete current user's provider profile
 */
export function useDeleteMyProvider() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => providerService.deleteMyProvider(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider', 'me'] })
      queryClient.invalidateQueries({ queryKey: queryKeys.providers() })
    },
  })
}
