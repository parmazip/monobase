/**
 * SDK Configuration utilities
 */

export interface MonobaseSDKConfig {
  apiBaseUrl: string
  queryClientConfig?: {
    staleTime?: number
    gcTime?: number
    retry?: number | boolean
    retryDelay?: (attemptIndex: number) => number
    refetchOnWindowFocus?: boolean
    refetchOnReconnect?: boolean
  }
}
