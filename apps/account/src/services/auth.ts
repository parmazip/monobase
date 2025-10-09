import { apiBaseUrl } from '@/utils/config'
import { createAuthClient } from "better-auth/react"
import { passkeyClient } from "better-auth/client/plugins"
import { twoFactorClient } from "better-auth/client/plugins"

// Create auth client
export const authClient = createAuthClient({
  baseURL: `${apiBaseUrl}/auth`,
  plugins: [
    passkeyClient(),
    twoFactorClient(),
  ],
})