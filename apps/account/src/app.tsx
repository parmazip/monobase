import { RouterProvider } from '@tanstack/react-router'
import { createRoot } from 'react-dom/client'
import { createRouter } from './router'
import { initializeOneSignal } from '@/services/onesignal'

const router = createRouter()

// Initialize OneSignal push notifications (optional - only if VITE_ONESIGNAL_APP_ID is set)
initializeOneSignal()

// Pure SPA mode with TanStack Router
createRoot(document.getElementById('root')!).render(<RouterProvider router={router} />)