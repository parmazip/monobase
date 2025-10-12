import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { Button } from "@monobase/ui/components/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@monobase/ui/components/card"
import { Progress } from "@monobase/ui/components/progress"
import { ChevronLeft, ChevronRight, UserCheck, MapPin, Briefcase, CreditCard } from 'lucide-react'
import { Logo } from '@/components/logo'
import { requireAuth, requireEmailVerified, requireNoPerson, requireNoProviderProfile, composeGuards } from '@/utils/guards'
import { useDetectTimezone } from '@monobase/ui/hooks/use-detect-timezone'
import { useDetectLanguage } from '@monobase/ui/hooks/use-detect-language'
import { useDetectCountry } from '@monobase/ui/hooks/use-detect-country'
import { toast } from 'sonner'
import { formatDate } from '@monobase/ui/lib/format-date'

// Import forms from UI package
import { PersonalInfoForm } from '@monobase/ui/person/components/personal-info-form'
import { AddressForm } from '@monobase/ui/person/components/address-form'
import { ProviderForm } from '@monobase/ui/provider/components/provider-form'
import { MerchantAccountSetup } from '@monobase/ui/billing/components/merchant-account-setup'
import type { PersonalInfo, OptionalAddress } from '@monobase/ui/person/schemas'
import type { ProviderFormData } from '@monobase/ui/provider/schemas'

// Import SDK hooks
import { useCreateMyPerson } from '@monobase/sdk/react/hooks/use-person'
import { useCreateMyProvider } from '@monobase/sdk/react/hooks/use-provider'
import {
  useMyMerchantAccountStatus,
  useCreateMyMerchantAccount,
  useGetMyOnboardingUrl
} from '@monobase/sdk/react/hooks/use-billing'
import { getAccountSetupStatus } from '@monobase/sdk/services/billing'

export const Route = createFileRoute('/onboarding')({
  beforeLoad: composeGuards(requireAuth, requireEmailVerified, requireNoPerson, requireNoProviderProfile),
  component: OnboardingPage,
})

function OnboardingPage() {
  const navigate = useNavigate()
  const context = Route.useRouteContext()
  const user = context.auth?.user
  const [currentStep, setCurrentStep] = useState(1)
  const detectedLanguage = useDetectLanguage()
  const detectedTimezone = useDetectTimezone()
  const detectedCountry = useDetectCountry()

  // Store form data across steps
  const [formData, setFormData] = useState<{
    personal?: PersonalInfo
    address?: OptionalAddress
  }>({})

  const createPersonMutation = useCreateMyPerson()
  const createProviderMutation = useCreateMyProvider()
  
  const { data: merchantAccount, isLoading: merchantLoading } = useMyMerchantAccountStatus()
  const status = getAccountSetupStatus(merchantAccount?.account ?? null)
  const createMerchantMutation = useCreateMyMerchantAccount()
  const onboardingMutation = useGetMyOnboardingUrl()

  const totalSteps = 4

  const handlePersonalInfoSubmit = (data: PersonalInfo) => {
    setFormData(prev => ({ ...prev, personal: data }))
    setCurrentStep(2)
  }

  const handleAddressSubmit = (data: OptionalAddress) => {
    setFormData(prev => ({ ...prev, address: data }))
    setCurrentStep(3)
  }

  const handleSkipAddress = () => {
    setCurrentStep(3)
  }

  const handleProviderSubmit = async (data: ProviderFormData) => {
    setFormData(prev => ({ ...prev, provider: data }))

    if (!formData.personal) {
      return
    }

    try {
      // Create person profile
      await createPersonMutation.mutateAsync({
        firstName: formData.personal.firstName,
        lastName: formData.personal.lastName,
        middleName: formData.personal.middleName,
        dateOfBirth: formData.personal.dateOfBirth,
        gender: formData.personal.gender,
        avatar: formData.personal.avatar,
        primaryAddress: formData.address,
        languagesSpoken: [detectedLanguage],
        timezone: detectedTimezone,
      })

      // Create provider profile
      await createProviderMutation.mutateAsync({
        providerType: 'pharmacist',
        yearsOfExperience: data.yearsOfExperience,
        biography: data.biography,
        minorAilmentsSpecialties: data.minorAilmentsSpecialties,
        minorAilmentsPracticeLocations: data.minorAilmentsPracticeLocations,
      })

      setCurrentStep(4)
    } catch (error) {
      console.error('Failed to create profile', error)
    }
  }

  const handleSetupMerchantAccount = async () => {
    const baseUrl = window.location.origin
    const refreshUrl = `${baseUrl}/dashboard`
    const returnUrl = `${baseUrl}/dashboard`

    if (status === 'none') {
      await createMerchantMutation.mutateAsync({ refreshUrl, returnUrl })
    } else if (status === 'incomplete' && merchantAccount?.account) {
      onboardingMutation.mutate({ merchantAccountId: merchantAccount.account.id, refreshUrl, returnUrl })
    }
  }

  const handleMerchantAccountSubmit = () => {
    navigate({ to: '/dashboard' })
  }

  const handleSkipMerchantAccount = () => {
    navigate({ to: '/dashboard' })
  }

  const goBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const getStepIcon = (step: number) => {
    switch (step) {
      case 1: return <UserCheck className="w-5 h-5" />
      case 2: return <MapPin className="w-5 h-5" />
      case 3: return <Briefcase className="w-5 h-5" />
      case 4: return <CreditCard className="w-5 h-5" />
      default: return null
    }
  }

  const getStepTitle = (step: number) => {
    switch (step) {
      case 1: return 'Personal Information'
      case 2: return 'Address (Optional)'
      case 3: return 'Professional Information'
      case 4: return 'Merchant Account (Optional)'
      default: return ''
    }
  }

  const getStepDescription = (step: number) => {
    switch (step) {
      case 1: return 'Tell us about yourself'
      case 2: return 'Where can we reach you? You can skip this step for now.'
      case 3: return 'Share your professional background and expertise'
      case 4: return 'Connect your merchant account to receive payments'
      default: return ''
    }
  }

  const isLoading = createPersonMutation.isPending || createProviderMutation.isPending

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <Logo variant="horizontal" size="md" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Welcome to Monobase</h1>
          <p className="text-muted-foreground mt-2">Let's set up your provider profile</p>
        </div>

        {/* Progress Bar */}
        <Progress value={(currentStep / totalSteps) * 100} className="h-2" />

        {/* Main Form Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-3">
              {getStepIcon(currentStep)}
              <div>
                <CardTitle>
                  Step {currentStep} of {totalSteps}: {getStepTitle(currentStep)}
                </CardTitle>
                <CardDescription>
                  {getStepDescription(currentStep)}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
              <PersonalInfoForm
                onSubmit={handlePersonalInfoSubmit}
                defaultValues={formData.personal || {
                  firstName: user?.name?.split(' ')[0] || '',
                  lastName: user?.name?.split(' ').slice(1).join(' ') || '',
                }}
                mode="create"
                role="provider"
                showButtons={false}
                formId="step-1-form"
              />
            )}

            {/* Step 2: Address (Optional) */}
            {currentStep === 2 && (
              <AddressForm
                onSubmit={handleAddressSubmit}
                onSkip={handleSkipAddress}
                defaultValues={formData.address || { country: detectedCountry }}
                mode="create"
                showButtons={false}
              />
            )}

            {/* Step 3: Professional Information */}
            {currentStep === 3 && (
              <ProviderForm
                defaultValues={formData.provider}
                onSubmit={handleProviderSubmit}
                isLoading={isLoading}
                showButtons={false}
                formId="step-3-form"
              />
            )}

            {/* Step 4: Merchant Account Setup */}
            {currentStep === 4 && (
              <MerchantAccountSetup
                account={merchantAccount?.account ? {
                  id: merchantAccount.account.id,
                  metadata: {
                    onboardingStartedAt: merchantAccount.account.metadata?.onboardingStartedAt?.toISOString(),
                  }
                } : null}
                status={status}
                isLoading={merchantLoading || createMerchantMutation.isPending || onboardingMutation.isPending}
                onSetupAccount={handleSetupMerchantAccount}
                onSubmit={handleMerchantAccountSubmit}
                onSkip={handleSkipMerchantAccount}
                showButtons={false}
              />
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-6">
              {/* Back Button */}
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={goBack}
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              )}

              {/* Step 1: Next Button */}
              {currentStep === 1 && (
                <Button
                  type="submit"
                  form="step-1-form"
                  className="ml-auto"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              )}

              {/* Step 2: Skip and Next Buttons */}
              {currentStep === 2 && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    className="ml-auto mr-2"
                    onClick={handleSkipAddress}
                    disabled={isLoading}
                  >
                    Skip for now
                  </Button>
                  <Button
                    type="button"
                    disabled={isLoading}
                    onClick={() => {
                      const forms = document.querySelectorAll('form')
                      if (forms[0]) {
                        forms[0].requestSubmit()
                      }
                    }}
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </>
              )}

              {/* Step 3: Next Button */}
              {currentStep === 3 && (
                <Button
                  type="submit"
                  form="step-3-form"
                  className="ml-auto"
                  disabled={isLoading}
                >
                  {isLoading ? 'Creating Profile...' : 'Next'}
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              )}

              {/* Step 4: Skip and Complete Buttons */}
              {currentStep === 4 && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    className="ml-auto mr-2"
                    onClick={handleSkipMerchantAccount}
                    disabled={isLoading}
                  >
                    Skip for now
                  </Button>
                  <Button
                    type="button"
                    onClick={handleMerchantAccountSubmit}
                    disabled={isLoading}
                  >
                    Complete Setup
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Progress Indicators */}
        <div className="flex justify-center space-x-2">
          {Array.from({ length: totalSteps }).map((_, index) => {
            const stepNumber = index + 1
            const isCompleted = stepNumber < currentStep
            const isCurrent = stepNumber === currentStep

            return (
              <div
                key={stepNumber}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                  isCompleted ? 'bg-primary text-primary-foreground' :
                  isCurrent ? 'bg-primary text-primary-foreground' :
                  'bg-muted text-muted-foreground'
                }`}
              >
                {stepNumber}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
