/// <reference types="vite/client" />
import {
  createRootRoute,
  useRouter,
  Link,
  Outlet,
} from '@tanstack/react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { ReactQueryDevtoolsPanel } from '@tanstack/react-query-devtools'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { AuthQueryProvider } from '@daveyplate/better-auth-tanstack'
import { AuthUIProviderTanstack } from '@daveyplate/better-auth-ui/tanstack'
import { Toaster } from '@monobase/ui/components/sonner'
import { queryClient } from '@/api/query'
import { authClient } from '@/services/auth'
import { OneSignalSync } from '@/components/onesignal-sync'
import '@/styles/globals.css'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  const router = useRouter()

  return (
    <QueryClientProvider client={queryClient}>
      <AuthQueryProvider>
        <AuthUIProviderTanstack
          authClient={authClient}
          persistClient={false}
          navigate={(href) => router.navigate({ to: href, replace: true })}
          replace={(href) => router.navigate({ to: href, replace: true })}
          Link={({ href, ...props }) => <Link to={href} {...props} />}
          settings={{
            url: '/settings/security'
          }}
          emailVerification
          emailOTP
          credentials
          apiKey
          magicLink
          passkey
          twoFactor={["otp", "totp"]}
        >
          <OneSignalSync />
          <Outlet />
          <Toaster
            position="top-right"
            richColors
            closeButton
            expand={true}
            duration={4000}
          />
        </AuthUIProviderTanstack>
      </AuthQueryProvider>
      <TanStackDevtools
        initialIsOpen={false}
        position="bottom-right"
        plugins={[
          {
            name: 'TanStack Query',
            render: <ReactQueryDevtoolsPanel />
          },
          {
            name: 'TanStack Router',
            render: <TanStackRouterDevtoolsPanel />
          }
        ]}
      />
    </QueryClientProvider>
  )
}
