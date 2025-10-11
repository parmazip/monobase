import { apiRequest, type PaginatedResponse } from '../api'
import type { components } from '@monobase/api-spec/types'

// ============================================================================
// Provider Types
// ============================================================================

export type ProviderType = 'pharmacist' | 'other'

export interface Person {
  id: string
  firstName: string
  lastName: string
  middleName?: string
  dateOfBirth: string
  gender?: string
  languagesSpoken?: string[]
  timezone?: string
  avatar?: {
    file?: string
    url: string
  }
  primaryAddress?: {
    street1?: string
    street2?: string
    city?: string
    state?: string
    postalCode?: string
    country?: string
  }
  contactInfo?: {
    email?: string
    phone?: string
  }
}

export interface Provider {
  id: string
  version: number
  createdAt: string
  createdBy: string
  updatedAt: string
  updatedBy: string
  deletedAt: string | null
  deletedBy: string | null
  person: string | Person
  providerType: ProviderType
  yearsOfExperience?: number
  biography?: string
  minorAilmentsSpecialties?: string[]
  minorAilmentsPracticeLocations?: string[]
}

export interface ProviderCreateRequest {
  person?: {
    firstName: string
    lastName: string
    middleName?: string
    dateOfBirth: string
    gender?: string
    languagesSpoken?: string[]
    timezone?: string
  }
  providerType: ProviderType
  yearsOfExperience?: number
  biography?: string
  minorAilmentsSpecialties?: string[]
  minorAilmentsPracticeLocations?: string[]
}

export interface ProviderUpdateRequest {
  yearsOfExperience?: number | null
  biography?: string | null
  minorAilmentsSpecialties?: string[] | null
  minorAilmentsPracticeLocations?: string[] | null
}

export interface ProviderQueryParams {
  minorAilmentsSpecialty?: string
  minorAilmentsPracticeLocation?: string
  languageSpoken?: string
  expand?: string
  limit?: number
  offset?: number
}

// ============================================================================
// Provider Service Functions
// ============================================================================

/**
 * List providers with optional filtering and expansion
 */
export async function listProviders(
  params?: ProviderQueryParams
): Promise<PaginatedResponse<Provider>> {
  return apiRequest<PaginatedResponse<Provider>>('/providers', {
    method: 'GET',
    params,
  })
}

/**
 * Get a specific provider by ID
 * Use 'me' as the provider ID to get the current authenticated user's profile
 */
export async function getProvider(
  id: string,
  expand?: string
): Promise<Provider> {
  return apiRequest<Provider>(`/providers/${id}`, {
    method: 'GET',
    params: expand ? { expand } : undefined,
  })
}

/**
 * Create a new provider profile
 */
export async function createProvider(
  data: ProviderCreateRequest
): Promise<Provider> {
  return apiRequest<Provider>('/providers', {
    method: 'POST',
    body: data,
  })
}

/**
 * Update an existing provider profile
 */
export async function updateProvider(
  id: string,
  updates: ProviderUpdateRequest
): Promise<Provider> {
  return apiRequest<Provider>(`/providers/${id}`, {
    method: 'PATCH',
    body: updates,
  })
}

/**
 * Delete a provider profile (soft delete)
 */
export async function deleteProvider(id: string): Promise<void> {
  return apiRequest<void>(`/providers/${id}`, {
    method: 'DELETE',
  })
}
