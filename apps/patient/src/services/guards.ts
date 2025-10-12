/**
 * Route Guards for Patient App
 */
import { redirect } from '@tanstack/react-router'
import type { RouterContext } from '@/router'

/**
 * Guard that requires user to be authenticated
 */
export async function requireAuth({ context, location }: { context: RouterContext; location?: any }) {
  if (!context.auth.user) {
    throw redirect({
      to: '/auth/sign-in',
      search: {
        redirect: location?.href || `${window.location.pathname}${window.location.search}`,
      },
    })
  }
  return { user: context.auth.user }
}

/**
 * Guard that requires user to be authenticated but NOT have a profile
 * Used for onboarding flow
 */
export async function requireAuthWithoutProfile({ context }: { context: RouterContext }) {
  if (!context.auth.user) {
    throw redirect({ to: '/auth/sign-in' })
  }
  if (context.auth.person) {
    throw redirect({ to: '/dashboard' })
  }
  return { user: context.auth.user }
}

/**
 * Guard that requires user to be authenticated AND have a profile
 * Used for dashboard and protected routes
 */
export async function requireAuthWithProfile({ context }: { context: RouterContext }) {
  if (!context.auth.user) {
    throw redirect({ to: '/auth/sign-in' })
  }
  if (!context.auth.person) {
    throw redirect({ to: '/onboarding' as any })
  }
  return {
    user: context.auth.user,
    person: context.auth.person,
  }
}

/**
 * Guard that requires user to be a guest (not authenticated)
 */
export async function requireGuest({ context }: { context: RouterContext }) {
  if (context.auth.user) {
    throw redirect({ to: '/dashboard' })
  }
}

/**
 * Compose multiple guard functions
 */
export function composeGuards(...guards: Array<(opts: any) => Promise<any> | any>) {
  return async (opts: any) => {
    let result = {}
    for (const guard of guards) {
      const guardResult = await guard(opts)
      if (guardResult) {
        result = { ...result, ...guardResult }
      }
    }
    return result
  }
}
