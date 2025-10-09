import { Page } from '@playwright/test'

export class OnboardingPage {
  constructor(private page: Page) {}

  async completePersonalInfo(data: {
    firstName: string
    lastName: string
    middleName?: string
    dateOfBirth: Date
    gender?: string
  }) {
    await this.page.getByRole('textbox', { name: 'First Name' }).fill(data.firstName)
    await this.page.getByRole('textbox', { name: 'Last Name' }).fill(data.lastName)
    
    if (data.middleName) {
      await this.page.getByRole('textbox', { name: 'Middle Name' }).fill(data.middleName)
    }

    // Date of birth
    await this.page.getByRole('button', { name: 'Date of Birth' }).click()
    await this.page.getByLabel('Choose the Year').selectOption(data.dateOfBirth.getFullYear().toString())
    await this.page.getByLabel('Choose the Month').selectOption(data.dateOfBirth.toLocaleString('en', { month: 'short' }))
    await this.page.getByRole('button', { name: data.dateOfBirth.getDate().toString() }).first().click()

    if (data.gender) {
      await this.page.getByRole('combobox', { name: 'Gender' }).click()
      // Use first() to select the first matching option since there might be duplicates
      await this.page.getByRole('option', { name: data.gender }).first().click()
    }

    await this.page.getByRole('button', { name: 'Next' }).click()
  }

  async completeContactInfo(phone: string) {
    await this.page.getByPlaceholder('Enter phone number').fill(phone)
    await this.page.getByRole('button', { name: 'Next' }).click()
  }

  async completeAddress(data: {
    street1: string
    street2?: string
    city: string
    state: string
    postalCode: string
    country: string
  }) {
    await this.page.getByPlaceholder('123 Main Street').fill(data.street1)
    
    if (data.street2) {
      await this.page.getByPlaceholder('Apartment, suite, unit, etc.').fill(data.street2)
    }

    await this.page.getByPlaceholder('San Francisco').fill(data.city)
    await this.page.getByPlaceholder('CA').fill(data.state)
    await this.page.getByPlaceholder('94102').fill(data.postalCode)
    
    await this.page.getByRole('button', { name: 'Complete Onboarding' }).click()
  }

  async skipOnboarding() {
    await this.page.getByRole('button', { name: 'Skip for now' }).click()
  }

  async waitForOnboardingComplete() {
    await this.page.waitForURL((url) => url.pathname.includes('/dashboard'), {
      timeout: 10000,
    })
  }
}