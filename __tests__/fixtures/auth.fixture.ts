/**
 * Playwright fixture for authentication testing with Firebase emulator
 */

import { test as base, expect, Page } from '@playwright/test'

// Test configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

export interface AuthFixtures {
  authenticatedPage: Page
}

/**
 * Helper function to sign up a new user
 */
export async function signUpUser(
  page: Page,
  email: string,
  password: string,
  name?: string
) {
  await page.goto(BASE_URL)
  await page.waitForLoadState('networkidle')

  // Wait for the auth form to be visible
  await page.waitForSelector('input[type="email"]', { timeout: 10000 })

  // Check if we need to switch to signup mode
  const signUpLink = page.locator('text=Sign up')
  const isSignUpLinkVisible = await signUpLink
    .isVisible()
    .catch(() => false)
  
  if (isSignUpLinkVisible) {
    await signUpLink.click()
    await page.waitForTimeout(500)
  }

  // Fill in the signup form
  if (name) {
    const nameInput = page.locator('input[type="text"]').first()
    if (await nameInput.isVisible().catch(() => false)) {
      await nameInput.fill(name)
    }
  }

  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)

  // Click the sign up button
  const submitButton = page.locator('button[type="submit"]')
  await submitButton.click()

  // Wait for the submission to complete and page to start loading
  await page.waitForTimeout(1000)
  
  // Wait for navigation/loading to complete
  await page.waitForLoadState('load')
  await page.waitForLoadState('domcontentloaded')
  
  // Give auth state time to propagate (Firebase auth is async)
  await page.waitForTimeout(3000)
  
  // Verify we're signed in by checking for user-specific content
  // Try multiple possible indicators
  const isAuthenticated = await Promise.race([
    page.waitForSelector('text=Create New Goal', { timeout: 10000 }).then(() => true),
    page.waitForSelector('[data-testid="user-avatar"]', { timeout: 10000 }).then(() => true),
    page.waitForSelector('text=Good morning', { timeout: 10000 }).then(() => true),
    page.waitForSelector('text=Good afternoon', { timeout: 10000 }).then(() => true),
    page.waitForSelector('text=Good evening', { timeout: 10000 }).then(() => true),
  ]).catch(async () => {
    // Debug: print page content and check for loading state
    const bodyText = await page.locator('body').textContent()
    console.log('Page content after sign up:', bodyText?.substring(0, 800))
    const isLoading = bodyText?.includes('Loading')
    console.log('Is still loading?', isLoading)
    return false
  })
  
  if (!isAuthenticated) {
    throw new Error('Failed to detect authenticated state after sign up')
  }
}

/**
 * Helper function to sign in an existing user
 */
export async function signInUser(
  page: Page,
  email: string,
  password: string
) {
  await page.goto(BASE_URL)
  await page.waitForLoadState('networkidle')

  // Wait for the auth form to be visible
  await page.waitForSelector('input[type="email"]', { timeout: 10000 })

  // Make sure we're in sign-in mode (not sign-up)
  const signInLink = page.locator('text=Sign in')
  const isSignInLinkVisible = await signInLink
    .isVisible()
    .catch(() => false)
  
  if (isSignInLinkVisible) {
    await signInLink.click()
    await page.waitForTimeout(500)
  }

  // Fill in the signin form
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)

  // Click the sign in button
  const submitButton = page.locator('button[type="submit"]')
  await submitButton.click()

  // Wait for the submission to complete
  await page.waitForTimeout(1000)
  
  // Wait for navigation/loading to complete
  await page.waitForLoadState('load')
  await page.waitForLoadState('domcontentloaded')
  
  // Give auth state time to propagate
  await page.waitForTimeout(3000)
  
  // Verify we're signed in
  const isAuthenticated = await Promise.race([
    page.waitForSelector('text=Create New Goal', { timeout: 10000 }).then(() => true),
    page.waitForSelector('[data-testid="user-avatar"]', { timeout: 10000 }).then(() => true),
    page.waitForSelector('text=Good morning', { timeout: 10000 }).then(() => true),
    page.waitForSelector('text=Good afternoon', { timeout: 10000 }).then(() => true),
    page.waitForSelector('text=Good evening', { timeout: 10000 }).then(() => true),
  ]).catch(async () => {
    // Debug: print page content
    const bodyText = await page.locator('body').textContent()
    console.log('Page content after sign in:', bodyText?.substring(0, 800))
    return false
  })
  
  if (!isAuthenticated) {
    throw new Error('Failed to detect authenticated state after sign in')
  }
}

/**
 * Helper function to sign out
 */
export async function signOut(page: Page) {
  // Look for user avatar or menu
  const userAvatar = page.locator('[data-testid="user-avatar"]').first()
  
  if (await userAvatar.isVisible().catch(() => false)) {
    await userAvatar.click()
    await page.waitForTimeout(500)
    
    // Click sign out in the menu
    await page.click('text=Sign out')
    await page.waitForLoadState('networkidle')
  } else {
    // Alternative: look for a sign out button directly
    const signOutButton = page.locator('button:has-text("Sign out")')
    if (await signOutButton.isVisible().catch(() => false)) {
      await signOutButton.click()
      await page.waitForLoadState('networkidle')
    }
  }
  
  // Verify we're signed out by checking for sign-in form
  await page.waitForSelector('input[type="email"]', { timeout: 5000 })
}

/**
 * Extended test with authenticated page fixture
 */
export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    // Generate unique credentials for this test
    const timestamp = Date.now()
    const email = `test-${timestamp}@goalchaser.test`
    const password = 'TestPassword123!'
    const name = `Test User ${timestamp}`

    // Sign up the user
    await signUpUser(page, email, password, name)

    // Provide the authenticated page to the test
    await use(page)

    // Cleanup: sign out after the test
    await signOut(page).catch(() => {
      // Ignore errors during cleanup
    })
  },
})

export { expect }

