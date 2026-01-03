import { test } from '@playwright/test'
import { signUp, signIn, expectHomePage } from '../fixtures'
import { seedUser } from '../seeds'

test.describe('Authentication Flow', () => {
  test('should successfully sign up a new user', async ({ page }) => {
    const timestamp = Date.now()
    const email = `signup-test-${timestamp}@goalchaser.test`
    const password = 'TestPassword123!'
    const name = `Signup Test ${timestamp}`

    await signUp(page, { email, password, name })
    await expectHomePage(page)
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
    await expectHomePage(page)
  })
})
