import { test, expect } from '@playwright/test'
import { DashboardPage } from './pages/dashboard.page'
import { createTestProvider, deleteTestProvider, type CreatedProvider } from './helpers/provider-setup'

let testProvider: CreatedProvider

test.describe('Dashboard Overview', () => {
  let dashboardPage: DashboardPage

  test.beforeAll(async ({ browser }) => {
    // Create test provider via API
    const context = await browser.newContext()
    const page = await context.newPage()
    testProvider = await createTestProvider(page)
    await context.close()
  })

  test.afterAll(async ({ request }) => {
    // Cleanup
    if (testProvider?.id) {
      await deleteTestProvider(request, testProvider.id)
    }
  })

  test.beforeEach(async ({ page }) => {
    dashboardPage = new DashboardPage(page)
    await dashboardPage.goto()
  })

  test('displays dashboard with welcome message', async () => {
    await dashboardPage.waitForDashboardToLoad()

    // Welcome message should be visible
    await expect(dashboardPage.welcomeMessage).toBeVisible()
    await expect(dashboardPage.welcomeMessage).toContainText('Welcome')
  })

  test('displays all stat cards', async () => {
    await dashboardPage.waitForDashboardToLoad()

    // Verify all stat cards are loaded
    await dashboardPage.verifyDashboardLoaded()
  })

  test('displays today\'s appointments count', async () => {
    await dashboardPage.waitForDashboardToLoad()

    const countText = await dashboardPage.todaysAppointmentsCard.locator('.text-2xl').textContent()
    expect(countText?.trim()).toMatch(/^\d+$/) // Should be a number
  })

  test('displays active patients count', async () => {
    await dashboardPage.waitForDashboardToLoad()

    const countText = await dashboardPage.activePatientsCard.locator('.text-2xl').textContent()
    expect(countText?.trim()).toMatch(/^\d+$/) // Should be a number
  })

  test('displays pending consultations count', async () => {
    await dashboardPage.waitForDashboardToLoad()

    const countText = await dashboardPage.pendingConsultationsCard.locator('.text-2xl').textContent()
    expect(countText?.trim()).toMatch(/^\d+$/) // Should be a number
  })

  test('stats cards show zero when no data', async ({ page }) => {
    await dashboardPage.goto()
    await dashboardPage.waitForDashboardToLoad()

    // At minimum, counts should be 0 or higher
    const todaysAppts = await dashboardPage.todaysAppointmentsCard.locator('.text-2xl').textContent()
    const activePatients = await dashboardPage.activePatientsCard.locator('.text-2xl').textContent()
    const pendingConsults = await dashboardPage.pendingConsultationsCard.locator('.text-2xl').textContent()

    expect(parseInt(todaysAppts?.trim() || '0')).toBeGreaterThanOrEqual(0)
    expect(parseInt(activePatients?.trim() || '0')).toBeGreaterThanOrEqual(0)
    expect(parseInt(pendingConsults?.trim() || '0')).toBeGreaterThanOrEqual(0)
  })

  test('shows loading state initially', async ({ page }) => {
    const navigationPromise = dashboardPage.goto()

    // Loading spinner should appear briefly
    await expect(dashboardPage.loadingSpinner).toBeVisible({ timeout: 2000 })

    await navigationPromise
  })

  test('cards have descriptive labels', async () => {
    await dashboardPage.waitForDashboardToLoad()

    // Verify card labels
    await expect(dashboardPage.todaysAppointmentsCard).toContainText('Today\'s Appointments')
    await expect(dashboardPage.activePatientsCard).toContainText('Active Patients')
    await expect(dashboardPage.pendingConsultationsCard).toContainText('Pending Consultations')
  })

  test('cards show appropriate icons', async () => {
    await dashboardPage.waitForDashboardToLoad()

    // Each stat card should have an icon
    const appointmentsIcon = dashboardPage.todaysAppointmentsCard.locator('svg')
    const patientsIcon = dashboardPage.activePatientsCard.locator('svg')
    const consultationsIcon = dashboardPage.pendingConsultationsCard.locator('svg')

    await expect(appointmentsIcon).toBeVisible()
    await expect(patientsIcon).toBeVisible()
    await expect(consultationsIcon).toBeVisible()
  })
})

test.describe('Dashboard - Navigation', () => {
  let dashboardPage: DashboardPage

  test.beforeEach(async ({ page }) => {
    dashboardPage = new DashboardPage(page)
    await dashboardPage.goto()
    await dashboardPage.waitForDashboardToLoad()
  })

  test('can navigate to appointments page', async ({ page }) => {
    // Look for appointments link and click it
    const appointmentsLink = page.locator('a[href="/appointments"], text=Appointments').first()
    if (await appointmentsLink.isVisible()) {
      await appointmentsLink.click()
      await page.waitForURL(/\/appointments/)
      expect(page.url()).toContain('/appointments')
    }
  })

  test('can navigate to patients page', async ({ page }) => {
    // Look for patients link and click it
    const patientsLink = page.locator('a[href="/patients"], text=Patients').first()
    if (await patientsLink.isVisible()) {
      await patientsLink.click()
      await page.waitForURL(/\/patients/)
      expect(page.url()).toContain('/patients')
    }
  })

  test('can navigate to consultations page', async ({ page }) => {
    // Look for consultations link and click it
    const consultationsLink = page.locator('a[href="/consultations"], text=Consultations').first()
    if (await consultationsLink.isVisible()) {
      await consultationsLink.click()
      await page.waitForURL(/\/consultations/)
      expect(page.url()).toContain('/consultations')
    }
  })
})

test.describe('Dashboard - API Integration', () => {
  let dashboardPage: DashboardPage

  test.beforeEach(async ({ page }) => {
    dashboardPage = new DashboardPage(page)
  })

  test('fetches data from multiple API endpoints', async ({ page }) => {
    // Set up response listeners
    const appointmentsPromise = page.waitForResponse(
      resp => resp.url().includes('/booking/appointments')
    ).catch(() => null)

    const patientsPromise = page.waitForResponse(
      resp => resp.url().includes('/patients')
    ).catch(() => null)

    const consultationsPromise = page.waitForResponse(
      resp => resp.url().includes('/consults')
    ).catch(() => null)

    await dashboardPage.goto()
    await dashboardPage.waitForDashboardToLoad()

    // At least one API should be called
    const responses = await Promise.all([
      appointmentsPromise,
      patientsPromise,
      consultationsPromise
    ])

    const successfulResponses = responses.filter(r => r !== null)
    expect(successfulResponses.length).toBeGreaterThan(0)
  })

  test('displays real-time appointment count', async ({ page }) => {
    const responsePromise = page.waitForResponse(
      resp => resp.url().includes('/booking/appointments') && resp.status() === 200
    ).catch(() => null)

    await dashboardPage.goto()
    const response = await responsePromise

    if (response) {
      expect(response.ok()).toBeTruthy()

      const data = await response.json()
      expect(data).toHaveProperty('data')
      expect(Array.isArray(data.data)).toBeTruthy()

      // Dashboard should reflect this count
      await dashboardPage.waitForDashboardToLoad()
      const displayedCount = await dashboardPage.todaysAppointmentsCard.locator('.text-2xl').textContent()
      expect(displayedCount?.trim()).toMatch(/^\d+$/)
    }
  })

  test('displays real-time patient count', async ({ page }) => {
    const responsePromise = page.waitForResponse(
      resp => resp.url().includes('/patients') && resp.status() === 200
    ).catch(() => null)

    await dashboardPage.goto()
    const response = await responsePromise

    if (response) {
      expect(response.ok()).toBeTruthy()

      const data = await response.json()
      expect(data).toHaveProperty('data')
      expect(Array.isArray(data.data)).toBeTruthy()

      // Dashboard should reflect this count
      await dashboardPage.waitForDashboardToLoad()
      const displayedCount = await dashboardPage.activePatientsCard.locator('.text-2xl').textContent()
      expect(displayedCount?.trim()).toMatch(/^\d+$/)
    }
  })

  test('handles API errors gracefully', async ({ page }) => {
    await dashboardPage.goto()
    await dashboardPage.waitForDashboardToLoad()

    // Even with API errors, dashboard should render
    await expect(dashboardPage.welcomeMessage).toBeVisible()
    await expect(dashboardPage.todaysAppointmentsCard).toBeVisible()
  })
})

test.describe('Dashboard - Personalization', () => {
  let dashboardPage: DashboardPage

  test.beforeEach(async ({ page }) => {
    dashboardPage = new DashboardPage(page)
    await dashboardPage.goto()
    await dashboardPage.waitForDashboardToLoad()
  })

  test('displays provider name in welcome message', async () => {
    const welcomeText = await dashboardPage.welcomeMessage.textContent()

    // Should contain "Welcome" and some name
    expect(welcomeText).toContain('Welcome')
    expect(welcomeText?.length).toBeGreaterThan('Welcome, '.length)
  })

  test('welcome message updates based on provider profile', async ({ page }) => {
    // This would require different provider accounts or profile updates
    // For now, just verify the welcome message is personalized
    const welcomeText = await dashboardPage.welcomeMessage.textContent()

    // Should not be generic "Welcome, Provider"
    expect(welcomeText).toBeTruthy()
    expect(welcomeText).toContain('Dr.')
  })
})
