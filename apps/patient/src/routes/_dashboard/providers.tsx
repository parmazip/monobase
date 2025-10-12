import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { Search, X, AlertCircle, Loader2 } from 'lucide-react'
import { requireAuthWithProfile } from '@/services/guards'
import { useSearchProviders, useProviderWithSlots } from '@/hooks/use-providers'
import { Button } from '@monobase/ui/components/button'
import { Card, CardContent } from '@monobase/ui/components/card'
import { Badge } from '@monobase/ui/components/badge'
import { Input } from '@monobase/ui/components/input'
import { Label } from '@monobase/ui/components/label'
import { Alert, AlertDescription } from '@monobase/ui/components/alert'
import { Combobox } from '@monobase/ui/components/combobox'
import { DateTimeFilter } from '@monobase/ui/components/datetime-filter'
import type { DateTimeFilterValue } from '@monobase/ui/components/datetime-filter'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@monobase/ui/components/dialog'
import { ProviderCard } from '@monobase/ui/provider/components/provider-card'
import { ProviderListSkeleton } from '@monobase/ui/provider/components/provider-card-skeleton'
import { BookingWidget } from '@monobase/ui/booking/components/booking-widget'
import { BookingWidgetSkeleton } from '@monobase/ui/booking/components/booking-widget-skeleton'
import type { BookingTimeSlot } from '@monobase/ui/booking/types'
import { MINOR_AILMENTS } from '@monobase/ui/constants/minor-ailments'
import { MINOR_AILMENTS_PRACTICE_LOCATIONS } from '@monobase/ui/constants/minor-ailments-practice-locations'
import { LANGUAGES } from '@monobase/ui/constants/languages'

export const Route = createFileRoute('/_dashboard/providers')({
  beforeLoad: requireAuthWithProfile(),
  component: ProvidersPage,
})

function ProvidersPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSpecialty, setSelectedSpecialty] = useState('all')
  const [selectedLanguage, setSelectedLanguage] = useState('all')
  const [selectedLocation, setSelectedLocation] = useState('all')
  const [selectedDateTime, setSelectedDateTime] = useState<DateTimeFilterValue>('any')

  // Combobox options
  const specialtyOptions = [
    { value: 'all', label: 'All Specialties' },
    ...MINOR_AILMENTS.map((s) => ({ value: s.code, label: s.name })),
  ]

  const languageOptions = [
    { value: 'all', label: 'All Languages' },
    ...LANGUAGES.slice(0, 20).map((l) => ({ value: l.code, label: l.name })),
  ]

  const locationOptions = [
    { value: 'all', label: 'All Locations' },
    ...MINOR_AILMENTS_PRACTICE_LOCATIONS.map((loc) => ({ value: loc.code, label: loc.name })),
  ]

  // Fetch providers with filters
  const { data: providers, isLoading, error } = useSearchProviders({
    searchQuery,
    specialty: selectedSpecialty,
    language: selectedLanguage,
    location: selectedLocation,
    dateTime: selectedDateTime,
  })

  const handleClearFilters = () => {
    setSearchQuery('')
    setSelectedSpecialty('all')
    setSelectedLanguage('all')
    setSelectedLocation('all')
    setSelectedDateTime('any')
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-headline font-bold">Find Providers</h1>
        <p className="text-muted-foreground font-body">
          Search and book appointments with healthcare providers
        </p>
      </div>

      {/* Search Bar */}
      <div className="max-w-2xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Search by name, specialty, or city..."
            className="pl-10 pr-4 py-3 text-lg"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Filter Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label className="mb-2 block">Specialty</Label>
                <Combobox
                  options={specialtyOptions}
                  value={selectedSpecialty}
                  onChange={(value) => setSelectedSpecialty(value as string)}
                  placeholder="Select specialty"
                  searchPlaceholder="Search specialties..."
                  emptyText="No specialty found"
                  className="w-full"
                />
              </div>

              <div>
                <Label className="mb-2 block">Language</Label>
                <Combobox
                  options={languageOptions}
                  value={selectedLanguage}
                  onChange={(value) => setSelectedLanguage(value as string)}
                  placeholder="Select language"
                  searchPlaceholder="Search languages..."
                  emptyText="No language found"
                  className="w-full"
                />
              </div>

              <div>
                <Label className="mb-2 block">Location</Label>
                <Combobox
                  options={locationOptions}
                  value={selectedLocation}
                  onChange={(value) => setSelectedLocation(value as string)}
                  placeholder="Select location"
                  searchPlaceholder="Search locations..."
                  emptyText="No location found"
                  className="w-full"
                />
              </div>

              <div>
                <Label className="mb-2 block">When</Label>
                <DateTimeFilter
                  value={selectedDateTime}
                  onChange={setSelectedDateTime}
                  className="w-full"
                />
              </div>
            </div>

            {/* Actions & Results Bar */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearFilters}
                className="text-gray-600 hover:text-gray-800"
              >
                <X className="w-4 h-4 mr-2" />
                Clear All
              </Button>

              <div className="text-sm text-gray-600 font-medium">
                {providers?.length ?? 0} providers available
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load providers. Please try again.
            <Button
              variant="link"
              size="sm"
              className="ml-2 p-0 h-auto"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Provider Grid */}
      {isLoading ? (
        <ProviderListSkeleton count={6} />
      ) : providers && providers.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {providers.map((provider) => (
            <ProviderBookingCard key={provider.id} provider={provider} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-2">No providers found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search criteria or filters
            </p>
            <Button variant="outline" onClick={handleClearFilters}>
              Clear all filters
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

interface ProviderBookingCardProps {
  provider: {
    id: string
    name: string
    title: string
    avatar?: string
    bio?: string
    specialties: string[]
    practiceLocations?: string[]
    languages?: string[]
  }
}

function ProviderBookingCard({ provider }: ProviderBookingCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const navigate = useNavigate()

  // Only fetch when dialog opens
  const { data: providerWithSlots, isLoading, error } = useProviderWithSlots(provider.id)

  const handleSlotSelect = (slot: BookingTimeSlot) => {
    // Navigate to booking flow with slot
    setDialogOpen(false)
    navigate({ to: `/booking/new/${slot.id}` })
  }

  // Transform API slots to BookingTimeSlot format
  const slots: BookingTimeSlot[] = providerWithSlots?.slots?.map(slot => ({
    id: slot.id,
    providerId: slot.provider,
    date: slot.startTime.split('T')[0], // Extract YYYY-MM-DD from ISO timestamp
    startTime: slot.startTime,
    endTime: slot.endTime,
    status: slot.status as 'available' | 'booked' | 'blocked',
    consultationModes: ['video'], // Default, could come from slot config
    price: slot.billingOverride?.price || 45.00
  })) || []

  return (
    <>
      <ProviderCard
        provider={provider}
        onBookClick={() => setDialogOpen(true)}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Book Appointment with {provider.name}</DialogTitle>
            {provider.title && (
              <p className="text-sm text-muted-foreground">{provider.title}</p>
            )}
          </DialogHeader>

          <div className="mt-4">
            {/* Loading State */}
            {isLoading && <BookingWidgetSkeleton />}

            {/* Error State */}
            {error && !isLoading && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {error.message || 'Failed to load slots'}
                  <Button
                    variant="link"
                    size="sm"
                    className="ml-2 p-0 h-auto"
                    onClick={() => setDialogOpen(false)}
                  >
                    Close
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {/* Booking Widget */}
            {!isLoading && !error && providerWithSlots && (
              <BookingWidget
                provider={{
                  id: providerWithSlots.id,
                  name: provider.name,
                }}
                slots={slots}
                event={providerWithSlots.event ? {
                  billingConfig: providerWithSlots.event.billingConfig
                } : undefined}
                onSlotSelect={handleSlotSelect}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
