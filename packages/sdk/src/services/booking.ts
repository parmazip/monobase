import { apiGet, ApiError } from '../api'
import { sanitizeObject } from '../utils/api'
import type { BookingProvider, BookingTimeSlot, BookingEventData, ProviderWithSlots } from '../types'
import { formatDate } from '../utils/format'
import type { components } from '@monobase/api-spec/types'

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

// Paginated response structure
type ApiPaginatedResponse<T> = {
  data: T[]
  pagination: {
    total: number
    offset: number
    limit: number
    page: number
    pageSize: number
    totalPages: number
  }
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

export interface PaginatedProviders {
  data: BookingProvider[]
  pagination: {
    total: number
    offset: number
    limit: number
    page: number
    pageSize: number
    totalPages: number
  }
}

export async function searchProviders(params: SearchProvidersParams): Promise<PaginatedProviders> {
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

  const response = await apiGet<ApiPaginatedResponse<ApiPerson>>('/booking/providers', queryParams)

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
