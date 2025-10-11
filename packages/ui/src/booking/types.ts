/**
 * Booking Widget Types
 * Generic, reusable types for booking components across all apps
 */

export interface BookingTimeSlot {
  id: string
  providerId: string
  date: string // YYYY-MM-DD format
  startTime: string // ISO 8601 UTC timestamp
  endTime: string // ISO 8601 UTC timestamp
  status: 'available' | 'booked' | 'blocked'
  consultationModes: ('video' | 'phone' | 'in-person')[]
  price: number
}

export interface BookingProvider {
  id: string
  name: string
  avatar?: string
}

export interface BookingEventBillingConfig {
  cancellationThresholdMinutes: number
}

export interface BookingEventData {
  billingConfig?: BookingEventBillingConfig
}

/**
 * Active booking state for tracking pending appointments
 */
export interface ActiveBooking {
  id: string
  providerId: string
  providerName: string
  date: string
  startTime: string
  endTime: string
  price: number
  status: 'pending' | 'confirmed' | 'rejected' | 'cancelled' | 'completed' | 'no_show_client' | 'no_show_provider'
  paymentStatus: 'unpaid' | 'paid'
  bookingTimestamp: number
  cancellationReason?: string
  rejectionReason?: string
  invoice?: string
}

/**
 * User information for booking context
 * Supports Better-Auth role checking with CSV role format
 */
export interface BookingUser {
  id: string
  role?: string // CSV string of roles, e.g., "user,client,provider"
}
