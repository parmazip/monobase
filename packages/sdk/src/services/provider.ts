import { apiGet, apiPost, apiPatch, apiDelete, ApiError, type PaginatedResponse } from '../api'
import { sanitizeObject, mapPaginatedResponse } from '../utils/api'
import type { components } from '@monobase/api-spec/types'
import { mapApiPersonToFrontend, type Person as PersonType } from './person'

// ============================================================================
// API Type Aliases
// ============================================================================

type ApiProvider = components["schemas"]["Provider"]
type ApiPerson = components["schemas"]["Person"]

// ============================================================================
// Provider Types
// ============================================================================

export type ProviderType = 'pharmacist' | 'other'

export interface Provider {
  id: string
  version: number
  createdAt: Date
  createdBy: string
  updatedAt: Date
  updatedBy: string
  person: string | PersonType
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
// Mapper Functions
// ============================================================================

/**
 * Convert API Provider response to Frontend Provider
 */
function mapApiProviderToFrontend(api: ApiProvider & { person?: ApiPerson | string }): Provider {
  const personData = typeof api.person === 'object' && api.person !== null ? api.person : null
  
  return {
    id: api.id,
    version: api.version,
    createdAt: new Date(api.createdAt),
    createdBy: api.createdBy || '',
    updatedAt: new Date(api.updatedAt),
    updatedBy: api.updatedBy || '',
    person: personData ? mapApiPersonToFrontend(personData) : (typeof api.person === 'string' ? api.person : ''),
    providerType: api.providerType as ProviderType,
    yearsOfExperience: api.yearsOfExperience,
    biography: api.biography,
    minorAilmentsSpecialties: api.minorAilmentsSpecialties,
    minorAilmentsPracticeLocations: api.minorAilmentsPracticeLocations,
  }
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
  const response = await apiGet<PaginatedResponse<ApiProvider & { person?: ApiPerson | string }>>('/providers', params)
  return mapPaginatedResponse(response, mapApiProviderToFrontend)
}

/**
 * Get a specific provider by ID
 * Use 'me' as the provider ID to get the current authenticated user's profile
 */
export async function getProvider(
  id: string,
  expand?: string
): Promise<Provider> {
  const apiProvider = await apiGet<ApiProvider & { person?: ApiPerson | string }>(`/providers/${id}`, expand ? { expand } : undefined)
  return mapApiProviderToFrontend(apiProvider)
}

/**
 * Create a new provider profile
 */
export async function createProvider(
  data: ProviderCreateRequest
): Promise<Provider> {
  const apiProvider = await apiPost<ApiProvider>('/providers', sanitizeObject(data, { nullable: [] }))
  return mapApiProviderToFrontend(apiProvider)
}

/**
 * Update an existing provider profile
 */
export async function updateProvider(
  id: string,
  updates: ProviderUpdateRequest
): Promise<Provider> {
  const apiProvider = await apiPatch<ApiProvider>(`/providers/${id}`, sanitizeObject(updates, { 
    nullable: ['yearsOfExperience', 'biography', 'minorAilmentsSpecialties', 'minorAilmentsPracticeLocations']
  }))
  return mapApiProviderToFrontend(apiProvider)
}

/**
 * Delete a provider profile (soft delete)
 */
export async function deleteProvider(id: string): Promise<void> {
  return apiDelete<void>(`/providers/${id}`)
}

// ============================================================================
// "My" Provider Functions (Current User)
// ============================================================================

/**
 * Get current user's provider profile
 */
export async function getMyProvider(): Promise<Provider | null> {
  try {
    return await getProvider('me')
  } catch (error) {
    // Return null if provider doesn't exist (404)
    if (error instanceof ApiError && error.status === 404) {
      return null
    }
    throw error
  }
}

/**
 * Create provider profile for current user
 */
export async function createMyProvider(
  data: Omit<ProviderCreateRequest, 'person'>
): Promise<Provider> {
  return createProvider(data as ProviderCreateRequest)
}

/**
 * Update current user's provider profile
 */
export async function updateMyProvider(
  updates: ProviderUpdateRequest
): Promise<Provider> {
  return updateProvider('me', updates)
}

/**
 * Delete current user's provider profile
 */
export async function deleteMyProvider(): Promise<void> {
  return deleteProvider('me')
}
