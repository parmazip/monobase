import { createAuthClient } from "better-auth/react"
import { passkeyClient, twoFactorClient } from "better-auth/client/plugins"

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