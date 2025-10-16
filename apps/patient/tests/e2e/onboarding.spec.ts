import { test, expect } from '@playwright/test'

/**
 * Helper function to create a fresh test user via UI signup flow
 * Returns unique credentials that can only complete onboarding once
 */
async function signUpNewUser(page: any) {
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 10000)
  const email = `test-${timestamp}-${random}@example.com`
  const password = 'TestPass123!'
  const name = `TestUser ${timestamp}` // Include space for lastName split

  // Navigate to signup page
  await page.goto('/auth/sign-up')

  // Fill signup form
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)
  await page.fill('input[name="name"]', name)

  // Submit signup
  await page.click('button:has-text("Create an account")')

  // Wait for redirect (either to onboarding or email verification)
  await page.waitForURL((url: URL) => !url.pathname.includes('/auth/sign-up'), { timeout: 10000 })

  return { email, password, name }
}

/**
 * Helper to complete step 1 (personal info)
 */
async function completePersonalInfoStep(page: any, options?: { skipDateOfBirth?: boolean }) {
  if (!options?.skipDateOfBirth) {
    // Select a date of birth (pick a date in the past)
    await page.getByLabel(/date of birth/i).click()

    // Select year 1990
    await page.getByRole('combobox', { name: /choose the year/i }).selectOption('1990')

    // Select month January
    await page.getByRole('combobox', { name: /choose the month/i }).selectOption({ index: 0 })

    // Click day 15 (with specific year)
    await page.getByRole('button', { name: 'Monday, January 15th, 1990' }).click()
  }
  await page.click('button:has-text("Next")')
}

test.describe('Onboarding Flow', () => {
  test('completes onboarding with full address and redirects to dashboard', async ({ page }) => {
    // Create fresh user via signup flow
    const user = await signUpNewUser(page)

    // Should redirect to onboarding
    await expect(page).toHaveURL('/onboarding')

    // Step 1: Verify pre-filled name from signup
    const expectedFirstName = user.name.split(' ')[0]
    await expect(page.getByLabel(/first name/i)).toHaveValue(expectedFirstName)

    // Complete personal info step
    await completePersonalInfoStep(page)

    // Step 2: Should be on address step
    await expect(page.getByText(/Step 2 of 2/i)).toBeVisible()
    await expect(page.getByText(/Address \(Optional\)/i)).toBeVisible()

    // Verify detected country is pre-selected
    await expect(page.getByRole('combobox', { name: /country/i })).toContainText(/United States/i)

    // Fill address
    await page.fill('input[placeholder*="Main Street"]', '123 Test Street')
    await page.fill('input[placeholder*="San Francisco"]', 'Test City')
    await page.fill('input[placeholder*="CA"]', 'TS')
    await page.fill('input[placeholder*="94102"]', '12345')

    // Complete setup
    await page.click('button:has-text("Complete Setup")')

    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard', { timeout: 15000 })

    // Verify profile on dashboard (use full name as it appears on dashboard)
    await expect(page.getByRole('heading', { name: user.name })).toBeVisible()
  })

  test('completes onboarding by skipping address and redirects to dashboard', async ({ page }) => {
    const user = await signUpNewUser(page)

    // Should redirect to onboarding
    await expect(page).toHaveURL('/onboarding')

    // Step 1: Complete personal info
    await completePersonalInfoStep(page)

    // Step 2: Skip address
    await expect(page.getByText(/Step 2 of 2/i)).toBeVisible()

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle')

    // Click skip button and wait for navigation
    const skipButton = page.getByRole('button', { name: /skip for now/i })
    await expect(skipButton).toBeVisible()
    await skipButton.click()

    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard', { timeout: 15000 })

    // Verify on dashboard (use full name)
    await expect(page.getByRole('heading', { name: user.name })).toBeVisible()
  })

  // FIXME: This test is flaky due to session persistence issues with persistClient=false
  // The test works manually in browser but fails in Playwright
  // Issue: After completing onboarding and navigating to dashboard, a subsequent
  // page.goto('/onboarding') causes session to appear lost, even though cookies exist
  // Likely related to timing of React Query refetch and Router context updates
  test('redirects to dashboard if user already completed onboarding', async ({ page }) => {
    const user = await signUpNewUser(page)
    await expect(page).toHaveURL('/onboarding')

    // Complete onboarding quickly (skip address)
    await completePersonalInfoStep(page)
    await page.click('button:has-text("Skip for now")')

    // Wait for dashboard
    await expect(page).toHaveURL('/dashboard', { timeout: 15000 })

    // Ensure page is fully loaded with session and person data
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: user.name })).toBeVisible()

    // Give extra time for React Query and Router context to fully stabilize
    await page.waitForTimeout(1000)

    // Try to access onboarding again - should redirect since profile exists
    await page.goto('/onboarding')

    // Should redirect back to dashboard (already has profile)
    await expect(page).toHaveURL('/dashboard', { timeout: 15000 })
  })

  test('preserves form data when navigating back between steps', async ({ page }) => {
    const user = await signUpNewUser(page)
    await expect(page).toHaveURL('/onboarding')

    // Modify the pre-filled name
    const firstNameField = page.getByLabel(/first name/i)
    await firstNameField.clear()
    await firstNameField.fill('Modified')

    // Fill date of birth (use past date)
    await page.getByLabel(/date of birth/i).click()
    await page.getByRole('combobox', { name: /choose the year/i }).selectOption('1990')
    await page.getByRole('combobox', { name: /choose the month/i }).selectOption({ index: 0 })
    await page.getByRole('button', { name: 'Monday, January 15th, 1990' }).click()

    // Go to next step
    await page.click('button:has-text("Next")')
    await expect(page.getByText(/Step 2 of 2/i)).toBeVisible()

    // Go back
    await page.click('button:has-text("Back")')
    await expect(page.getByText(/Step 1 of 2/i)).toBeVisible()

    // Verify data preserved
    await expect(firstNameField).toHaveValue('Modified')
  })

  test('pre-fills firstName from auth user name', async ({ page }) => {
    const user = await signUpNewUser(page)
    await expect(page).toHaveURL('/onboarding')

    // Verify firstName is pre-filled with first part of name
    const expectedFirstName = user.name.split(' ')[0]
    await expect(page.getByLabel(/first name/i)).toHaveValue(expectedFirstName)

    // Verify lastName is pre-filled with rest of name
    const expectedLastName = user.name.split(' ').slice(1).join(' ')
    if (expectedLastName) {
      await expect(page.getByLabel(/last name/i)).toHaveValue(expectedLastName)
    }
  })

  test('validates required fields before allowing next step', async ({ page }) => {
    const user = await signUpNewUser(page)
    await expect(page).toHaveURL('/onboarding')

    // Clear required field
    await page.getByLabel(/first name/i).clear()

    // Try to proceed without filling required fields
    await page.click('button:has-text("Next")')

    // Should show validation error and stay on step 1
    await expect(page.getByText(/first name is required/i)).toBeVisible()
    await expect(page.getByText(/Step 1 of 2/i)).toBeVisible()
  })
})
