import { redirect } from '@tanstack/react-router'
import { queryClient, queryKeys } from '@/api/query'
import { authClient } from '@/services/auth'
import { getMyProfile } from '@/api/person'

/**
 * Get authenticated session with caching (MyCure Pattern)
 * Uses TanStack Query caching instead of direct authClient calls
 */
function getAuthSessionCached() {
  return queryClient.fetchQuery({
    queryKey: ['session'],
    queryFn: () => authClient.getSession({ fetchOptions: { throw: true } }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000,   // 30 minutes
  });
}

/**
 * Cached profile helper
 */
function getMyProfileCached () {
  return queryClient.fetchQuery({
    queryKey: queryKeys.personProfile('me'),
    queryFn: getMyProfile,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000,   // 30 minutes (cache time)
  });
}

/**
 * Require user to be authenticated, redirect to sign-in if not
 */
export function requireAuth() {
  return async () => {
    try {
      const session = await getAuthSessionCached()
      if (!session?.user) {
        throw redirect({
          to: '/auth/sign-in',
          search: {
            redirect: window.location.pathname + window.location.search,
          },
        })
      }
      return { user: session.user }
    } catch (error) {
      throw redirect({
        to: '/auth/sign-in',
        search: {
          redirect: window.location.pathname + window.location.search,
        },
      })
    }
  }
}

/**
 * Require user to be authenticated AND have a complete profile
 */
export function requireAuthWithProfile() {
  return async () => {
    const session = await getAuthSessionCached()
    const user = session?.user;
    if (!user) {
      throw redirect({
        to: '/auth/sign-in',
        search: {
          redirect: window.location.pathname + window.location.search,
        },
      })
    }

    const profile = await getMyProfileCached()
    if (!profile) {
      throw redirect({
        to: '/onboarding',
      })
    }

    return { user, profile }
  }
}

/**
 * Require user to be authenticated but NOT have a complete profile (for onboarding)
 */
export function requireAuthWithoutProfile() {
  return async () => {
    const session = await getAuthSessionCached()
    const user = session?.user;
    if (!user) {
      throw redirect({
        to: '/auth/sign-in',
        search: {
          redirect: window.location.pathname + window.location.search,
        },
      })
    }

    const profile = await getMyProfileCached()
    if (profile) {
      throw redirect({
        to: '/dashboard',
      })
    }

    return { user }
  }
}

/**
 * Require user to be a guest (not authenticated), redirect to dashboard if authenticated
 */
export function requireGuest() {
  return async () => {
    const session = await getAuthSessionCached()
    const user = session?.user;
    if (user) {
      throw redirect({
        to: '/dashboard',
      })
    }
  }
}
