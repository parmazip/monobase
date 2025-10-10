import { apiBaseUrl } from '@/utils/config'

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
 * Simple fetch wrapper with authentication
 */
async function api<T = any>(
  url: string,
  options?: RequestInit
): Promise<T> {
  // Make request with explicit credentials handling
  const response = await fetch(`${apiBaseUrl}${url}`, {
    ...options,
    credentials: 'include',  // This sends cookies which is managed by better-auth/client
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

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
