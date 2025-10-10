import { apiBaseUrl } from '@/utils/config'
import { createAuthClient } from "better-auth/react"
import { passkeyClient } from "better-auth/client/plugins"
import { twoFactorClient } from "better-auth/client/plugins"
import { redirect } from '@tanstack/react-router'
import type { RouterContext } from '@/router'

// ============================================================================
// Auth Client
// ============================================================================

// Create auth client
export const authClient = createAuthClient({
  baseURL: `${apiBaseUrl}/auth`,
  plugins: [
    passkeyClient(),
    twoFactorClient(),
  ],
})

// ============================================================================
// Composable Route Guards
// ============================================================================

/**
 * Guard that requires user to be authenticated
 * Reads auth state from router context - no querying!
 * Redirects to sign-in if not authenticated
 */
export async function requireAuth({ context, location }: { context: RouterContext; location?: any }) {
  if (!context.auth.user) {
    throw redirect({
      to: '/auth/sign-in',
      search: {
        redirect: location ? location.pathname + location.search : window.location.pathname + window.location.search,
      },
    })
  }
}

/**
 * Guard that requires user to be a guest (not authenticated)
 * Reads auth state from router context - no querying!
 * Redirects to dashboard if already authenticated
 */
export async function requireGuest({ context }: { context: RouterContext }) {
  if (context.auth.user) {
    throw redirect({
      to: '/dashboard',
    })
  }
}
