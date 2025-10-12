import { apiGet, apiPost, apiPatch, ApiError } from '../api'
import { sanitizeObject } from '../utils/api'
import type { components } from '@monobase/api-spec/types'

// ============================================================================
// API Type Aliases
// ============================================================================

type ApiPatient = components["schemas"]["Patient"]
type ApiPerson = components["schemas"]["Person"]

// ============================================================================
// Frontend Types
// ============================================================================

export interface PrimaryProvider {
  name: string
  specialty?: string | null
  phone?: string | null
  fax?: string | null
}

export interface PrimaryPharmacy {
  name: string
  address?: string | null
  phone?: string | null
  fax?: string | null
}

export interface Patient {
  id: string
  version: number
  createdAt: Date
  createdBy: string
  updatedAt: Date
  updatedBy: string
  deletedAt: Date | null
  deletedBy: string | null
  personId: string
  person?: {
    id: string
    firstName: string
    lastName?: string
    middleName?: string
    email?: string
  } | null
  primaryProvider?: PrimaryProvider | null
  primaryPharmacy?: PrimaryPharmacy | null
}

export interface CreatePatientData {
  person?: any // PersonCreateRequest - handled by person module
  primaryProvider?: PrimaryProvider | null
  primaryPharmacy?: PrimaryPharmacy | null
}

export interface UpdatePatientData {
  primaryProvider?: PrimaryProvider | null
  primaryPharmacy?: PrimaryPharmacy | null
}

// ============================================================================
// Mapper Functions
// ============================================================================

/**
 * Convert API Patient response to Frontend Patient
 */
function mapApiPatientToFrontend(api: ApiPatient & { person?: ApiPerson | string }): Patient {
  const personData = typeof api.person === 'object' && api.person !== null ? api.person : null
  
  return {
    id: api.id,
    version: api.version,
    createdAt: new Date(api.createdAt),
    createdBy: api.createdBy || '',
    updatedAt: new Date(api.updatedAt),
    updatedBy: api.updatedBy || '',
    deletedAt: api.deletedAt ? new Date(api.deletedAt) : null,
    deletedBy: api.deletedBy ?? null,
    personId: typeof api.person === 'string' ? api.person : api.person?.id || '',
    person: personData ? {
      id: personData.id,
      firstName: personData.firstName,
      lastName: personData.lastName,
      middleName: personData.middleName,
      email: personData.contactInfo?.email,
    } : null,
    primaryProvider: api.primaryProvider || null,
    primaryPharmacy: api.primaryPharmacy || null,
  }
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Get the current user's patient profile
 */
export async function getMyPatientProfile(): Promise<Patient | null> {
  try {
    const apiPatient = await apiGet<ApiPatient & { person?: ApiPerson }>('/patients/me', { expand: 'person' })
    return mapApiPatientToFrontend(apiPatient)
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null
    }
    throw error
  }
}

/**
 * Create a new patient profile
 */
export async function createPatient(data: CreatePatientData): Promise<Patient> {
  const apiRequest = sanitizeObject({
    person: data.person,
    primaryProvider: data.primaryProvider,
    primaryPharmacy: data.primaryPharmacy,
  }, {
    nullable: []  // No nullable fields in CREATE operations
  })

  const apiPatient = await apiPost<ApiPatient>('/patients', apiRequest)
  return mapApiPatientToFrontend(apiPatient)
}

/**
 * Update patient profile
 */
export async function updatePatient(patientId: string, data: UpdatePatientData): Promise<Patient> {
  const apiRequest = sanitizeObject({
    primaryProvider: data.primaryProvider,
    primaryPharmacy: data.primaryPharmacy,
  }, {
    nullable: ['primaryProvider', 'primaryProvider.specialty', 'primaryProvider.phone', 'primaryProvider.fax', 
               'primaryPharmacy', 'primaryPharmacy.address', 'primaryPharmacy.phone', 'primaryPharmacy.fax']
  })

  const apiPatient = await apiPatch<ApiPatient>(`/patients/${patientId}`, apiRequest)
  return mapApiPatientToFrontend(apiPatient)
}

/**
 * Update patient's primary provider
 */
export async function updatePrimaryProvider(patientId: string, data: PrimaryProvider | null): Promise<Patient> {
  const apiRequest = sanitizeObject({
    primaryProvider: data,
  }, {
    nullable: ['primaryProvider', 'primaryProvider.specialty', 'primaryProvider.phone', 'primaryProvider.fax']
  })

  const apiPatient = await apiPatch<ApiPatient>(`/patients/${patientId}`, apiRequest)
  return mapApiPatientToFrontend(apiPatient)
}

/**
 * Update patient's primary pharmacy
 */
export async function updatePrimaryPharmacy(patientId: string, data: PrimaryPharmacy | null): Promise<Patient> {
  const apiRequest = sanitizeObject({
    primaryPharmacy: data,
  }, {
    nullable: ['primaryPharmacy', 'primaryPharmacy.address', 'primaryPharmacy.phone', 'primaryPharmacy.fax']
  })

  const apiPatient = await apiPatch<ApiPatient>(`/patients/${patientId}`, apiRequest)
  return mapApiPatientToFrontend(apiPatient)
}
