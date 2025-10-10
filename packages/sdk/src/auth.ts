import { createAuthClient } from "better-auth/react"
import { passkeyClient, twoFactorClient } from "better-auth/client/plugins"

// Re-export types from better-auth for shared use across frontend/backend
export type { User, Session } from 'better-auth'

export interface AuthConfig {
  baseURL: string
}

export function createAuth(config: AuthConfig) {
  return createAuthClient({
    baseURL: `${config.baseURL}/auth`,
    plugins: [
      passkeyClient(),
      twoFactorClient(),
    ],
  })
}

export type AuthClient = ReturnType<typeof createAuth>