import { Page, expect } from '@playwright/test'

export class DashboardPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/dashboard')
    await this.page.waitForLoadState('networkidle')
  }

  // Getters for page elements
  get todaysAppointmentsCard() {
    return this.page.locator('text=Today\'s Appointments').locator('..')
  }

  get activePatientsCard() {
    return this.page.locator('text=Active Patients').locator('..')
  }

  get pendingConsultationsCard() {
    return this.page.locator('text=Pending Consultations').locator('..')
  }

  get welcomeMessage() {
    return this.page.locator('h1:has-text("Welcome")')
  }

  get loadingSpinner() {
    return this.page.locator('text=Loading dashboard...')
  }

  // Actions
  async waitForDashboardToLoad() {
    await this.page.waitForSelector('h1:has-text("Welcome")', { timeout: 10000 })
    // Wait for stats cards to load
    await Promise.race([
      this.page.waitForSelector('text=Today\'s Appointments', { timeout: 5000 }),
      this.page.waitForSelector('text=Loading dashboard', { timeout: 5000 }),
    ])
  }

  async navigateToAppointments() {
    await this.page.click('text=Appointments, a[href="/appointments"]')
  }

  async navigateToPatients() {
    await this.page.click('text=Patients, a[href="/patients"]')
  }

  async navigateToConsultations() {
    await this.page.click('text=Consultations, a[href="/consultations"]')
  }

  // Assertions
  async verifyWelcomeMessage(providerName: string) {
    await expect(this.welcomeMessage).toContainText(providerName)
  }

  async verifyTodaysAppointments(expectedCount: number) {
    const countText = await this.todaysAppointmentsCard.locator('.text-2xl').textContent()
    expect(countText?.trim()).toBe(expectedCount.toString())
  }

  async verifyActivePatients(expectedCount: number) {
    const countText = await this.activePatientsCard.locator('.text-2xl').textContent()
    expect(countText?.trim()).toBe(expectedCount.toString())
  }

  async verifyPendingConsultations(expectedCount: number) {
    const countText = await this.pendingConsultationsCard.locator('.text-2xl').textContent()
    expect(countText?.trim()).toBe(expectedCount.toString())
  }

  async verifyLoadingState() {
    await expect(this.loadingSpinner).toBeVisible()
  }

  async verifyDashboardLoaded() {
    await expect(this.welcomeMessage).toBeVisible()
    await expect(this.todaysAppointmentsCard).toBeVisible()
    await expect(this.activePatientsCard).toBeVisible()
    await expect(this.pendingConsultationsCard).toBeVisible()
  }

  async waitForApiResponses() {
    await Promise.all([
      this.page.waitForResponse(resp => resp.url().includes('/booking/appointments')),
      this.page.waitForResponse(resp => resp.url().includes('/patients')),
      this.page.waitForResponse(resp => resp.url().includes('/consults')),
    ])
  }
}
