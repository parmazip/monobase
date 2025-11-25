/**
 * Application Configuration
 * Reads environment variables and provides typed configuration
 */

// API Base URL - Build-time fallback values
export const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:7213'

// OneSignal Configuration
export const oneSignalAppId = import.meta.env.VITE_ONESIGNAL_APP_ID || ''
export const oneSignalAppTag = import.meta.env.VITE_ONESIGNAL_APP_TAG || 'provider'

// Environment
export const isDevelopment = import.meta.env.DEV
export const isProduction = import.meta.env.PROD

/**
 * Get runtime configuration with fallbacks to build-time env vars
 * This is the recommended way to get config values in production
 */
export async function getRuntimeConfig() {
  const { fetchRuntimeConfig } = await import('./runtime-config')
  const runtimeConfig = await fetchRuntimeConfig(2000)
  
  return {
    apiUrl: runtimeConfig.apiUrl || apiBaseUrl,
    onesignalAppId: runtimeConfig.onesignalAppId || oneSignalAppId
  }
}
