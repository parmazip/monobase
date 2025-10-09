import { Page } from '@playwright/test'

export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/auth/sign-in')
  }

  async signIn(email: string, password: string) {
    await this.page.getByRole('textbox', { name: 'Email' }).fill(email)
    await this.page.getByRole('textbox', { name: 'Password' }).fill(password)
    await this.page.getByRole('button', { name: 'Login' }).click()
  }

  async signUp(name: string, email: string, password: string) {
    await this.page.goto('/auth/sign-up')
    await this.page.getByRole('textbox', { name: 'Name' }).fill(name)
    await this.page.getByRole('textbox', { name: 'Email' }).fill(email)
    await this.page.getByRole('textbox', { name: 'Password' }).fill(password)
    await this.page.getByRole('button', { name: 'Create an account' }).click()
  }

  async waitForAuthentication() {
    await this.page.waitForURL((url) => !url.pathname.includes('/auth'), {
      timeout: 10000,
    })
  }
}