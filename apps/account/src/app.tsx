import { RouterProvider } from '@tanstack/react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { AuthQueryProvider } from '@daveyplate/better-auth-tanstack'
import { createRoot } from 'react-dom/client'
import { createRouter } from './router'
import { initializeOneSignal } from '@/services/onesignal'
import { queryClient } from '@/services/query'
import { useSession } from '@/hooks/use-auth'
import { useMyPerson } from '@/hooks/use-person'
import { useOneSignal } from '@/hooks/use-onesignal'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { ReactQueryDevtoolsPanel } from '@tanstack/react-query-devtools'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'

const router = createRouter()

// Initialize OneSignal push notifications (optional - only if VITE_ONESIGNAL_APP_ID is set)
initializeOneSignal()

/**
 * Inner app component that provides auth context to router
 * This must be inside QueryClientProvider and AuthQueryProvider to access auth hooks
 */
function InnerApp() {
  // sync OneSignal user ID with auth state
  useOneSignal()

  // auth context
  const { data: session } = useSession()
  const { data: person } = useMyPerson()

  // build context
  const context = {
    auth: {
      session: session?.session || null,
      user: session?.user || null,
      person: person || null,
    }
  }
  return <RouterProvider router={router} context={context} />
}

/**
 * Root app component with all providers
 */
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthQueryProvider>
        <InnerApp />
      </AuthQueryProvider>
      <TanStackDevtools
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

// Pure SPA mode with TanStack Router
createRoot(document.getElementById('root')!).render(<App />)
