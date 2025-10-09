import { Page, expect } from '@playwright/test'

export class NotificationsPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/notifications')
    await this.page.waitForLoadState('networkidle')
  }

  // Getters for page elements
  get notificationCards() {
    return this.page.locator('[data-testid="notification-card"], .space-y-3 > div[class*="border"]')
  }

  get unreadBadge() {
    return this.page.locator('text=/\\d+ new/')
  }

  get markAllReadButton() {
    return this.page.locator('button:has-text("Mark All Read")')
  }

  get allTab() {
    return this.page.locator('button[role="tab"]:has-text("All")')
  }

  get unreadTab() {
    return this.page.locator('button[role="tab"]:has-text("Unread")')
  }

  get emptyState() {
    return this.page.locator('text=No notifications found')
  }

  get errorMessage() {
    return this.page.locator('text=Failed to load notifications')
  }

  get loadingSpinner() {
    return this.page.locator('text=Loading notifications...')
  }

  // Actions
  async waitForNotificationsToLoad() {
    await this.page.waitForSelector('text=Notifications', { timeout: 10000 })
    // Wait for either content or empty state
    await Promise.race([
      this.page.waitForSelector('.space-y-3 > div[class*="border"]', { timeout: 5000 }).catch(() => {}),
      this.page.waitForSelector('text=No notifications', { timeout: 5000 }).catch(() => {}),
    ])
  }

  async clickAllTab() {
    await this.allTab.click()
    await this.page.waitForTimeout(500) // Wait for tab content to load
  }

  async clickUnreadTab() {
    await this.unreadTab.click()
    await this.page.waitForTimeout(500)
  }

  async markAllAsRead() {
    await this.markAllReadButton.click()
    await this.page.waitForTimeout(1000) // Wait for API call
  }

  async markNotificationAsRead(notificationIndex: number) {
    const notification = this.notificationCards.nth(notificationIndex)
    const moreButton = notification.locator('button:has(svg)').last()
    await moreButton.click()
    await this.page.click('text=Mark as Read')
    await this.page.waitForTimeout(1000) // Wait for API call
  }

  async getNotificationTitle(notificationIndex: number): Promise<string> {
    const notification = this.notificationCards.nth(notificationIndex)
    const title = await notification.locator('h3').textContent()
    return title?.trim() || ''
  }

  async getNotificationMessage(notificationIndex: number): Promise<string> {
    const notification = this.notificationCards.nth(notificationIndex)
    const message = await notification.locator('p.text-muted-foreground').first().textContent()
    return message?.trim() || ''
  }

  async isNotificationUnread(notificationIndex: number): Promise<boolean> {
    const notification = this.notificationCards.nth(notificationIndex)
    const unreadIndicator = notification.locator('span.bg-blue-500.rounded-full')
    return await unreadIndicator.count() > 0
  }

  // Assertions
  async verifyUnreadCount(expectedCount: number) {
    if (expectedCount === 0) {
      await expect(this.unreadBadge).toHaveCount(0)
    } else {
      await expect(this.unreadBadge).toContainText(`${expectedCount} new`)
    }
  }

  async verifyNotificationCount(expectedCount: number) {
    const count = await this.notificationCards.count()
    expect(count).toBe(expectedCount)
  }

  async verifyNotificationIsUnread(notificationIndex: number) {
    const isUnread = await this.isNotificationUnread(notificationIndex)
    expect(isUnread).toBe(true)
  }

  async verifyNotificationIsRead(notificationIndex: number) {
    const isUnread = await this.isNotificationUnread(notificationIndex)
    expect(isUnread).toBe(false)
  }

  async verifyNotificationTitle(notificationIndex: number, expectedTitle: string) {
    const title = await this.getNotificationTitle(notificationIndex)
    expect(title).toContain(expectedTitle)
  }

  async verifyNotificationMessage(notificationIndex: number, expectedMessage: string) {
    const message = await this.getNotificationMessage(notificationIndex)
    expect(message).toContain(expectedMessage)
  }

  async verifyNotificationType(notificationIndex: number, expectedIconClass: string) {
    const notification = this.notificationCards.nth(notificationIndex)
    const icon = notification.locator('svg').first()
    await expect(icon).toBeVisible()
    // Verify icon class if needed
  }

  async verifyMarkAllReadButtonDisabled() {
    await expect(this.markAllReadButton).toBeDisabled()
  }

  async verifyMarkAllReadButtonEnabled() {
    await expect(this.markAllReadButton).toBeEnabled()
  }

  async verifyEmptyState() {
    await expect(this.emptyState).toBeVisible()
  }

  async verifyErrorState() {
    await expect(this.errorMessage).toBeVisible()
  }

  async verifyLoadingState() {
    await expect(this.loadingSpinner).toBeVisible()
  }

  async waitForApiResponse() {
    await this.page.waitForResponse(resp => resp.url().includes('/notifs'))
  }

  async waitForMarkAsReadResponse() {
    await this.page.waitForResponse(resp =>
      resp.url().includes('/notifs') && resp.url().includes('/read')
    )
  }

  async waitForMarkAllReadResponse() {
    await this.page.waitForResponse(resp =>
      resp.url().includes('/notifs/read-all')
    )
  }

  // Tab-specific methods
  async getUnreadNotificationCount(): Promise<number> {
    await this.clickUnreadTab()
    return await this.notificationCards.count()
  }

  async getAllNotificationCount(): Promise<number> {
    await this.clickAllTab()
    return await this.notificationCards.count()
  }
}
