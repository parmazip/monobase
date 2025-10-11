/**
 * Common SDK types used across the package
 */

// SDK-specific types
export interface SDKConfig {
  apiBaseUrl: string
}

export interface QueryOptions {
  enabled?: boolean
  refetchOnWindowFocus?: boolean
  refetchOnMount?: boolean
  staleTime?: number
}

// ============================================================================
// Person Types
// ============================================================================

export interface PersonalInfo {
  firstName: string
  lastName: string
  middleName?: string
  dateOfBirth: Date
  gender?: 'male' | 'female' | 'non-binary' | 'other' | 'prefer-not-to-say'
  avatar?: { file?: string; url: string } | null
}

export interface OptionalAddress {
  street1?: string
  street2?: string
  city?: string
  state?: string
  postalCode?: string
  country?: string
}

export interface ContactInfo {
  email?: string
  phone?: string
}

export interface Preferences {
  languagesSpoken: string[]
  timezone: string
}

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
