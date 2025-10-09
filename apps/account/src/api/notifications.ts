import { apiGet, apiPost, ApiError } from '@/api/client'
import { differenceInMinutes, differenceInHours, differenceInDays } from 'date-fns'

// ============================================================================
// Types (from OpenAPI spec)
// ============================================================================

/**
 * Notification type enum
 */
export type NotificationType =
  | 'appointment-reminder'
  | 'billing'
  | 'security'
  | 'system'

/**
 * Notification delivery channel
 */
export type NotificationChannel =
  | 'email'
  | 'push'
  | 'in-app'

/**
 * Notification delivery status
 */
export type NotificationStatus =
  | 'queued'
  | 'sent'
  | 'delivered'
  | 'read'
  | 'failed'
  | 'expired'
  | 'unread' // Filter alias: maps to sent or delivered

/**
 * System notification
 * From OpenAPI spec: components.schemas.Notification
 */
export interface Notification {
  id: string
  recipient: string // UUID
  type: NotificationType
  channel: NotificationChannel
  title: string
  message: string
  scheduledAt?: string
  relatedEntityType?: string
  relatedEntity?: string // UUID
  status: NotificationStatus
  sentAt?: string
  readAt?: string
  consentValidated: boolean
  createdAt: string
  updatedAt: string
}

/**
 * Paginated response for notifications
 */
export interface NotificationsListResponse {
  data: Notification[]
  pagination: {
    offset: number
    limit: number
    total: number
  }
}

/**
 * Parameters for listing notifications
 */
export interface ListNotificationsParams {
  type?: NotificationType
  channel?: NotificationChannel
  status?: NotificationStatus
  startDate?: string
  endDate?: string
  offset?: number
  limit?: number
  page?: number
  pageSize?: number
  search?: string
  sort?: string
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * List notifications
 * GET /notifs
 *
 * OpenAPI Spec: paths["/notifs"].get
 *
 * @param params - Optional filter and pagination parameters
 * @returns Paginated list of notifications
 */
export async function listNotifications(
  params?: ListNotificationsParams
): Promise<NotificationsListResponse> {
  return apiGet<NotificationsListResponse>('/notifs', params)
}

/**
 * Get single notification by ID
 * GET /notifs/{notif}
 *
 * OpenAPI Spec: paths["/notifs/{notif}"].get
 *
 * @param notificationId - Notification UUID
 * @returns Notification data
 */
export async function getNotification(
  notificationId: string
): Promise<Notification> {
  return apiGet<Notification>(`/notifs/${notificationId}`)
}

/**
 * Mark notification as read
 * POST /notifs/{notif}/read
 *
 * OpenAPI Spec: paths["/notifs/{notif}/read"].post
 *
 * @param notificationId - Notification UUID
 * @returns Updated notification data
 */
export async function markNotificationAsRead(
  notificationId: string
): Promise<Notification> {
  return apiPost<Notification>(`/notifs/${notificationId}/read`, {})
}

/**
 * Mark all notifications as read
 * POST /notifs/read-all
 *
 * OpenAPI Spec: paths["/notifs/read-all"].post
 *
 * @returns Response with count of marked notifications
 */
export async function markAllNotificationsAsRead(): Promise<{ markedCount: number }> {
  return apiPost<{ markedCount: number }>('/notifs/read-all', {})
}

/**
 * Helper function to check if notification is unread
 *
 * @param notification - Notification object
 * @returns True if notification is unread
 */
export function isNotificationUnread(notification: Notification): boolean {
  return !notification.readAt && notification.status !== 'read'
}

/**
 * Helper function to get notification display icon name
 *
 * @param notification - Notification object
 * @returns Icon name for UI display
 */
export function getNotificationIconType(notification: Notification): string {
  switch (notification.type) {
    case 'appointment-reminder':
      return 'calendar'
    case 'billing':
      return 'credit-card'
    case 'security':
      return 'shield'
    case 'system':
      return 'bell'
    default:
      return 'bell'
  }
}

/**
 * Helper function to format notification timestamp
 *
 * @param timestamp - ISO timestamp string
 * @returns Human-readable time string
 */
export function formatNotificationTime(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  
  const minutes = differenceInMinutes(now, date)
  const hours = differenceInHours(now, date)
  const days = differenceInDays(now, date)

  if (hours < 1) {
    return minutes <= 1 ? 'Just now' : `${minutes} minutes ago`
  } else if (hours < 24) {
    return `${hours} hours ago`
  } else {
    return `${days} days ago`
  }
}
