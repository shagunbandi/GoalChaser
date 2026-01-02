import { test as base, expect, Page } from '@playwright/test'
import { setupTestUserWithAuth } from '../helpers/firebase-test-helpers'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

export interface AuthFixtures {
  authenticatedPage: Page
}

async function waitForAuth(page: Page) {
  await Promise.race([
    page.waitForSelector('text=Create New Goal', { timeout: 10000 }),
    page.waitForSelector('[data-testid="user-avatar"]', { timeout: 10000 }),
    page.waitForSelector('text=Good morning', { timeout: 10000 }),
    page.waitForSelector('text=Good afternoon', { timeout: 10000 }),
    page.waitForSelector('text=Good evening', { timeout: 10000 }),
  ])
}

export async function signUpUser(page: Page, email: string, password: string, name?: string) {
  await page.goto(BASE_URL)
  await page.waitForLoadState('networkidle')
  await page.waitForSelector('input[type="email"]', { timeout: 10000 })

  const signUpLink = page.locator('text=Sign up')
  if (await signUpLink.isVisible().catch(() => false)) {
    await signUpLink.click()
    await page.waitForTimeout(500)
  }

  if (name) {
    const nameInput = page.locator('input[type="text"]').first()
    if (await nameInput.isVisible().catch(() => false)) {
      await nameInput.fill(name)
    }
  }

  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)
  await page.click('button[type="submit"]')

  await page.waitForTimeout(1000)
  await page.waitForLoadState('load')
  await page.waitForTimeout(2000)
  
  await waitForAuth(page)
}

export async function signInUser(page: Page, email: string, password: string) {
  await page.goto(BASE_URL)
  await page.waitForLoadState('networkidle')
  await page.waitForSelector('input[type="email"]', { timeout: 10000 })

  const signInLink = page.locator('text=Sign in')
  if (await signInLink.isVisible().catch(() => false)) {
    await signInLink.click()
    await page.waitForTimeout(500)
  }

  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)
  await page.click('button[type="submit"]')

  await page.waitForTimeout(1000)
  await page.waitForLoadState('load')
  await page.waitForTimeout(2000)
  
  await waitForAuth(page)
}

export async function signInUserWithAuth(
  page: Page,
  options?: { email?: string; password?: string; displayName?: string }
) {
  const { user, credentials } = await setupTestUserWithAuth(options)
  await signInUser(page, credentials.email, credentials.password)
  return { user, credentials }
}

export { expect }
