/**
 * EMR React Query Hooks
 * 
 * Provides React Query hooks for EMR operations including:
 * - EMR patients
 * - Medical records
 * - Consultations
 * - Documents
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { UseQueryOptions, UseMutationOptions } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  listEmrPatients,
  getEmrPatient,
  createEmrPatient,
  updateEmrPatient,
  listMedicalRecords,
  getMedicalRecord,
  createMedicalRecord,
  updateMedicalRecord,
  listConsultations,
  getConsultation,
  createConsultation,
  updateConsultation,
  listEmrDocuments,
  getEmrDocument,
  uploadEmrDocument,
  deleteEmrDocument,
  type EmrPatient,
  type MedicalRecord,
  type Consultation,
  type EmrDocument,
} from '../../services/emr'
import type { PaginatedResponse } from '../../api'
import { queryKeys } from '../query-keys'

// ============================================================================
// EMR Patient Hooks
// ============================================================================

/**
 * List EMR patients with pagination
 */
export function useEmrPatients(
  params?: Parameters<typeof listEmrPatients>[0],
  options?: Omit<UseQueryOptions<PaginatedResponse<EmrPatient>>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.emrPatients(params),
    queryFn: () => listEmrPatients(params),
    ...options,
  })
}

/**
 * Get single EMR patient
 */
export function useEmrPatient(
  id: string,
  options?: Omit<UseQueryOptions<EmrPatient>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.emrPatient(id),
    queryFn: () => getEmrPatient(id),
    enabled: !!id,
    ...options,
  })
}

/**
 * Create EMR patient
 */
export function useCreateEmrPatient(
  options?: UseMutationOptions<EmrPatient, Error, Partial<EmrPatient>>
) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: createEmrPatient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.emrPatients() })
    },
    ...options,
  })
}

/**
 * Update EMR patient
 */
export function useUpdateEmrPatient(
  options?: UseMutationOptions<EmrPatient, Error, { id: string; data: Partial<EmrPatient> }>
) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }) => updateEmrPatient(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.emrPatient(variables.id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.emrPatients() })
    },
    ...options,
  })
}

// ============================================================================
// Medical Records Hooks
// ============================================================================

/**
 * List medical records
 */
export function useMedicalRecords(
  params: Parameters<typeof listMedicalRecords>[0],
  options?: Omit<UseQueryOptions<PaginatedResponse<MedicalRecord>>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.emrRecords(params),
    queryFn: () => listMedicalRecords(params),
    enabled: !!params.emrPatientId,
    ...options,
  })
}

/**
 * Get single medical record
 */
export function useMedicalRecord(
  id: string,
  options?: Omit<UseQueryOptions<MedicalRecord>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.emrRecord(id),
    queryFn: () => getMedicalRecord(id),
    enabled: !!id,
    ...options,
  })
}

/**
 * Create medical record
 */
export function useCreateMedicalRecord(
  options?: UseMutationOptions<MedicalRecord, Error, Partial<MedicalRecord>>
) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: createMedicalRecord,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.emrRecords() })
    },
    ...options,
  })
}

/**
 * Update medical record
 */
export function useUpdateMedicalRecord(
  options?: UseMutationOptions<MedicalRecord, Error, { id: string; data: Partial<MedicalRecord> }>
) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }) => updateMedicalRecord(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.emrRecord(variables.id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.emrRecords() })
    },
    ...options,
  })
}

// ============================================================================
// Consultation Hooks
// ============================================================================

/**
 * List consultations
 */
export function useConsultations(
  params?: Parameters<typeof listConsultations>[0],
  options?: Omit<UseQueryOptions<PaginatedResponse<Consultation>>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.emrConsultations(params),
    queryFn: () => listConsultations(params),
    ...options,
  })
}

/**
 * Get single consultation
 */
export function useConsultation(
  id: string,
  options?: Omit<UseQueryOptions<Consultation>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.emrConsultation(id),
    queryFn: () => getConsultation(id),
    enabled: !!id,
    ...options,
  })
}

/**
 * Create consultation
 */
export function useCreateConsultation(
  options?: UseMutationOptions<Consultation, Error, Partial<Consultation>>
) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: createConsultation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.emrConsultations() })
    },
    ...options,
  })
}

/**
 * Finalize consultation (mark as completed)
 */
export function useFinalizeConsultation(
  options?: {
    onSuccess?: () => void
    onError?: (error: Error) => void
  }
) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (consultationId: string) => {
      return await updateConsultation(consultationId, { status: 'completed' })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.emrConsultations() })
      toast.success('Consultation finalized successfully')
      options?.onSuccess?.()
    },
    onError: (error) => {
      toast.error('Failed to finalize consultation')
      options?.onError?.(error)
    },
  })
}

/**
 * Update consultation
 */
export function useUpdateConsultation(
  options?: UseMutationOptions<Consultation, Error, { id: string; data: Partial<Consultation> }>
) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }) => updateConsultation(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.emrConsultation(variables.id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.emrConsultations() })
    },
    ...options,
  })
}

// ============================================================================
// Document Hooks
// ============================================================================

/**
 * List EMR documents
 */
export function useEmrDocuments(
  params: Parameters<typeof listEmrDocuments>[0],
  options?: Omit<UseQueryOptions<PaginatedResponse<EmrDocument>>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.emrDocuments(params),
    queryFn: () => listEmrDocuments(params),
    ...options,
  })
}

/**
 * Get single EMR document
 */
export function useEmrDocument(
  id: string,
  options?: Omit<UseQueryOptions<EmrDocument>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.emrDocument(id),
    queryFn: () => getEmrDocument(id),
    enabled: !!id,
    ...options,
  })
}

/**
 * Upload EMR document
 */
export function useUploadEmrDocument(
  options?: UseMutationOptions<EmrDocument, Error, FormData>
) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: uploadEmrDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.emrDocuments() })
    },
    ...options,
  })
}

/**
 * Delete EMR document
 */
export function useDeleteEmrDocument(
  options?: UseMutationOptions<void, Error, string>
) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: deleteEmrDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.emrDocuments() })
    },
    ...options,
  })
}
