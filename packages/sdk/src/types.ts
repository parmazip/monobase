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
