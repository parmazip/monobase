/**
 * EMR (Electronic Medical Records) Service
 * 
 * Handles EMR-specific operations including:
 * - EMR patients (patients in medical records context, NOT general patient module)
 * - Medical records access and management
 * - Consultation history
 * - Document management
 */

import { apiGet, apiPost, apiPatch, apiDelete } from '../api'

// ============================================================================
// Types
// ============================================================================

export interface EmrPatient {
  id: string
  personId: string
  firstName: string
  lastName: string
  dateOfBirth: string
  gender?: string
  email?: string
  phone?: string
  address?: {
    street?: string
    city?: string
    state?: string
    postalCode?: string
    country?: string
  }
  medicalHistory?: string
  allergies?: string[]
  medications?: string[]
  createdAt: string
  updatedAt: string
}

export interface MedicalRecord {
  id: string
  emrPatientId: string
  providerId: string
  type: 'consultation' | 'diagnosis' | 'prescription' | 'lab_result' | 'imaging' | 'note'
  title: string
  description?: string
  diagnosis?: string
  prescription?: string
  attachments?: string[]
  createdAt: string
  updatedAt: string
}

export interface Consultation {
  id: string
  emrPatientId: string
  providerId: string
  bookingId?: string
  appointmentDate: string
  duration: number
  type: 'video' | 'phone' | 'in-person'
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show'
  chiefComplaint?: string
  diagnosis?: string
  treatment?: string
  prescriptions?: string[]
  followUpDate?: string
  notes?: string
  recordIds?: string[] // Associated medical records
  createdAt: string
  updatedAt: string
}

export interface EmrDocument {
  id: string
  emrPatientId: string
  recordId?: string
  consultationId?: string
  type: 'lab_result' | 'imaging' | 'prescription' | 'referral' | 'other'
  name: string
  fileUrl: string
  mimeType: string
  size: number
  uploadedBy: string
  uploadedAt: string
}

// ============================================================================
// EMR Patient Operations
// ============================================================================

/**
 * List EMR patients with pagination
 */
export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    totalCount: number
    offset: number
    limit: number
  }
}

export interface ApiResponse<T> {
  data: T
}

export async function listEmrPatients(params?: {
  page?: number
  limit?: number
  search?: string
  providerId?: string
}): Promise<PaginatedResponse<EmrPatient>> {
  return apiGet('/emr/patients', params)
}

/**
 * Get EMR patient by ID
 */
export async function getEmrPatient(id: string): Promise<ApiResponse<EmrPatient>> {
  const data = await apiGet<EmrPatient>(`/emr/patients/${id}`)
  return { data }
}

/**
 * Create EMR patient record
 */
export async function createEmrPatient(data: Partial<EmrPatient>): Promise<ApiResponse<EmrPatient>> {
  const result = await apiPost<EmrPatient>('/emr/patients', data)
  return { data: result }
}

/**
 * Update EMR patient
 */
export async function updateEmrPatient(id: string, data: Partial<EmrPatient>): Promise<ApiResponse<EmrPatient>> {
  const result = await apiPatch<EmrPatient>(`/emr/patients/${id}`, data)
  return { data: result }
}

// ============================================================================
// Medical Records Operations
// ============================================================================

/**
 * List medical records for a patient
 */
export async function listMedicalRecords(params: {
  emrPatientId: string
  type?: MedicalRecord['type']
  page?: number
  limit?: number
}): Promise<PaginatedResponse<MedicalRecord>> {
  return apiGet('/emr/records', params)
}

/**
 * Get medical record by ID
 */
export async function getMedicalRecord(id: string): Promise<ApiResponse<MedicalRecord>> {
  const data = await apiGet<MedicalRecord>(`/emr/records/${id}`)
  return { data }
}

/**
 * Create medical record
 */
export async function createMedicalRecord(data: Partial<MedicalRecord>): Promise<ApiResponse<MedicalRecord>> {
  const result = await apiPost<MedicalRecord>('/emr/records', data)
  return { data: result }
}

/**
 * Update medical record
 */
export async function updateMedicalRecord(id: string, data: Partial<MedicalRecord>): Promise<ApiResponse<MedicalRecord>> {
  const result = await apiPatch<MedicalRecord>(`/emr/records/${id}`, data)
  return { data: result }
}

// ============================================================================
// Consultation Operations
// ============================================================================

/**
 * List consultations
 */
export async function listConsultations(params?: {
  emrPatientId?: string
  providerId?: string
  status?: Consultation['status']
  page?: number
  limit?: number
}): Promise<PaginatedResponse<Consultation>> {
  return apiGet('/emr/consultations', params)
}

/**
 * Get consultation by ID
 */
export async function getConsultation(id: string): Promise<ApiResponse<Consultation>> {
  const data = await apiGet<Consultation>(`/emr/consultations/${id}`)
  return { data }
}

/**
 * Create consultation record
 */
export async function createConsultation(data: Partial<Consultation>): Promise<ApiResponse<Consultation>> {
  const result = await apiPost<Consultation>('/emr/consultations', data)
  return { data: result }
}

/**
 * Update consultation
 */
export async function updateConsultation(id: string, data: Partial<Consultation>): Promise<ApiResponse<Consultation>> {
  const result = await apiPatch<Consultation>(`/emr/consultations/${id}`, data)
  return { data: result }
}

// ============================================================================
// Document Operations
// ============================================================================

/**
 * List documents for patient/record/consultation
 */
export async function listEmrDocuments(params: {
  emrPatientId?: string
  recordId?: string
  consultationId?: string
  type?: EmrDocument['type']
  page?: number
  limit?: number
}): Promise<PaginatedResponse<EmrDocument>> {
  return apiGet('/emr/documents', params)
}

/**
 * Get document by ID
 */
export async function getEmrDocument(id: string): Promise<ApiResponse<EmrDocument>> {
  const data = await apiGet<EmrDocument>(`/emr/documents/${id}`)
  return { data }
}

/**
 * Upload EMR document
 */
export async function uploadEmrDocument(data: FormData): Promise<ApiResponse<EmrDocument>> {
  const result = await apiPost<EmrDocument>('/emr/documents', data)
  return { data: result }
}

/**
 * Delete document
 */
export async function deleteEmrDocument(id: string): Promise<ApiResponse<void>> {
  await apiDelete(`/emr/documents/${id}`)
  return { data: undefined as any }
}
