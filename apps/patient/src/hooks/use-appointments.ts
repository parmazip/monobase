// Re-export SDK booking hooks as appointments
// In monobase, appointments = bookings
export {
  useListBookings as useAppointments,
  useBooking as useAppointment,
  useCancelBooking as useCancelAppointment,
  useConfirmBooking as useConfirmAppointment,
  useRejectBooking as useRejectAppointment,
} from '@monobase/sdk/react/hooks/use-booking'
