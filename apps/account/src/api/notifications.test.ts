import { describe, test, expect } from 'bun:test'
import {
  isNotificationUnread,
  getNotificationIconType,
  formatNotificationTime,
  type Notification,
  type NotificationType,
} from './notifications'

describe('notifications utility functions', () => {
  describe('isNotificationUnread', () => {
    const baseNotification: Notification = {
      id: '1',
      recipient: 'user-1',
      type: 'system',
      channel: 'in-app',
      title: 'Test Notification',
      message: 'Test message',
      status: 'delivered',
      consentValidated: true,
      createdAt: '2024-01-01T10:00:00Z',
      updatedAt: '2024-01-01T10:00:00Z',
    }

    test('returns true when readAt is undefined and status is not read', () => {
      const notification: Notification = {
        ...baseNotification,
        readAt: undefined,
        status: 'delivered',
      }
      expect(isNotificationUnread(notification)).toBe(true)
    })

    test('returns false when readAt is set', () => {
      const notification: Notification = {
        ...baseNotification,
        readAt: '2024-01-01T11:00:00Z',
        status: 'read',
      }
      expect(isNotificationUnread(notification)).toBe(false)
    })

    test('returns false when status is read', () => {
      const notification: Notification = {
        ...baseNotification,
        readAt: undefined,
        status: 'read',
      }
      expect(isNotificationUnread(notification)).toBe(false)
    })

    test('returns false when readAt is set even if status is not read', () => {
      const notification: Notification = {
        ...baseNotification,
        readAt: '2024-01-01T11:00:00Z',
        status: 'delivered',
      }
      expect(isNotificationUnread(notification)).toBe(false)
    })

    test('handles various unread statuses correctly', () => {
      const statuses = ['queued', 'sent', 'delivered', 'failed'] as const
      statuses.forEach(status => {
        const notification: Notification = {
          ...baseNotification,
          readAt: undefined,
          status,
        }
        expect(isNotificationUnread(notification)).toBe(true)
      })
    })
  })

  describe('getNotificationIconType', () => {
    const baseNotification: Notification = {
      id: '1',
      recipient: 'user-1',
      type: 'system',
      channel: 'in-app',
      title: 'Test',
      message: 'Test',
      status: 'delivered',
      consentValidated: true,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    }

    test('returns calendar for appointment-reminder', () => {
      const notification: Notification = {
        ...baseNotification,
        type: 'appointment-reminder',
      }
      expect(getNotificationIconType(notification)).toBe('calendar')
    })

    test('returns credit-card for billing', () => {
      const notification: Notification = {
        ...baseNotification,
        type: 'billing',
      }
      expect(getNotificationIconType(notification)).toBe('credit-card')
    })

    test('returns shield for security', () => {
      const notification: Notification = {
        ...baseNotification,
        type: 'security',
      }
      expect(getNotificationIconType(notification)).toBe('shield')
    })

    test('returns bell for system', () => {
      const notification: Notification = {
        ...baseNotification,
        type: 'system',
      }
      expect(getNotificationIconType(notification)).toBe('bell')
    })

    test('returns bell as default for unknown type', () => {
      const notification = {
        ...baseNotification,
        type: 'unknown-type' as NotificationType,
      }
      expect(getNotificationIconType(notification)).toBe('bell')
    })
  })

  describe('formatNotificationTime', () => {
    // Helper to create timestamps relative to now
    const getTimestampMinutesAgo = (minutes: number): string => {
      const date = new Date()
      date.setMinutes(date.getMinutes() - minutes)
      return date.toISOString()
    }

    const getTimestampHoursAgo = (hours: number): string => {
      const date = new Date()
      date.setHours(date.getHours() - hours)
      return date.toISOString()
    }

    const getTimestampDaysAgo = (days: number): string => {
      const date = new Date()
      date.setDate(date.getDate() - days)
      return date.toISOString()
    }

    test('returns "Just now" for timestamps less than 1 minute ago', () => {
      const timestamp = getTimestampMinutesAgo(0)
      expect(formatNotificationTime(timestamp)).toBe('Just now')
    })

    test('returns "Just now" for timestamps exactly 1 minute ago', () => {
      const timestamp = getTimestampMinutesAgo(1)
      expect(formatNotificationTime(timestamp)).toBe('Just now')
    })

    test('returns minutes ago for timestamps between 2-59 minutes', () => {
      const timestamp2min = getTimestampMinutesAgo(2)
      expect(formatNotificationTime(timestamp2min)).toBe('2 minutes ago')

      const timestamp30min = getTimestampMinutesAgo(30)
      expect(formatNotificationTime(timestamp30min)).toBe('30 minutes ago')

      const timestamp59min = getTimestampMinutesAgo(59)
      expect(formatNotificationTime(timestamp59min)).toBe('59 minutes ago')
    })

    test('returns hours ago for timestamps between 1-23 hours', () => {
      const timestamp1hour = getTimestampHoursAgo(1)
      const result1 = formatNotificationTime(timestamp1hour)
      expect(result1).toMatch(/1 hours? ago/)

      const timestamp12hours = getTimestampHoursAgo(12)
      expect(formatNotificationTime(timestamp12hours)).toBe('12 hours ago')

      const timestamp23hours = getTimestampHoursAgo(23)
      expect(formatNotificationTime(timestamp23hours)).toBe('23 hours ago')
    })

    test('returns days ago for timestamps 24+ hours old', () => {
      const timestamp1day = getTimestampDaysAgo(1)
      expect(formatNotificationTime(timestamp1day)).toBe('1 days ago')

      const timestamp7days = getTimestampDaysAgo(7)
      expect(formatNotificationTime(timestamp7days)).toBe('7 days ago')

      const timestamp30days = getTimestampDaysAgo(30)
      expect(formatNotificationTime(timestamp30days)).toBe('30 days ago')
    })

    test('handles edge case at exactly 1 hour', () => {
      const timestamp = getTimestampMinutesAgo(60)
      const result = formatNotificationTime(timestamp)
      expect(result).toMatch(/1 hours? ago/)
    })

    test('handles edge case at exactly 24 hours', () => {
      const timestamp = getTimestampHoursAgo(24)
      const result = formatNotificationTime(timestamp)
      expect(result).toBe('1 days ago')
    })

    test('handles future timestamps gracefully', () => {
      const futureDate = new Date()
      futureDate.setMinutes(futureDate.getMinutes() + 10)
      const result = formatNotificationTime(futureDate.toISOString())
      // Should handle as "Just now" or similar (negative diff)
      expect(result).toBeDefined()
    })
  })
})
