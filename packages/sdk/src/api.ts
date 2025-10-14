/**
 * API Error class for handling API errors consistently
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * Generic paginated response matching TypeSpec OffsetPaginatedResponse
 * Used for list endpoints that return data with pagination metadata
 */
export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    offset: number
    limit: number
    count: number
    totalCount: number
    totalPages: number
    currentPage: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

// Global API base URL - set by ApiProvider or manually
let globalApiBaseUrl = 'http://localhost:7213'

/**
 * Set the global API base URL
 */
export function setApiBaseUrl(url: string) {
  globalApiBaseUrl = url
}

/**
 * Get the current API base URL
 */
export function getApiBaseUrl(): string {
  return globalApiBaseUrl
}

/**
 * Simple fetch wrapper with authentication
 */
async function api<T = any>(
  url: string,
  options?: RequestInit
): Promise<T> {
  // Create AbortController for timeout handling
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30000) // 30s timeout

  try {
    // Make request with explicit credentials handling
    const response = await fetch(`${globalApiBaseUrl}${url}`, {
      ...options,
      credentials: 'include',  // This sends cookies which is managed by better-auth/client
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })

    clearTimeout(timeoutId)

    // Handle response
    if (!response.ok) {
      let errorData
      try {
        errorData = await response.json()
      } catch {
        errorData = { message: response.statusText }
      }

      throw new ApiError(
        response.status,
        errorData.message || `API Error: ${response.status}`,
        errorData
      )
    }

    // Handle no content responses
    if (response.status === 204) {
      return {} as T
    }

    // Parse JSON response
    try {
      return await response.json()
    } catch {
      return {} as T
    }
  } catch (error) {
    clearTimeout(timeoutId)
    
    // Handle timeout/abort errors
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError(
        408,
        'Request timeout - the server took too long to respond. Please check your connection and try again.',
        { timeout: true }
      )
    }
    
    // Re-throw other errors
    throw error
  }
}

/**
 * Convenience methods for common HTTP methods
 */
export const apiGet = <T = any>(url: string, params?: Record<string, any>) => {
  // Filter out undefined values to prevent URLSearchParams converting them to "undefined" strings
  const cleanParams = params
    ? Object.fromEntries(
        Object.entries(params).filter(([_, value]) => value !== undefined)
      )
    : undefined

  const queryString = cleanParams ? `?${new URLSearchParams(cleanParams).toString()}` : ''
  return api<T>(`${url}${queryString}`, { method: 'GET' })
}

export const apiPost = <T = any>(url: string, data?: any) =>
  api<T>(url, { method: 'POST', body: data ? JSON.stringify(data) : undefined })

export const apiPatch = <T = any>(url: string, data?: any) =>
  api<T>(url, { method: 'PATCH', body: data ? JSON.stringify(data) : undefined })

export const apiDelete = <T = any>(url: string) =>
  api<T>(url, { method: 'DELETE' })
