/**
 * Authentication hooks for Better-Auth with TanStack Query integration
 *
 * This file provides auth hooks that integrate Better-Auth with TanStack Query,
 * enabling seamless authentication state management in React components.
 *
 * Use these hooks when you need programmatic access to auth state and actions.
 * For pre-built UI components, use Better-Auth UI components instead.
 *
 * @see https://github.com/daveyplate/better-auth-tanstack
 */
import { createAuthHooks } from '@daveyplate/better-auth-tanstack'
import { authClient } from '@/services/auth'

// Create auth hooks with TanStack Query integration
const authHooks = createAuthHooks(authClient)

// Export other hooks directly from authHooks
export const {
  useSession,
  usePrefetchSession,
  useToken,
  useListAccounts,
  useListSessions,
  useListDeviceSessions,
  useListPasskeys,
  useUpdateUser,
  useUnlinkAccount,
  useRevokeOtherSessions,
  useRevokeSession,
  useRevokeSessions,
  useSetActiveSession,
  useRevokeDeviceSession,
  useDeletePasskey,
  useAuthQuery,
  useAuthMutation,
} = authHooks

// Custom email verification hook
export function useEmailVerification() {
  return useAuthMutation({
    mutationFn: async ({ email, callbackURL }: { email: string; callbackURL?: string }) => {
      return authClient.sendVerificationEmail({
        email,
        callbackURL: callbackURL || window.location.origin + '/dashboard',
      })
    },
  })
}
