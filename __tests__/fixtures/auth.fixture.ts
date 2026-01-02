import { Page } from '@playwright/test'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

async function waitForAuth(page: Page) {
  await Promise.race([
    page.waitForSelector('text=Create New Goal', { timeout: 10000 }),
    page.waitForSelector('[data-testid="user-avatar"]', { timeout: 10000 }),
    page.waitForSelector('text=Good morning', { timeout: 10000 }),
    page.waitForSelector('text=Good afternoon', { timeout: 10000 }),
    page.waitForSelector('text=Good evening', { timeout: 10000 }),
  ])
}

export interface SignUpOptions {
  email: string
  password: string
  name?: string
}

export interface SignInOptions {
  email: string
  password: string
}

/**
 * Signs up a new user via the UI.
 * This performs actual UI interactions: fills the form and clicks submit.
 */
export async function signUp(page: Page, options: SignUpOptions) {
  await page.goto(BASE_URL)
  await page.waitForLoadState('networkidle')
  await page.waitForSelector('input[type="email"]', { timeout: 10000 })

  const signUpLink = page.locator('text=Sign up')
  if (await signUpLink.isVisible().catch(() => false)) {
    await signUpLink.click()
    await page.waitForTimeout(500)
  }

  if (options.name) {
    const nameInput = page.locator('input[type="text"]').first()
    if (await nameInput.isVisible().catch(() => false)) {
      await nameInput.fill(options.name)
    }
  }

  await page.fill('input[type="email"]', options.email)
  await page.fill('input[type="password"]', options.password)
  await page.click('button[type="submit"]')

  await page.waitForTimeout(1000)
  await page.waitForLoadState('load')
  await page.waitForTimeout(2000)
  
  await waitForAuth(page)
}

/**
 * Signs in an existing user via the UI.
 * This performs actual UI interactions: fills the form and clicks submit.
 */
export async function signIn(page: Page, options: SignInOptions) {
  await page.goto(BASE_URL)
  await page.waitForLoadState('networkidle')
  await page.waitForSelector('input[type="email"]', { timeout: 10000 })

  const signInLink = page.locator('text=Sign in')
  if (await signInLink.isVisible().catch(() => false)) {
    await signInLink.click()
    await page.waitForTimeout(500)
  }

  await page.fill('input[type="email"]', options.email)
  await page.fill('input[type="password"]', options.password)
  await page.click('button[type="submit"]')

  await page.waitForTimeout(1000)
  await page.waitForLoadState('load')
  await page.waitForTimeout(2000)
  
  await waitForAuth(page)
}
