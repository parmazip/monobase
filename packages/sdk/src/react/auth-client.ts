/**
 * Auth client singleton for React hooks
 *
 * This module manages a singleton Better-Auth client instance that can be
 * configured at runtime (via ApiProvider) and accessed by hooks.
 */
import { createAuth, type AuthClient } from '../auth'

let authClient: AuthClient | null = null

/**
 * Initialize the auth client with the given base URL
 * Called by ApiProvider during setup
 */
export function initAuthClient(baseURL: string): AuthClient {
  authClient = createAuth({ baseURL })
  return authClient
}

/**
 * Get the current auth client instance
 * Throws if not initialized (ApiProvider not mounted)
 */
export function getAuthClient(): AuthClient {
  if (!authClient) {
    throw new Error(
      'Auth client not initialized. Make sure ApiProvider is mounted before using auth hooks.'
    )
  }
  return authClient
}
