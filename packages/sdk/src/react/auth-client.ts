/**
 * Auth client context for React hooks
 *
 * This module provides a React context for accessing the Better-Auth client
 * configured by ApiProvider.
 */
import { createContext, useContext } from 'react'
import { createAuth, type AuthClient } from '../auth'

/**
 * React context for the auth client
 * Provided by ApiProvider
 */
export const AuthClientContext = createContext<AuthClient | null>(null)

/**
 * Initialize the auth client with the given base URL
 * Called by ApiProvider during setup
 */
export function initAuthClient(baseURL: string): AuthClient {
  return createAuth({ baseURL })
}

/**
 * Hook to access the auth client from context
 * Must be used within ApiProvider
 */
export function useAuthClient(): AuthClient {
  const authClient = useContext(AuthClientContext)
  if (!authClient) {
    throw new Error(
      'Auth client not initialized. Make sure ApiProvider is mounted before using auth hooks.'
    )
  }
  return authClient
}
