import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  searchProviders,
  getProviderWithSlots,
  type SearchProvidersParams,
} from '../../services/booking'
import type { ProviderWithSlots, BookingTimeSlot } from '../../services/booking'
import { queryKeys } from '../query-keys'
import { ApiError, apiGet } from '../../api'
import type { components } from '@monobase/api-spec/types'

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

/**
 * Hook to get a single time slot by ID
 */
export function useTimeSlot(slotId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['booking', 'slots', slotId],
    queryFn: async () => {
      const slot = await apiGet<components["schemas"]["TimeSlot"]>(`/booking/slots/${slotId}`, { expand: 'event' })
      return slot
    },
    enabled: options?.enabled !== false && !!slotId,
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.status === 404) {
        return false
      }
      return failureCount < 3
    },
  })
}

// ============================================================================
// Provider Availability Management Hooks
// ============================================================================

import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getMyBookingEvent,
  upsertMyBookingEvent,
  getMyAvailability,
  createAvailabilitySlot,
  updateAvailabilitySlot,
  deleteAvailabilitySlot,
  createRecurringAvailability,
  type GetAvailabilityParams,
} from '../../services/booking'

/**
 * Hook to get provider's own booking event configuration
 */
export function useMyBookingEvent() {
  return useQuery({
    queryKey: ['booking', 'event', 'me'],
    queryFn: getMyBookingEvent,
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.status === 404) {
        return false
      }
      return failureCount < 3
    },
  })
}

/**
 * Hook to create/update booking event
 */
export function useUpsertBookingEvent() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: upsertMyBookingEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking', 'event', 'me'] })
      toast.success('Booking settings updated successfully')
    },
    onError: (error: Error) => {
      console.error('Failed to update booking settings:', error)
      toast.error('Failed to update booking settings')
    },
  })
}

/**
 * Hook to get provider's availability slots
 */
export function useMyAvailability(params?: GetAvailabilityParams) {
  return useQuery({
    queryKey: ['booking', 'availability', 'me', params],
    queryFn: () => getMyAvailability(params),
    retry: 3,
  })
}

/**
 * Hook to create availability slot
 */
export function useCreateAvailabilitySlot() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: createAvailabilitySlot,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking', 'availability', 'me'] })
      toast.success('Availability slot created')
    },
    onError: (error: Error) => {
      console.error('Failed to create availability slot:', error)
      toast.error('Failed to create availability slot')
    },
  })
}

/**
 * Hook to update availability slot
 */
export function useUpdateAvailabilitySlot() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ slotId, data }: { slotId: string; data: Parameters<typeof updateAvailabilitySlot>[1] }) => 
      updateAvailabilitySlot(slotId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking', 'availability', 'me'] })
      toast.success('Availability slot updated')
    },
    onError: (error: Error) => {
      console.error('Failed to update availability slot:', error)
      toast.error('Failed to update availability slot')
    },
  })
}

/**
 * Hook to delete availability slot
 */
export function useDeleteAvailabilitySlot() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: deleteAvailabilitySlot,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking', 'availability', 'me'] })
      toast.success('Availability slot deleted')
    },
    onError: (error: Error) => {
      console.error('Failed to delete availability slot:', error)
      toast.error('Failed to delete availability slot')
    },
  })
}

/**
 * Hook to create recurring availability
 */
export function useCreateRecurringAvailability() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: createRecurringAvailability,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['booking', 'availability', 'me'] })
      toast.success(`Created ${data.created} availability slots`)
    },
    onError: (error: Error) => {
      console.error('Failed to create recurring availability:', error)
      toast.error('Failed to create recurring availability')
    },
  })
}

// ============================================================================
// Booking Instance CRUD Hooks (Provider Side)
// ============================================================================

import {
  listBookings,
  getBooking,
  confirmBooking,
  rejectBooking,
  cancelBooking,
  markBookingNoShow,
  type ListBookingsParams,
} from '../../services/booking'

/**
 * List bookings for provider
 */
export function useListBookings(params?: ListBookingsParams) {
  return useQuery({
    queryKey: ['booking', 'bookings', params],
    queryFn: () => listBookings(params),
    retry: 3,
  })
}

/**
 * Get single booking
 */
export function useBooking(bookingId: string) {
  return useQuery({
    queryKey: ['booking', 'bookings', bookingId],
    queryFn: () => getBooking(bookingId),
    enabled: !!bookingId,
    retry: 3,
  })
}

/**
 * Confirm a booking request
 */
export function useConfirmBooking() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ bookingId, reason }: { bookingId: string; reason?: string }) =>
      confirmBooking(bookingId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking', 'bookings'] })
      toast.success('Booking confirmed successfully')
    },
    onError: (error: Error) => {
      console.error('Failed to confirm booking:', error)
      toast.error('Failed to confirm booking')
    },
  })
}

/**
 * Reject a booking request
 */
export function useRejectBooking() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ bookingId, reason }: { bookingId: string; reason?: string }) =>
      rejectBooking(bookingId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking', 'bookings'] })
      toast.success('Booking rejected')
    },
    onError: (error: Error) => {
      console.error('Failed to reject booking:', error)
      toast.error('Failed to reject booking')
    },
  })
}

/**
 * Cancel a booking
 */
export function useCancelBooking() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ bookingId, reason }: { bookingId: string; reason?: string }) =>
      cancelBooking(bookingId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking', 'bookings'] })
      toast.success('Booking cancelled')
    },
    onError: (error: Error) => {
      console.error('Failed to cancel booking:', error)
      toast.error('Failed to cancel booking')
    },
  })
}

/**
 * Mark booking as no-show
 */
export function useMarkBookingNoShow() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (bookingId: string) => markBookingNoShow(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking', 'bookings'] })
      toast.success('Booking marked as no-show')
    },
    onError: (error: Error) => {
      console.error('Failed to mark booking as no-show:', error)
      toast.error('Failed to mark booking as no-show')
    },
  })
}

// ============================================================================
// Patient-Side Booking Creation Hooks
// ============================================================================

import { createBooking, type CreateBookingData } from '../../services/booking'

/**
 * Create a new booking (patient action)
 */
export function useCreateBooking(options?: {
  onSuccess?: (data: any) => void
  onError?: (error: Error) => void
}) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: createBooking,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['booking', 'bookings'] })
      toast.success('Booking created successfully')
      options?.onSuccess?.(data)
    },
    onError: (error: Error) => {
      console.error('Failed to create booking:', error)
      if (error instanceof ApiError) {
        toast.error(error.message || 'Failed to create booking')
      } else {
        toast.error('Failed to create booking')
      }
      options?.onError?.(error)
    },
  })
}
