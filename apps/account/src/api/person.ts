import { apiGet, apiPost, apiPatch, ApiError } from '@/api/client'
import { sanitizeObject } from '@/utils/api'
import type { PersonalInfo, OptionalAddress, ContactInfo, Preferences } from '@monobase/ui/person/schemas'
import { formatDate } from '@monobase/ui/lib/format-date'

// ============================================================================
// Types
// ============================================================================

export interface PersonCreateRequest {
  firstName: string
  lastName: string
  middleName?: string
  dateOfBirth: string // YYYY-MM-DD date format
  gender?: 'male' | 'female' | 'non-binary' | 'other' | 'prefer-not-to-say'
  contactInfo?: {
    email?: string
    phone?: string
  }
  primaryAddress?: {
    street1?: string
    street2?: string
    city?: string
    state?: string
    postalCode?: string
    country?: string
    coordinates?: {
      latitude?: number
      longitude?: number
    }
  }
  languagesSpoken?: string[]
  timezone?: string
}

export interface PersonResponse {
  id: string
  version: number
  createdAt: string
  createdBy: string
  updatedAt: string
  updatedBy: string
  deletedAt: string | null
  deletedBy: string | null
  firstName: string
  lastName: string
  middleName?: string
  dateOfBirth: string // YYYY-MM-DD date format
  gender?: string
  avatar?: {
    file?: string
    url: string
  }
  languagesSpoken?: string[]
  timezone?: string
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Get the current user's person profile
 */
export async function getMyProfile(): Promise<PersonResponse | null> {
  try {
    return await apiGet<PersonResponse>('/persons/me')
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null
    }
    throw error
  }
}

/**
 * Create a new person profile
 */
export async function createPerson(data: PersonCreateRequest): Promise<PersonResponse> {
  return apiPost<PersonResponse>('/persons', data)
}

/**
 * Update person's personal information
 */
export async function updatePersonalInfo(personId: string, data: PersonalInfo): Promise<PersonResponse> {
  const updateData = sanitizeObject({
    firstName: data.firstName,
    lastName: data.lastName,
    middleName: data.middleName,
    dateOfBirth: formatDate(data.dateOfBirth, { format: 'date' }),
    gender: data.gender,
    avatar: data.avatar ? {
      file: data.avatar.file,
      url: data.avatar.url
    } : null,
  }, {
    nullable: ['lastName', 'middleName', 'dateOfBirth', 'gender', 'avatar']
  })
  return apiPatch<PersonResponse>(`/persons/${personId}`, updateData)
}

/**
 * Update person's contact information
 */
export async function updateContactInfo(personId: string, data: ContactInfo): Promise<PersonResponse> {
  const updateData = sanitizeObject({
    contactInfo: {
      email: data.email,
      phone: data.phone,
    }
  }, {
    nullable: ['contactInfo']
  })
  return apiPatch<PersonResponse>(`/persons/${personId}`, updateData)
}

/**
 * Update person's address
 */
export async function updateAddress(personId: string, data: OptionalAddress): Promise<PersonResponse> {
  const updateData = sanitizeObject({
    primaryAddress: {
      street1: data.street1,
      street2: data.street2,
      city: data.city,
      state: data.state,
      postalCode: data.postalCode,
      country: data.country,
    }
  }, {
    nullable: ['primaryAddress', 'primaryAddress.street2']
  })
  return apiPatch<PersonResponse>(`/persons/${personId}`, updateData)
}

/**
 * Update person's preferences
 */
export async function updatePreferences(personId: string, data: Preferences): Promise<PersonResponse> {
  const updateData = sanitizeObject({
    languagesSpoken: data.languagesSpoken,
    timezone: data.timezone,
  }, {
    nullable: ['languagesSpoken', 'timezone']
  })
  return apiPatch<PersonResponse>(`/persons/${personId}`, updateData)
}

/**
 * Update person's avatar
 */
export async function updateAvatar(personId: string, fileId: string): Promise<PersonResponse> {
  return apiPatch<PersonResponse>(`/persons/${personId}`, {
    avatar: {
      file: fileId
    }
  })
}