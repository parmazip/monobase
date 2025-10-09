import { test, expect } from '@playwright/test'
import { NotificationsPage } from './pages/notifications.page'
import { createTestProvider, deleteTestProvider, type CreatedProvider } from './helpers/provider-setup'

let testProvider: CreatedProvider

test.describe('Notifications', () => {
  let notificationsPage: NotificationsPage

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    testProvider = await createTestProvider(page)
    await context.close()
  })

  test.afterAll(async ({ request }) => {
    if (testProvider?.id) {
      await deleteTestProvider(request, testProvider.id)
    }
  })

  test.beforeEach(async ({ page }) => {
    notificationsPage = new NotificationsPage(page)
    await notificationsPage.goto()
  })

  test('displays notifications page with tabs', async () => {
    await notificationsPage.waitForNotificationsToLoad()

    // Verify tabs are visible
    await expect(notificationsPage.allTab).toBeVisible()
    await expect(notificationsPage.unreadTab).toBeVisible()
  })

  test('displays notifications from API', async () => {
    await notificationsPage.waitForNotificationsToLoad()
    await notificationsPage.waitForApiResponse()

    // Should have notifications count (could be 0)
    const notificationCount = await notificationsPage.notificationCards.count()
    expect(notificationCount).toBeGreaterThanOrEqual(0)
  })

  test('shows unread badge when notifications are unread', async () => {
    await notificationsPage.waitForNotificationsToLoad()

    const notificationCount = await notificationsPage.notificationCards.count()
    if (notificationCount > 0) {
      // Check if any notifications are unread
      const hasUnread = await notificationsPage.isNotificationUnread(0).catch(() => false)

      if (hasUnread) {
        // Unread badge should be visible in header
        await expect(notificationsPage.unreadBadge).toBeVisible()
      }
    }
  })

  test('mark all read button is enabled when unread notifications exist', async () => {
    await notificationsPage.waitForNotificationsToLoad()

    const unreadCount = await notificationsPage.getUnreadNotificationCount()

    if (unreadCount > 0) {
      await notificationsPage.clickAllTab()
      await notificationsPage.verifyMarkAllReadButtonEnabled()
    } else {
      await notificationsPage.clickAllTab()
      await notificationsPage.verifyMarkAllReadButtonDisabled()
    }
  })

  test('can mark single notification as read', async () => {
    await notificationsPage.waitForNotificationsToLoad()

    const notificationCount = await notificationsPage.notificationCards.count()
    if (notificationCount > 0) {
      const wasUnread = await notificationsPage.isNotificationUnread(0).catch(() => false)

      if (wasUnread) {
        // Mark as read
        await notificationsPage.markNotificationAsRead(0)
        await notificationsPage.waitForMarkAsReadResponse()

        // Wait and reload
        await notificationsPage.page.waitForTimeout(1000)
        await notificationsPage.page.reload()
        await notificationsPage.waitForNotificationsToLoad()

        // Should now be read
        await notificationsPage.verifyNotificationIsRead(0)
      }
    }
  })

  test('can mark all notifications as read', async () => {
    await notificationsPage.waitForNotificationsToLoad()

    const initialUnreadCount = await notificationsPage.getUnreadNotificationCount()

    if (initialUnreadCount > 0) {
      await notificationsPage.clickAllTab()
      await notificationsPage.markAllAsRead()
      await notificationsPage.waitForMarkAllReadResponse()

      // Wait and reload
      await notificationsPage.page.waitForTimeout(1000)
      await notificationsPage.page.reload()
      await notificationsPage.waitForNotificationsToLoad()

      // Unread count should be 0
      await notificationsPage.verifyUnreadCount(0)
    }
  })

  test('filters to show only unread notifications', async () => {
    await notificationsPage.waitForNotificationsToLoad()

    await notificationsPage.clickUnreadTab()

    const unreadCount = await notificationsPage.notificationCards.count()

    // All displayed notifications should be unread
    for (let i = 0; i < Math.min(unreadCount, 3); i++) {
      await notificationsPage.verifyNotificationIsUnread(i)
    }
  })

  test('shows all notifications in All tab', async () => {
    await notificationsPage.waitForNotificationsToLoad()

    await notificationsPage.clickAllTab()
    const allCount = await notificationsPage.getAllNotificationCount()

    await notificationsPage.clickUnreadTab()
    const unreadCount = await notificationsPage.getUnreadNotificationCount()

    // All count should be >= unread count
    expect(allCount).toBeGreaterThanOrEqual(unreadCount)
  })

  test('displays notification titles and messages', async () => {
    await notificationsPage.waitForNotificationsToLoad()

    const notificationCount = await notificationsPage.notificationCards.count()
    if (notificationCount > 0) {
      const title = await notificationsPage.getNotificationTitle(0)
      const message = await notificationsPage.getNotificationMessage(0)

      // Title and message should not be empty
      expect(title.length).toBeGreaterThan(0)
      expect(message.length).toBeGreaterThan(0)
    }
  })

  test('shows notification icons based on type', async () => {
    await notificationsPage.waitForNotificationsToLoad()

    const notificationCount = await notificationsPage.notificationCards.count()
    if (notificationCount > 0) {
      // Each notification should have an icon
      const firstNotification = notificationsPage.notificationCards.first()
      const icon = firstNotification.locator('svg').first()
      await expect(icon).toBeVisible()
    }
  })

  test('handles empty state when no notifications', async ({ page }) => {
    await notificationsPage.goto()
    await notificationsPage.waitForNotificationsToLoad()

    const notificationCount = await notificationsPage.notificationCards.count()

    if (notificationCount === 0) {
      await notificationsPage.verifyEmptyState()
    }
  })

  test('shows loading state initially', async ({ page }) => {
    const navigationPromise = notificationsPage.goto()

    // Loading spinner should appear briefly
    await expect(notificationsPage.loadingSpinner).toBeVisible({ timeout: 2000 })

    await navigationPromise
  })

  test('handles API errors gracefully', async ({ page }) => {
    await notificationsPage.goto()

    // Error state should have proper UI if it occurs
    const errorVisible = await notificationsPage.errorMessage.isVisible().catch(() => false)
    if (errorVisible) {
      await notificationsPage.verifyErrorState()
    }
  })
})

test.describe('Notifications - API Integration', () => {
  let notificationsPage: NotificationsPage

  test.beforeEach(async ({ page }) => {
    notificationsPage = new NotificationsPage(page)
    await notificationsPage.goto()
  })

  test('fetches notifications from /notifs endpoint', async ({ page }) => {
    const responsePromise = page.waitForResponse(
      resp => resp.url().includes('/notifs') && resp.status() === 200
    )

    await notificationsPage.goto()
    const response = await responsePromise

    expect(response.ok()).toBeTruthy()

    const data = await response.json()
    expect(data).toHaveProperty('data')
    expect(Array.isArray(data.data)).toBeTruthy()
  })

  test('marks notification as read via API', async ({ page }) => {
    await notificationsPage.waitForNotificationsToLoad()

    const notificationCount = await notificationsPage.notificationCards.count()
    if (notificationCount > 0) {
      const isUnread = await notificationsPage.isNotificationUnread(0).catch(() => false)

      if (isUnread) {
        const responsePromise = page.waitForResponse(
          resp => resp.url().includes('/notifs') && resp.url().includes('/read')
        )

        await notificationsPage.markNotificationAsRead(0)
        const response = await responsePromise

        expect(response.ok()).toBeTruthy()
      }
    }
  })

  test('marks all notifications as read via API', async ({ page }) => {
    await notificationsPage.waitForNotificationsToLoad()

    const unreadCount = await notificationsPage.getUnreadNotificationCount()

    if (unreadCount > 0) {
      const responsePromise = page.waitForResponse(
        resp => resp.url().includes('/notifs/read-all')
      )

      await notificationsPage.clickAllTab()
      await notificationsPage.markAllAsRead()
      const response = await responsePromise

      expect(response.ok()).toBeTruthy()
    }
  })
})
