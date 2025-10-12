// Create auth client instance
import { createAuth } from '@monobase/sdk/auth'
import { apiBaseUrl } from '@/utils/config'

export const authClient = createAuth({ baseURL: apiBaseUrl })
