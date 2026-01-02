import { test, expect } from '@playwright/test'
import { signUp, signIn } from '../fixtures'
import { seedUser } from '../seeds'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

test.describe('Authentication Flow', () => {
  test('should successfully sign up a new user', async ({ page }) => {
    const timestamp = Date.now()
    const email = `signup-test-${timestamp}@goalchaser.test`
    const password = 'TestPassword123!'
    const name = `Signup Test ${timestamp}`

    await signUp(page, { email, password, name })

    await expect(page).toHaveURL(BASE_URL)
    await expect(
      page.locator('text=Create Goal').or(page.locator('[data-testid="user-avatar"]'))
    ).toBeVisible({ timeout: 10000 })
  })

  test('should successfully sign in with existing user', async ({ page }) => {
    // Seed user in database
    const { credentials } = await seedUser({
      email: 'existing-user@goalchaser.test',
      password: 'TestPassword123!',
      displayName: 'Existing User'
    })
    
    // Sign in via UI
    await signIn(page, credentials)
    
    await expect(
      page.locator('text=Create Goal').or(page.locator('[data-testid="user-avatar"]'))
    ).toBeVisible({ timeout: 10000 })
  })
})
