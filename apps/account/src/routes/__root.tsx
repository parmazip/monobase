/// <reference types="vite/client" />
import {
  createRootRouteWithContext,
  useRouter,
  Link,
  Outlet,
} from '@tanstack/react-router'
import type { RouterContext } from '@/router'
import { AuthUIProviderTanstack } from '@daveyplate/better-auth-ui/tanstack'
import { Toaster } from 'sonner'
import { getAuthClient } from '@monobase/sdk/react/auth-client'
import '@/styles/globals.css'

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
})

function RootComponent() {
  const router = useRouter()
  const authClient = getAuthClient()

  return (
    <AuthUIProviderTanstack
      authClient={authClient}
      persistClient={false}
      navigate={(href) => router.navigate({ to: href, replace: true })}
      replace={(href) => router.navigate({ to: href, replace: true })}
      Link={({ href, ...props }) => <Link to={href} {...props} />}
      emailVerification
      emailOTP
      credentials
      apiKey
      magicLink
      passkey
      twoFactor={["otp", "totp"]}
    >
      <Outlet />
      <Toaster
        position="top-right"
        richColors
        closeButton
        expand={true}
        duration={4000}
      />
    </AuthUIProviderTanstack>
  )
}
