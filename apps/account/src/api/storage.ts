import { apiPost, apiGet } from '@/api/client'

// ============================================================================
// Types
// ============================================================================

export interface FileUploadRequest {
  filename: string
  size: number
  mimeType: string
}

export interface FileUploadResponse {
  file: string // UUID
  uploadUrl: string // Presigned URL
  uploadMethod: 'PUT'
  expiresAt: string // ISO timestamp
}

export interface StoredFile {
  id: string
  filename: string
  mimeType: string
  size: number
  status: 'pending' | 'uploaded' | 'failed'
  owner: string
  uploadedAt: string
  createdAt: string
  updatedAt: string
}

export interface FileDownloadResponse {
  downloadUrl: string
  expiresAt: string
  file: StoredFile
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Request a presigned URL for file upload
 */
export async function requestFileUpload(request: FileUploadRequest): Promise<FileUploadResponse> {
  return apiPost<FileUploadResponse>('/storage/files/upload', request)
}

/**
 * Upload file to presigned URL
 */
export async function uploadToPresignedUrl(url: string, file: File): Promise<void> {
  const response = await fetch(url, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type,
    },
  })

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`)
  }
}

/**
 * Complete the file upload process
 */
export async function completeFileUpload(fileId: string): Promise<StoredFile> {
  return apiPost<StoredFile>(`/storage/files/${fileId}/complete`, {})
}

/**
 * Get file download URL
 */
export async function getFileDownload(fileId: string): Promise<FileDownloadResponse> {
  return apiGet<FileDownloadResponse>(`/storage/files/${fileId}/download`)
}
