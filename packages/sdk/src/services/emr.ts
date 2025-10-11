/**
 * EMR (Electronic Medical Records) Service
 * 
 * Handles EMR-specific operations including:
 * - EMR patients (patients in medical records context, NOT general patient module)
 * - Medical records access and management
 * - Consultation history
 * - Document management
 */

import { apiClient } from '../api'
import type { ApiResponse, PaginatedResponse } from '../types'

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
export async function listEmrPatients(params?: {
  page?: number
  limit?: number
  search?: string
  providerId?: string
}): Promise<PaginatedResponse<EmrPatient>> {
  return apiClient.get('/emr/patients', { params })
}

/**
 * Get EMR patient by ID
 */
export async function getEmrPatient(id: string): Promise<ApiResponse<EmrPatient>> {
  return apiClient.get(`/emr/patients/${id}`)
}

/**
 * Create EMR patient record
 */
export async function createEmrPatient(data: Partial<EmrPatient>): Promise<ApiResponse<EmrPatient>> {
  return apiClient.post('/emr/patients', data)
}

/**
 * Update EMR patient
 */
export async function updateEmrPatient(id: string, data: Partial<EmrPatient>): Promise<ApiResponse<EmrPatient>> {
  return apiClient.patch(`/emr/patients/${id}`, data)
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
  return apiClient.get('/emr/records', { params })
}

/**
 * Get medical record by ID
 */
export async function getMedicalRecord(id: string): Promise<ApiResponse<MedicalRecord>> {
  return apiClient.get(`/emr/records/${id}`)
}

/**
 * Create medical record
 */
export async function createMedicalRecord(data: Partial<MedicalRecord>): Promise<ApiResponse<MedicalRecord>> {
  return apiClient.post('/emr/records', data)
}

/**
 * Update medical record
 */
export async function updateMedicalRecord(id: string, data: Partial<MedicalRecord>): Promise<ApiResponse<MedicalRecord>> {
  return apiClient.patch(`/emr/records/${id}`, data)
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
  return apiClient.get('/emr/consultations', { params })
}

/**
 * Get consultation by ID
 */
export async function getConsultation(id: string): Promise<ApiResponse<Consultation>> {
  return apiClient.get(`/emr/consultations/${id}`)
}

/**
 * Create consultation record
 */
export async function createConsultation(data: Partial<Consultation>): Promise<ApiResponse<Consultation>> {
  return apiClient.post('/emr/consultations', data)
}

/**
 * Update consultation
 */
export async function updateConsultation(id: string, data: Partial<Consultation>): Promise<ApiResponse<Consultation>> {
  return apiClient.patch(`/emr/consultations/${id}`, data)
}

