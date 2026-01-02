import { test, expect } from '@playwright/test'
import { signUpUser, signInUserWithAuth } from '../fixtures/auth.fixture'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

test.describe('Authentication Flow', () => {
  test('should successfully sign up a new user', async ({ page }) => {
    const timestamp = Date.now()
    const email = `signup-test-${timestamp}@goalchaser.test`
    const password = 'TestPassword123!'
    const name = `Signup Test ${timestamp}`

    await signUpUser(page, email, password, name)

    await expect(page).toHaveURL(BASE_URL)
    await expect(
      page.locator('text=Create Goal').or(page.locator('[data-testid="user-avatar"]'))
    ).toBeVisible({ timeout: 10000 })
  })

  test('should successfully sign in with existing user', async ({ page }) => {
    // User is created via code (database), then signed in via UI
    await signInUserWithAuth(page)
    
    await expect(
      page.locator('text=Create Goal').or(page.locator('[data-testid="user-avatar"]'))
    ).toBeVisible({ timeout: 10000 })
  })
})
