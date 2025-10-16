'use client'

import { Suspense } from 'react'
import { SiteHeader } from '@/components/layout/site-header'
import { useSession, useSignOut } from '@monobase/sdk/react/hooks/use-auth'
import { PharmacistProfileContent } from './pharmacist-profile-content'

export default function PharmacistProfilePage(): React.JSX.Element {
  const { data: session, isLoading } = useSession()
  const signOut = useSignOut()

  const handleSignOut = async () => {
    await signOut.mutateAsync()
  }

  return (
    <>
      <SiteHeader
        session={session}
        isLoading={isLoading}
        onSignOut={handleSignOut}
      />
      <Suspense fallback={<div>Loading...</div>}>
        <PharmacistProfileContent />
      </Suspense>
    </>
  )
}