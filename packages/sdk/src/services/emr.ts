/**
 * EMR (Electronic Medical Records) Service
 * 
 * Handles EMR-specific operations including:
 * - EMR patients (patients in medical records context, NOT general patient module)
 * - Medical records access and management
 * - Consultation history
 * - Document management
 */

import { apiGet, apiPost, apiPatch, apiDelete, type PaginatedResponse } from '../api'
import { mapPaginatedResponse } from '../utils/api'

// ============================================================================
// API Type Aliases (EMR types are custom, not from API spec)
// ============================================================================

// Note: EMR module types are defined below as they are custom types
// not part of the generated API spec yet

// ============================================================================
// Types
// ============================================================================

export interface EmrPatient {
  id: string
  personId: string
  firstName: string
  lastName: string
  dateOfBirth: Date
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
  createdAt: Date
  updatedAt: Date
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
  createdAt: Date
  updatedAt: Date
}

export interface Consultation {
  id: string
  emrPatientId: string
  providerId: string
  bookingId?: string
  appointmentDate: Date
  duration: number
  type: 'video' | 'phone' | 'in-person'
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show'
  chiefComplaint?: string
  diagnosis?: string
  treatment?: string
  prescriptions?: string[]
  followUpDate?: Date
  notes?: string
  recordIds?: string[] // Associated medical records
  createdAt: Date
  updatedAt: Date
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
  uploadedAt: Date
}

// ============================================================================
// Mapper Functions
// ============================================================================

// Note: Since EMR types are not in the API spec yet, we'll map from any type
// When EMR is added to the API spec, we should update these to use proper API types

/**
 * Convert API EmrPatient to Frontend EmrPatient
 */
function mapApiEmrPatientToFrontend(api: any): EmrPatient {
  return {
    id: api.id,
    personId: api.personId,
    firstName: api.firstName,
    lastName: api.lastName,
    dateOfBirth: new Date(api.dateOfBirth),
    gender: api.gender,
    email: api.email,
    phone: api.phone,
    address: api.address,
    medicalHistory: api.medicalHistory,
    allergies: api.allergies,
    medications: api.medications,
    createdAt: new Date(api.createdAt),
    updatedAt: new Date(api.updatedAt),
  }
}

/**
 * Convert API MedicalRecord to Frontend MedicalRecord
 */
function mapApiMedicalRecordToFrontend(api: any): MedicalRecord {
  return {
    id: api.id,
    emrPatientId: api.emrPatientId,
    providerId: api.providerId,
    type: api.type,
    title: api.title,
    description: api.description,
    diagnosis: api.diagnosis,
    prescription: api.prescription,
    attachments: api.attachments,
    createdAt: new Date(api.createdAt),
    updatedAt: new Date(api.updatedAt),
  }
}

/**
 * Convert API Consultation to Frontend Consultation
 */
function mapApiConsultationToFrontend(api: any): Consultation {
  return {
    id: api.id,
    emrPatientId: api.emrPatientId,
    providerId: api.providerId,
    bookingId: api.bookingId,
    appointmentDate: new Date(api.appointmentDate),
    duration: api.duration,
    type: api.type,
    status: api.status,
    chiefComplaint: api.chiefComplaint,
    diagnosis: api.diagnosis,
    treatment: api.treatment,
    prescriptions: api.prescriptions,
    followUpDate: api.followUpDate ? new Date(api.followUpDate) : undefined,
    notes: api.notes,
    recordIds: api.recordIds,
    createdAt: new Date(api.createdAt),
    updatedAt: new Date(api.updatedAt),
  }
}

/**
 * Convert API EmrDocument to Frontend EmrDocument
 */
function mapApiEmrDocumentToFrontend(api: any): EmrDocument {
  return {
    id: api.id,
    emrPatientId: api.emrPatientId,
    recordId: api.recordId,
    consultationId: api.consultationId,
    type: api.type,
    name: api.name,
    fileUrl: api.fileUrl,
    mimeType: api.mimeType,
    size: api.size,
    uploadedBy: api.uploadedBy,
    uploadedAt: new Date(api.uploadedAt),
  }
}

// ============================================================================
// EMR Patient Operations
// ============================================================================

export async function listEmrPatients(params?: {
  page?: number
  limit?: number
  search?: string
  providerId?: string
}): Promise<PaginatedResponse<EmrPatient>> {
  const response = await apiGet<PaginatedResponse<any>>('/emr/patients', params)
  return mapPaginatedResponse(response, mapApiEmrPatientToFrontend)
}

/**
 * Get EMR patient by ID
 */
export async function getEmrPatient(id: string): Promise<EmrPatient> {
  const apiPatient = await apiGet<any>(`/emr/patients/${id}`)
  return mapApiEmrPatientToFrontend(apiPatient)
}

/**
 * Create EMR patient record
 */
export async function createEmrPatient(data: Partial<EmrPatient>): Promise<EmrPatient> {
  const apiPatient = await apiPost<any>('/emr/patients', data)
  return mapApiEmrPatientToFrontend(apiPatient)
}

/**
 * Update EMR patient
 */
export async function updateEmrPatient(id: string, data: Partial<EmrPatient>): Promise<EmrPatient> {
  const apiPatient = await apiPatch<any>(`/emr/patients/${id}`, data)
  return mapApiEmrPatientToFrontend(apiPatient)
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
  const response = await apiGet<PaginatedResponse<any>>('/emr/records', params)
  return mapPaginatedResponse(response, mapApiMedicalRecordToFrontend)
}

/**
 * Get medical record by ID
 */
export async function getMedicalRecord(id: string): Promise<MedicalRecord> {
  const apiRecord = await apiGet<any>(`/emr/records/${id}`)
  return mapApiMedicalRecordToFrontend(apiRecord)
}

/**
 * Create medical record
 */
export async function createMedicalRecord(data: Partial<MedicalRecord>): Promise<MedicalRecord> {
  const apiRecord = await apiPost<any>('/emr/records', data)
  return mapApiMedicalRecordToFrontend(apiRecord)
}

/**
 * Update medical record
 */
export async function updateMedicalRecord(id: string, data: Partial<MedicalRecord>): Promise<MedicalRecord> {
  const apiRecord = await apiPatch<any>(`/emr/records/${id}`, data)
  return mapApiMedicalRecordToFrontend(apiRecord)
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
  const response = await apiGet<PaginatedResponse<any>>('/emr/consultations', params)
  return mapPaginatedResponse(response, mapApiConsultationToFrontend)
}

/**
 * Get consultation by ID
 */
export async function getConsultation(id: string): Promise<Consultation> {
  const apiConsultation = await apiGet<any>(`/emr/consultations/${id}`)
  return mapApiConsultationToFrontend(apiConsultation)
}

/**
 * Create consultation record
 */
export async function createConsultation(data: Partial<Consultation>): Promise<Consultation> {
  const apiConsultation = await apiPost<any>('/emr/consultations', data)
  return mapApiConsultationToFrontend(apiConsultation)
}

/**
 * Update consultation
 */
export async function updateConsultation(id: string, data: Partial<Consultation>): Promise<Consultation> {
  const apiConsultation = await apiPatch<any>(`/emr/consultations/${id}`, data)
  return mapApiConsultationToFrontend(apiConsultation)
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
  const response = await apiGet<PaginatedResponse<any>>('/emr/documents', params)
  return mapPaginatedResponse(response, mapApiEmrDocumentToFrontend)
}

/**
 * Get document by ID
 */
export async function getEmrDocument(id: string): Promise<EmrDocument> {
  const apiDocument = await apiGet<any>(`/emr/documents/${id}`)
  return mapApiEmrDocumentToFrontend(apiDocument)
}

/**
 * Upload EMR document
 */
export async function uploadEmrDocument(data: FormData): Promise<EmrDocument> {
  const apiDocument = await apiPost<any>('/emr/documents', data)
  return mapApiEmrDocumentToFrontend(apiDocument)
}

/**
 * Delete document
 */
export async function deleteEmrDocument(id: string): Promise<void> {
  return apiDelete<void>(`/emr/documents/${id}`)
}
