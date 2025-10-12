// Re-export SDK patient hooks
export {
  useMyPatient as usePatientProfile,
  useCreatePatient,
  useUpdatePatient,
  useUpdatePrimaryProvider,
  useUpdatePrimaryPharmacy,
  useHasPatientProfile,
} from '@monobase/sdk/react/hooks/use-patient'
