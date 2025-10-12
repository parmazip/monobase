'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Search,
  X,
  AlertCircle,
  Video
} from 'lucide-react'
import { Button } from "@monobase/ui/components/button"
import { Input } from "@monobase/ui/components/input"
import { Combobox } from "@monobase/ui/components/combobox"
import { ProviderCard } from "@monobase/ui/provider/components/provider-card"
import { ProviderListSkeleton } from "@monobase/ui/provider/components/provider-card-skeleton"
import { Alert, AlertDescription } from "@monobase/ui/components/alert"
import { SiteHeader } from '@/components/layout/site-header'
import { UnifiedDateTimeFilter, type DateTimeRange } from '@/components/ui/unified-datetime-filter'
import { useSearchProviders } from '@monobase/sdk/react/hooks/use-booking'
import { useSession, useSignOut } from '@monobase/sdk/react/hooks/use-auth'
import { MINOR_AILMENTS } from '@monobase/ui/constants/minor-ailments'
import { MINOR_AILMENTS_PRACTICE_LOCATIONS } from '@monobase/ui/constants/minor-ailments-practice-locations'
import { LANGUAGES } from '@monobase/ui/constants/languages'

export default function PharmacistsPage(): React.JSX.Element {
  const { data: session, isLoading: authLoading } = useSession()
  const signOut = useSignOut()

  const handleSignOut = async () => {
    await signOut.mutateAsync()
  }

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSpecialty, setSelectedSpecialty] = useState('all')
  const [selectedLanguage, setSelectedLanguage] = useState('all')
  const [selectedLocation, setSelectedLocation] = useState('all')
  const [selectedDateTime, setSelectedDateTime] = useState<DateTimeRange>({})

  // Combobox options
  // Use codes for API filtering (minorAilmentsSpecialty expects code like 'acne-mild')
  const specialtyOptions = useMemo(() => [
    { value: 'all', label: 'All Specialties' },
    ...MINOR_AILMENTS.map(s => ({ value: s.code, label: s.name }))
  ], [])

  const languageOptions = useMemo(() => [
    { value: 'all', label: 'All Languages' },
    ...LANGUAGES.map(l => ({ value: l.code, label: l.name }))
  ], [])

  const locationOptions = useMemo(() => [
    { value: 'all', label: 'All Locations' },
    ...MINOR_AILMENTS_PRACTICE_LOCATIONS.map(loc => ({ 
      value: loc.code, 
      label: loc.name 
    }))
  ], [])

  // Fetch providers using real API hook with search parameters
  // Server-side filtering for specialty, location, and language
  const { data: providersResponse, isLoading, error: queryError } = useSearchProviders({
    q: searchQuery || undefined,
    specialty: selectedSpecialty === 'all' ? undefined : selectedSpecialty,
    location: selectedLocation === 'all' ? undefined : selectedLocation,
    language: selectedLanguage === 'all' ? undefined : selectedLanguage,
    availableFrom: selectedDateTime.from,
    availableTo: selectedDateTime.to,
  })

  const pharmacists = providersResponse?.data || []
  const error = queryError?.message || null

  // All filtering is now handled server-side (search, specialty, location, language, datetime)
  const sortedPharmacists = useMemo(() => {
    return [...pharmacists]
  }, [pharmacists])

  return (
    <>
      <SiteHeader
        session={session}
        isLoading={authLoading}
        onSignOut={handleSignOut}
      />
      
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-primary/5 to-primary/10 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Video Consultations with Licensed Pharmacists
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Get professional medication advice from the comfort of your home
              </p>
              
              {/* Search Bar */}
              <div className="max-w-2xl mx-auto">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    type="text"
                    placeholder="Search by name, specialty, or city..."
                    aria-label="Search pharmacists by name, specialty, or city"
                    className="pl-10 pr-4 py-3 text-lg"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4">
            {/* Filter Controls Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Combobox
                options={specialtyOptions}
                value={selectedSpecialty}
                onChange={(value) => setSelectedSpecialty(value as string)}
                placeholder="Select specialty"
                searchPlaceholder="Search specialties..."
                emptyText="No specialty found"
                className="w-full"
              />

              <Combobox
                options={languageOptions}
                value={selectedLanguage}
                onChange={(value) => setSelectedLanguage(value as string)}
                placeholder="Select language"
                searchPlaceholder="Search languages..."
                emptyText="No language found"
                className="w-full"
              />

              <Combobox
                options={locationOptions}
                value={selectedLocation}
                onChange={(value) => setSelectedLocation(value as string)}
                placeholder="Select location"
                searchPlaceholder="Search locations..."
                emptyText="No location found"
                className="w-full"
              />

              <UnifiedDateTimeFilter
                value={selectedDateTime}
                onChange={setSelectedDateTime}
                className="w-full"
              />
            </div>

            {/* Actions & Results Bar */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedSpecialty('all')
                  setSelectedLanguage('all')
                  setSelectedLocation('all')
                  setSelectedDateTime({})
                  setSearchQuery('')
                }}
                className="text-gray-600 hover:text-gray-800"
              >
                <X className="w-4 h-4 mr-2" />
                Clear All
              </Button>

              <div className="text-sm text-gray-600 font-medium">
                {sortedPharmacists.length} pharmacists available
              </div>
            </div>
          </div>
        </div>

        {/* Pharmacist Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Error State */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error}
                <Button 
                  variant="link" 
                  size="sm" 
                  className="ml-2 p-0 h-auto"
                  onClick={() => window.location.reload()}
                >
                  Try Again
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Loading State */}
          {isLoading ? (
            <ProviderListSkeleton count={6} />
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {sortedPharmacists.map((pharmacist, index) => (
                <motion.div
                  key={pharmacist.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <ProviderCard
                    provider={{
                      id: pharmacist.id,
                      name: pharmacist.name,
                      title: pharmacist.title,
                      avatar: pharmacist.avatar,
                      bio: pharmacist.bio || "Virtual consultation with your pharmacist",
                      specialties: pharmacist.specialties,
                      practiceLocations: pharmacist.practiceLocations,
                      languages: pharmacist.languages
                    }}
                  >
                    <Link href={`/pharmacists/${pharmacist.id}`} className="block">
                      <Button className="w-full bg-red-600 hover:bg-red-700">
                        <Video className="w-4 h-4 mr-2" />
                        Book Appointment
                      </Button>
                    </Link>
                  </ProviderCard>
                </motion.div>
              ))}
            </div>
          )}
          
          {!isLoading && sortedPharmacists.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                No pharmacists found matching your criteria.
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setSearchQuery('')
                  setSelectedSpecialty('all')
                }}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}