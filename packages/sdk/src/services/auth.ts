/**
 * Auth Service - Extended auth types
 * Provides User and Session types for authentication context
 */

import type { User as BetterAuthUser, Session as BetterAuthSession } from 'better-auth'

/**
 * User roles in the platform
 */
export type UserRole = 'patient' | 'provider' | 'admin' | 'user' | 'client'

/**
 * Extended User type with role field
 */
export interface User extends BetterAuthUser {
  role?: string
}

/**
 * Extended session type
 */
export interface Session extends BetterAuthSession {
  user: User
}
