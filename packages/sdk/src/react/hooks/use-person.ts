import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  getMyProfile,
  createMyPerson,
  updateMyPersonalInfo,
  updateMyContactInfo,
  updateMyAddress,
  updateMyPreferences,
  type Person,
  type CreatePersonData,
  type PersonalInfo,
  type OptionalAddress,
  type ContactInfo,
  type Preferences,
} from '../../services/person'
import { queryKeys } from '../query-keys'
import { ApiError } from '../../api'

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook to get the current person's person profile
 */
export function useMyPerson() {
  return useQuery({
    queryKey: queryKeys.personProfile('me'),
    queryFn: getMyProfile,
    retry: (failureCount, error) => {
      // Don't retry if:
      // - User is not authenticated (401) - retrying won't help
      // - Person profile doesn't exist (404) - expected for onboarding flow
      if (error instanceof ApiError && (error.status === 401 || error.status === 404)) {
        return false
      }
      return failureCount < 3
    },
  })
}

/**
 * Hook to create a new person profile for the current user
 */
export function useCreateMyPerson(options?: {
  onSuccess?: (data: Person) => void
  onError?: (error: Error) => void
}) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createMyPerson,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.person() })
      toast.success('Profile created successfully!')
      options?.onSuccess?.(data)
    },
    onError: (error) => {
      console.error('Failed to create person profile:', error)
      if (error instanceof ApiError) {
        toast.error(error.message || 'Failed to create profile')
      } else {
        toast.error('Failed to create profile. Please try again.')
      }
      options?.onError?.(error)
    },
  })
}

/**
 * Hook to update the current user's personal information
 */
export function useUpdateMyPersonalInfo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateMyPersonalInfo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.personProfile('me') })
      toast.success('Personal information updated successfully!')
    },
    onError: (err) => {
      console.error('Failed to update personal information:', err)
      if (err instanceof ApiError) {
        toast.error(err.message || 'Failed to update personal information')
      } else {
        toast.error('Failed to update personal information. Please try again.')
      }
    },
  })
}

/**
 * Hook to update the current user's contact information
 */
export function useUpdateMyContactInfo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateMyContactInfo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.personProfile('me') })
      toast.success('Contact information updated successfully!')
    },
    onError: (err) => {
      console.error('Failed to update contact information:', err)
      if (err instanceof ApiError) {
        toast.error(err.message || 'Failed to update contact information')
      } else {
        toast.error('Failed to update contact information. Please try again.')
      }
    },
  })
}

/**
 * Hook to update the current user's address
 */
export function useUpdateMyAddress() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateMyAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.personProfile('me') })
      toast.success('Address updated successfully!')
    },
    onError: (err) => {
      console.error('Failed to update address:', err)
      if (err instanceof ApiError) {
        toast.error(err.message || 'Failed to update address')
      } else {
        toast.error('Failed to update address. Please try again.')
      }
    },
  })
}

/**
 * Hook to update the current user's preferences
 */
export function useUpdateMyPreferences() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateMyPreferences,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.personProfile('me') })
      toast.success('Preferences updated successfully!')
    },
    onError: (err) => {
      console.error('Failed to update preferences:', err)
      if (err instanceof ApiError) {
        toast.error(err.message || 'Failed to update preferences')
      } else {
        toast.error('Failed to update preferences. Please try again.')
      }
    },
  })
}
