/**
 * EMR React Query Hooks
 *
 * Provides React Query hooks for EMR operations:
 * - Consultation notes (ConsultationNote)
 * - EMR patient listing (returns Patient[] from patient module)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { UseQueryOptions, UseMutationOptions } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  listConsultations,
  getConsultation,
  createConsultation,
  updateConsultation,
  finalizeConsultation,
  listEMRPatients,
  type ConsultationNote,
  type CreateConsultationRequest,
  type UpdateConsultationRequest,
  type ConsultationStatus,
} from '../../services/emr'
import type { Patient } from '../../services/patient'
import type { PaginatedResponse } from '../../api'
import { queryKeys } from '../query-keys'

// ============================================================================
// Consultation Hooks
// ============================================================================

/**
 * List consultations
 * Results are automatically filtered by role
 */
export function useConsultations(
  params?: {
    patient?: string
    status?: ConsultationStatus
    offset?: number
    limit?: number
  },
  options?: Omit<UseQueryOptions<PaginatedResponse<ConsultationNote>>, 'queryKey' | 'queryFn'>
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
  options?: Omit<UseQueryOptions<ConsultationNote>, 'queryKey' | 'queryFn'>
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
  options?: UseMutationOptions<ConsultationNote, Error, CreateConsultationRequest>
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createConsultation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.emrConsultations() })
      toast.success('Consultation created successfully')
    },
    onError: (error) => {
      toast.error('Failed to create consultation')
    },
    ...options,
  })
}

/**
 * Update consultation
 */
export function useUpdateConsultation(
  options?: UseMutationOptions<ConsultationNote, Error, { id: string; data: UpdateConsultationRequest }>
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }) => updateConsultation(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.emrConsultation(variables.id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.emrConsultations() })
      toast.success('Consultation updated successfully')
    },
    onError: (error) => {
      toast.error('Failed to update consultation')
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
    mutationFn: (consultationId: string) => finalizeConsultation(consultationId),
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

// ============================================================================
// EMR Patient Hooks
// ============================================================================

/**
 * List EMR patients
 * Returns regular Patient[] type (from patient module)
 * Results are automatically filtered to the current provider
 */
export function useEMRPatients(
  params?: {
    expand?: string
    offset?: number
    limit?: number
  },
  options?: Omit<UseQueryOptions<PaginatedResponse<Patient>>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.emrPatients(params),
    queryFn: () => listEMRPatients(params),
    ...options,
  })
}
