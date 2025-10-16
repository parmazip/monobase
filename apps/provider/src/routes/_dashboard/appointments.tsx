import { createFileRoute, Link, Outlet, useMatchRoute } from '@tanstack/react-router'
import { Calendar } from 'lucide-react'
import { Button } from "@monobase/ui/components/button"
import { Tabs, TabsList, TabsTrigger } from "@monobase/ui/components/tabs"
import { Badge } from "@monobase/ui/components/badge"
import { useMyBookingEvent, useListBookings } from '@monobase/sdk/react/hooks/use-booking'

export const Route = createFileRoute('/_dashboard/appointments')({
  component: AppointmentsLayout,
})

function AppointmentsLayout() {
  const matchRoute = useMatchRoute()

  // Check booking event status for conditional "Set Availability" button
  const { data: bookingEvent } = useMyBookingEvent()

  // Fetch counts for each tab badge (lightweight queries)
  const { data: confirmedData } = useListBookings({ status: 'confirmed', limit: 1 })
  const { data: pendingData } = useListBookings({ status: 'pending', limit: 1 })

  const confirmedCount = confirmedData?.pagination?.totalCount || 0
  const pendingCount = pendingData?.pagination?.totalCount || 0

  // Determine active tab based on current route
  const isUpcoming = !!matchRoute({ to: '/appointments/upcoming' })
  const isRequests = !!matchRoute({ to: '/appointments/requests' })
  const isPast = !!matchRoute({ to: '/appointments/past' })

  const activeTab = isRequests ? 'requests' : isPast ? 'past' : 'upcoming'

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-headline font-bold">Patient Appointments</h1>
          <p className="text-muted-foreground font-body">
            Manage your patient consultations and appointments
          </p>
        </div>
        {!bookingEvent && (
          <Button variant="outline" className="w-full sm:w-auto" asChild>
            <Link to="/settings/schedule">
              <Calendar className="mr-2 h-4 w-4" />
              Set Availability
            </Link>
          </Button>
        )}
      </div>

      {/* Appointments Tabs */}
      <Tabs value={activeTab} className="w-full">
        <TabsList>
          <TabsTrigger value="upcoming" asChild>
            <Link to="/appointments/upcoming">
              Upcoming
              <Badge variant="secondary" className="ml-2">
                {confirmedCount}
              </Badge>
            </Link>
          </TabsTrigger>
          <TabsTrigger value="requests" asChild>
            <Link to="/appointments/requests">
              Requests
              <Badge variant="secondary" className="ml-2">
                {pendingCount}
              </Badge>
            </Link>
          </TabsTrigger>
          <TabsTrigger value="past" asChild>
            <Link to="/appointments/past">
              Past
            </Link>
          </TabsTrigger>
        </TabsList>

        {/* Child routes render here */}
        <div className="mt-6">
          <Outlet />
        </div>
      </Tabs>
    </div>
  )
}
