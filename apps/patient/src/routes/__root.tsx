import { createRootRoute, Outlet } from '@tanstack/react-router'
import { Toaster } from 'sonner'
import '@/styles/globals.css'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  return (
    <>
      <Outlet />
      <Toaster
        position="top-right"
        richColors
        closeButton
        expand={true}
        duration={4000}
      />
    </>
  )
}
