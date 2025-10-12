import { z } from 'zod'

/**
 * Provider Form Schema
 * Validation for provider profile forms
 */

export const providerFormSchema = z.object({
  providerType: z.string().default('pharmacist'),
  yearsOfExperience: z.number().int().min(0).max(70).optional(),
  biography: z.string().min(10, 'Biography must be at least 10 characters').max(2000),
  minorAilmentsSpecialties: z.array(z.string()).min(1, 'At least one specialty is required'),
  minorAilmentsPracticeLocations: z.array(z.string()).min(1, 'At least one practice location is required'),
})

export type ProviderFormData = z.infer<typeof providerFormSchema>

// Provider type options
export const PROVIDER_TYPES = [
  { value: 'pharmacist', label: 'Pharmacist' },
  { value: 'other', label: 'Other' },
] as const
