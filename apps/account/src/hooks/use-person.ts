import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { toast } from 'sonner'
import {
  getMyProfile,
  createPerson,
  updatePersonalInfo,
  updateContactInfo,
  updateAddress,
  updatePreferences,
  type PersonResponse,
  type PersonCreateRequest
} from '@/api/person'
import { queryKeys } from '@/api/query'
import { ApiError } from '@/api/client'
import { detectTimezone } from '@monobase/ui/lib/detect-timezone'
import type { PersonalInfo, OptionalAddress, ContactInfo, Preferences } from '@monobase/ui/person/schemas'

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Transform API Person data to frontend form format
 */
function getPersonFormData(person: PersonResponse) {
  return {
    personalInfo: {
      firstName: person.firstName || '',
      lastName: person.lastName || '',
      middleName: person.middleName || '',
      dateOfBirth: person.dateOfBirth ? new Date(person.dateOfBirth) : new Date(),
      gender: person.gender as PersonalInfo['gender'] || undefined,
      avatar: person.avatar,
    },
    contactInfo: {
      email: (person as any).contactInfo?.email || '',
      phone: (person as any).contactInfo?.phone || '',
    },
    address: {
      street1: (person as any).primaryAddress?.street1 || '',
      street2: (person as any).primaryAddress?.street2 || '',
      city: (person as any).primaryAddress?.city || '',
      state: (person as any).primaryAddress?.state || '',
      postalCode: (person as any).primaryAddress?.postalCode || '',
      country: (person as any).primaryAddress?.country || '',
    },
    preferences: {
      languagesSpoken: person.languagesSpoken || ['en'],
      timezone: person.timezone || detectTimezone(),
    }
  }
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook to get the current person's person profile
 */
export function usePersonProfile() {
  return useQuery({
    queryKey: queryKeys.personProfile('me'),
    queryFn: getMyProfile,
    retry: (failureCount, error) => {
      // Don't retry if the person doesn't have a profile (404)
      if (error instanceof ApiError && error.status === 404) {
        return false
      }
      return failureCount < 3
    },
  })
}

/**
 * Hook to create a new person profile
 */
export function useCreatePerson(options?: {
  onSuccess?: (data: PersonResponse) => void
  onError?: (error: Error) => void
}) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createPerson,
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
 * Hook to update person's personal information
 */
export function useUpdatePersonalInfo(personId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: PersonalInfo) => updatePersonalInfo(personId, data),
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
 * Hook to update person's contact information
 */
export function useUpdateContactInfo(personId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ContactInfo) => updateContactInfo(personId, data),
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
 * Hook to update person's address
 */
export function useUpdateAddress(personId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: OptionalAddress) => updateAddress(personId, data),
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
 * Hook to update person's preferences
 */
export function useUpdatePreferences(personId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Preferences) => updatePreferences(personId, data),
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

/**
 * Hook to get person form data ready for components
 */
export function usePersonFormData() {
  const { data: person, ...rest } = usePersonProfile()

  // Memoize the form data to prevent infinite loops
  // Recalculate when person object changes (including nested fields)
  const formData = useMemo(() => {
    return person ? getPersonFormData(person) : null
  }, [person])

  return {
    data: formData,
    person, // Also expose raw person data if needed
    ...rest
  }
}
