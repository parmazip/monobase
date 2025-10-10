/**
 * Common SDK types used across the package
 */

// SDK-specific types
export interface SDKConfig {
  apiBaseUrl: string
}

export interface QueryOptions {
  enabled?: boolean
  refetchOnWindowFocus?: boolean
  refetchOnMount?: boolean
  staleTime?: number
}
