'use client'

import { useParams, useRouter } from 'next/navigation'
import {
  Star,
  Clock,
  Video,
  Languages,
  MapPin
} from 'lucide-react'
import { Button } from "@monobase/ui/components/button"
import { Badge } from "@monobase/ui/components/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@monobase/ui/components/card"
import { Avatar, AvatarFallback, AvatarImage } from "@monobase/ui/components/avatar"
import { Separator } from "@monobase/ui/components/separator"
import { BookingWidget, type BookingTimeSlot, type BookingProvider } from "@monobase/ui/booking/components/booking-widget"
import { BookingWidgetSkeleton } from "@monobase/ui/booking/components/booking-widget-skeleton"
import type { Pharmacist } from '@/types/ui'
import type { SimpleTimeSlot } from '@/types/ui'
import type { BookingEvent } from '@/types/api'
import { useProviderWithSlots } from '@monobase/sdk/react/hooks/use-booking'
import { patientAppUrl } from '@/utils/config'

export function PharmacistProfileContent(): React.JSX.Element {
  const params = useParams()
  const router = useRouter()

  // Fetch provider data with slots and event using single API call
  const pharmacistId = params.pharmacistId as string
  const { data, isLoading: isLoadingPharmacist, error: pharmacistQueryError } = useProviderWithSlots(pharmacistId)
  const pharmacist = data?.provider
  const slots = data?.slots || []
  const event = data?.event
  const pharmacistError = pharmacistQueryError?.message || null

  // Transform website-specific types to generic booking types
  const bookingSlots: BookingTimeSlot[] = slots.map(slot => ({
    id: slot.id,
    providerId: pharmacistId,
    date: slot.date,
    startTime: slot.startTime,
    endTime: slot.endTime,
    status: slot.status,
    consultationModes: ['video'], // Default to video consultation
    price: slot.price
  }))

  const bookingProvider: BookingProvider = pharmacist ? {
    id: pharmacist.id,
    name: pharmacist.name,
    avatar: pharmacist.avatar
  } : { id: '', name: '', avatar: undefined }

  const bookingEvent = event ? {
    billingConfig: event.billingConfig ? {
      cancellationThresholdMinutes: event.billingConfig.cancellationThresholdMinutes
    } : undefined
  } : undefined

  // Handler for controlled BookingWidget
  const handleSlotSelect = (slot: BookingTimeSlot) => {
    // Directly open patient app booking page in new tab
    const bookingUrl = `${patientAppUrl}/booking/new/${slot.id}`
    window.open(bookingUrl, '_blank')
  }

  if (isLoadingPharmacist) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Loading skeleton for profile */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-24 h-24 bg-gray-200 rounded-full animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-6 bg-gray-200 rounded w-3/4 animate-pulse" />
                      <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
                      <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div>
              <BookingWidgetSkeleton className="sticky top-24" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!pharmacist || pharmacistError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Pharmacist not found</p>
            <Button className="w-full mt-4" onClick={() => router.push('/pharmacists')}>
              Back to Pharmacists
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Provider Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Provider Header */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={pharmacist.avatar} alt={pharmacist.name} />
                    <AvatarFallback className="text-xl">
                      {pharmacist.name.split(' ').map((n: string) => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold" data-testid="pharmacist-name">{pharmacist.name}</h1>
                    <p className="text-lg text-muted-foreground" data-testid="pharmacist-title">{pharmacist.title}</p>

                    {/* Display all specialties */}
                    <div className="flex flex-wrap gap-1 mt-2" data-testid="pharmacist-specializations">
                      {pharmacist.specialties.map((specialty: string) => (
                        <Badge key={specialty} variant="outline" className="text-xs">
                          {specialty}
                        </Badge>
                      ))}
                    </div>

                    {/* Display all practice locations with icon */}
                    {pharmacist.practiceLocations.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2" data-testid="pharmacist-locations">
                        {pharmacist.practiceLocations.map((location: string) => (
                          <Badge key={location} variant="secondary" className="text-xs">
                            {location}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Experience with icon */}
                    <div className="flex items-center gap-1.5 mt-3">
                      <Badge variant="secondary" className="text-xs">
                        {pharmacist.yearsExperience} years experience
                      </Badge>
                    </div>

                    {/* Video Consultation badge */}
                    <div className="flex gap-2 mt-2">
                      <Badge variant="secondary" className="text-xs">
                        <Video className="w-3 h-3 mr-1" />
                        Video Consultation
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* About Section */}
            <Card>
              <CardHeader>
                <CardTitle>About {pharmacist.name.split(',')[0]}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Biography */}
                <div>
                  <p className="text-muted-foreground leading-relaxed" data-testid="pharmacist-bio">{pharmacist.bio}</p>
                </div>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Experience */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">Experience</span>
                    </div>
                    <p className="text-lg font-semibold" data-testid="years-experience">{pharmacist.yearsExperience} years</p>
                  </div>

                  {/* Languages */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Languages className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">Languages</span>
                    </div>
                    <div className="flex flex-wrap gap-1" data-testid="pharmacist-languages">
                      {pharmacist.languages.map((lang: string) => (
                        <Badge key={lang} variant="secondary" className="text-xs">
                          {lang}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Booking Widget */}
          <div className="space-y-6">
            <BookingWidget
              provider={bookingProvider}
              slots={bookingSlots}
              event={bookingEvent}
              onSlotSelect={handleSlotSelect}
              className="sticky top-24"
            />
          </div>
        </div>
      </div>
    </div>
  )
}