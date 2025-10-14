import { apiGet, apiPost, ApiError, type PaginatedResponse } from '../api'
import { sanitizeObject } from '../utils/api'
import { formatDate } from '../utils/format'
import type { components } from '@monobase/api-spec/types'

// ============================================================================
// Booking Types
// ============================================================================

export interface BookingTimeSlot {
  id: string
  providerId: string
  date: Date
  startTime: Date
  endTime: Date
  status: 'available' | 'booked' | 'blocked'
  consultationModes: ('video' | 'phone' | 'in-person')[]
  price: number
  billingOverride?: {
    price?: number
    currency?: string
    paymentRequired?: boolean
    freeCancellationMinutes?: number
  }
}

export interface BookingProvider {
  id: string
  name: string
  email?: string
  avatar?: string
  biography?: string
  yearsOfExperience?: number
  specialties?: string[]
  serviceLocations?: string[]
  city?: string
  state?: string
  languages?: string[]
}

export interface BookingEventData {
  id: string
  timezone: string
  locationTypes: ('video' | 'phone' | 'in-person')[]
  billingConfig?: {
    price: number
    currency: string
    cancellationThresholdMinutes: number
  }
}

export interface ProviderWithSlots {
  provider: BookingProvider
  slots: BookingTimeSlot[]
  event?: BookingEventData
}

// ============================================================================
// API Type Aliases
// ============================================================================

type ApiPerson = components["schemas"]["Person"]
type ApiBooking = components["schemas"]["Booking"]
type ApiTimeSlot = components["schemas"]["TimeSlot"]
type ApiBookingEvent = components["schemas"]["BookingEvent"]

// Extended Person type for provider responses (Person + slots + event)
type ApiPersonWithSlots = ApiPerson & {
  slots?: ApiTimeSlot[]
  event?: ApiBookingEvent
}

// ============================================================================
// Mapper Functions
// ============================================================================

/**
 * Convert API TimeSlot to Frontend TimeSlot with Date objects
 */
function mapApiTimeSlotToFrontend(apiSlot: ApiTimeSlot): BookingTimeSlot {
  return {
    id: apiSlot.id,
    providerId: apiSlot.owner,
    date: new Date(apiSlot.date),
    startTime: new Date(apiSlot.startTime),
    endTime: new Date(apiSlot.endTime),
    status: apiSlot.status as 'available' | 'booked' | 'blocked',
    consultationModes: apiSlot.locationTypes as ('video' | 'phone' | 'in-person')[],
    price: apiSlot.billingOverride?.price || 0,
    billingOverride: apiSlot.billingOverride,
  }
}

/**
 * Convert API Person to Frontend BookingProvider
 * In monobase, providers are Person entities with provider role
 */
function mapApiPersonToProvider(apiPerson: ApiPerson): BookingProvider {
  return {
    id: apiPerson.id,
    name: `${apiPerson.firstName} ${apiPerson.lastName || ''}`.trim(),
    email: apiPerson.contactInfo?.email,
    avatar: apiPerson.avatar?.url,
    biography: undefined, // TODO: Add when provider-specific fields exist
    yearsOfExperience: undefined,
    specialties: [],
    serviceLocations: [],
    city: apiPerson.primaryAddress?.city,
    state: apiPerson.primaryAddress?.state,
    languages: apiPerson.languagesSpoken,
  }
}

/**
 * Convert API BookingEvent to Frontend BookingEventData
 */
function mapApiEventToFrontend(apiEvent: ApiBookingEvent): BookingEventData {
  return {
    id: apiEvent.id,
    timezone: apiEvent.timezone,
    locationTypes: apiEvent.locationTypes as ('video' | 'phone' | 'in-person')[],
    billingConfig: apiEvent.billingConfig,
  }
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Search providers with filters
 */
export interface SearchProvidersParams {
  q?: string
  specialty?: string
  location?: string
  language?: string
  availableFrom?: Date
  availableTo?: Date
  offset?: number
  limit?: number
}

export async function searchProviders(params: SearchProvidersParams): Promise<PaginatedResponse<BookingProvider>> {
  const queryParams = sanitizeObject({
    q: params.q,
    specialty: params.specialty,
    location: params.location,
    language: params.language,
    availableFrom: params.availableFrom ? formatDate(params.availableFrom, { format: 'iso' }) : undefined,
    availableTo: params.availableTo ? formatDate(params.availableTo, { format: 'iso' }) : undefined,
    offset: params.offset,
    limit: params.limit,
    expand: 'person',
  }, { nullable: [] })

  const response = await apiGet<PaginatedResponse<ApiPerson>>('/booking/providers', queryParams)

  return {
    data: response.data.map(mapApiPersonToProvider),
    pagination: response.pagination,
  }
}

/**
 * Get provider (Person) with available slots and event data
 */
export async function getProviderWithSlots(providerId: string): Promise<ProviderWithSlots> {
  const response = await apiGet<ApiPersonWithSlots>(`/booking/providers/${providerId}`, {
    expand: 'person,slots,event',
  })

  const provider = mapApiPersonToProvider(response)
  const slots = (response.slots || []).map(mapApiTimeSlotToFrontend)
  const event = response.event ? mapApiEventToFrontend(response.event) : undefined

  return {
    provider,
    slots,
    event,
  }
}

// ============================================================================
// Provider Availability Management
// ============================================================================

/**
 * Get provider's own booking event configuration
 */
export async function getMyBookingEvent(): Promise<BookingEventData | null> {
  try {
    const response = await apiGet<ApiBookingEvent>('/booking/event/me')
    return mapApiEventToFrontend(response)
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null
    }
    throw error
  }
}

/**
 * Create or update provider's booking event
 */
export async function upsertMyBookingEvent(data: Partial<ApiBookingEvent>): Promise<BookingEventData> {
  const response = await apiGet<ApiBookingEvent>('/booking/event/me', {
    method: 'PUT',
    body: JSON.stringify(data),
  })
  return mapApiEventToFrontend(response)
}

/**
 * Get provider's availability slots
 */
export interface GetAvailabilityParams {
  startDate?: Date
  endDate?: Date
  status?: 'available' | 'booked' | 'blocked'
  limit?: number
  offset?: number
}

export async function getMyAvailability(params?: GetAvailabilityParams): Promise<PaginatedResponse<BookingTimeSlot>> {
  const queryParams = sanitizeObject({
    startDate: params?.startDate ? formatDate(params.startDate, { format: 'iso' }) : undefined,
    endDate: params?.endDate ? formatDate(params.endDate, { format: 'iso' }) : undefined,
    status: params?.status,
    limit: params?.limit,
    offset: params?.offset,
  }, { nullable: [] })

  const response = await apiGet<PaginatedResponse<ApiTimeSlot>>('/booking/availability/me', queryParams)
  
  return {
    data: response.data.map(mapApiTimeSlotToFrontend),
    pagination: response.pagination,
  }
}

/**
 * Create availability slot
 */
export async function createAvailabilitySlot(data: {
  date: Date
  startTime: Date
  endTime: Date
  locationTypes: ('video' | 'phone' | 'in-person')[]
  price?: number
}): Promise<BookingTimeSlot> {
  const response = await apiPost<ApiTimeSlot>('/booking/availability', {
      date: formatDate(data.date, { format: 'iso' }),
      startTime: data.startTime.toISOString(),
      endTime: data.endTime.toISOString(),
      locationTypes: data.locationTypes,
      billingOverride: data.price ? { price: data.price } : undefined,
  })
  return mapApiTimeSlotToFrontend(response)
}

/**
 * Update availability slot
 */
export async function updateAvailabilitySlot(
  slotId: string,
  data: Partial<{
    startTime: Date
    endTime: Date
    locationTypes: ('video' | 'phone' | 'in-person')[]
    status: 'available' | 'booked' | 'blocked'
    price: number
  }>
): Promise<BookingTimeSlot> {
  const response = await apiGet<ApiTimeSlot>(`/booking/availability/${slotId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      startTime: data.startTime?.toISOString(),
      endTime: data.endTime?.toISOString(),
      locationTypes: data.locationTypes,
      status: data.status,
      billingOverride: data.price !== undefined ? { price: data.price } : undefined,
    }),
  })
  return mapApiTimeSlotToFrontend(response)
}

/**
 * Delete availability slot
 */
export async function deleteAvailabilitySlot(slotId: string): Promise<void> {
  await apiGet(`/booking/availability/${slotId}`, {
    method: 'DELETE',
  })
}

/**
 * Bulk create availability slots (recurring schedule)
 */
export async function createRecurringAvailability(data: {
  startDate: Date
  endDate: Date
  daysOfWeek: number[] // 0 = Sunday, 6 = Saturday
  timeSlots: Array<{
    startTime: string // HH:mm format
    endTime: string // HH:mm format
  }>
  locationTypes: ('video' | 'phone' | 'in-person')[]
  price?: number
}): Promise<{ created: number }> {
  const response = await apiPost<{ created: number }>('/booking/availability/bulk', {
      startDate: formatDate(data.startDate, { format: 'iso' }),
      endDate: formatDate(data.endDate, { format: 'iso' }),
      daysOfWeek: data.daysOfWeek,
      timeSlots: data.timeSlots,
      locationTypes: data.locationTypes,
      billingOverride: data.price ? { price: data.price } : undefined,
  })
  return response
}

// ============================================================================
// Booking Instance CRUD Operations (Provider Side)
// ============================================================================

export interface ListBookingsParams {
  status?: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rejected' | 'no_show_client' | 'no_show_provider'
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
}

/**
 * List bookings for provider
 */
export async function listBookings(params?: ListBookingsParams) {
  const queryParams = sanitizeObject({
    status: params?.status,
    startDate: params?.startDate ? formatDate(params.startDate, { format: 'iso' }) : undefined,
    endDate: params?.endDate ? formatDate(params.endDate, { format: 'iso' }) : undefined,
    limit: params?.limit,
    offset: params?.offset,
  }, { nullable: [] })

  return await apiGet('/booking/bookings', queryParams)
}

/**
 * Get single booking by ID
 */
export async function getBooking(bookingId: string) {
  return await apiGet(`/booking/bookings/${bookingId}`)
}

/**
 * Confirm a booking request (provider action)
 */
export async function confirmBooking(bookingId: string, reason?: string) {
  return await apiPost(`/booking/bookings/${bookingId}/confirm`, { reason })
}

/**
 * Reject a booking request (provider action)
 */
export async function rejectBooking(bookingId: string, reason?: string) {
  return await apiPost(`/booking/bookings/${bookingId}/reject`, { reason })
}

/**
 * Cancel a booking
 */
export async function cancelBooking(bookingId: string, reason?: string) {
  return await apiPost(`/booking/bookings/${bookingId}/cancel`, { reason })
}

/**
 * Mark booking as no-show (provider action)
 */
export async function markBookingNoShow(bookingId: string) {
  return await apiPost(`/booking/bookings/${bookingId}/no-show`, {})
}

// ============================================================================
// Patient-Side Booking Creation
// ============================================================================

export interface CreateBookingData {
  slot: string
  locationType?: 'video' | 'phone' | 'in_person'
  reason?: string
  formResponses?: Record<string, any>
}

/**
 * Create a new booking (patient action)
 */
export async function createBooking(data: CreateBookingData) {
  return await apiPost('/booking/bookings', {
    slot: data.slot,
    locationType: data.locationType,
    reason: data.reason,
    formResponses: data.formResponses ? { data: data.formResponses } : undefined,
  })
}
