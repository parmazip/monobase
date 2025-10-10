// src/router.tsx
import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen.ts'
import { NotFound } from '@/components/not-found'
import type { Person } from '@/services/person'

// ============================================================================
// Router Context Type
// ============================================================================

export interface RouterContext {
  auth: {
    user: {
      id: string
      email: string
      emailVerified: boolean
      name: string
      image?: string | null
      createdAt: Date
      updatedAt: Date
      twoFactorEnabled?: boolean | null
    } | null
    session: {
      id: string
      userId: string
      expiresAt: Date
      token: string
      ipAddress?: string | null
      userAgent?: string | null
      createdAt: Date
      updatedAt: Date
    } | null
    person: Person | null
  }
}

// ============================================================================
// Router Factory
// ============================================================================

export function createRouter() {
  const router = createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    defaultNotFoundComponent: NotFound,
    notFoundMode: 'fuzzy',
    context: {
      auth: undefined!,  // Will be provided by RouterProvider
    },
  })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createRouter>
  }
}
