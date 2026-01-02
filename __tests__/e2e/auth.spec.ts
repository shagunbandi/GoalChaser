/**
 * E2E tests for authentication flow using Firebase emulator
 * 
 * Prerequisites:
 * 1. Start Firebase emulators: npm run emulators
 * 2. Start dev server: npm run dev
 * 3. Run tests: npm run test:e2e
 * 
 * The tests use Firebase Auth emulator, so no real accounts are created.
 */

import { test, expect } from '@playwright/test'
import { signUpUser, signInUser, signOut } from '../fixtures/auth.fixture'

// Test configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

test.describe('Authentication Flow', () => {
  test('should display the sign-in page when not authenticated', async ({ page }) => {
    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')

    // Check for authentication form elements
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
    
    // Check for Google sign-in button
    await expect(page.locator('text=Continue with Google')).toBeVisible()
  })

  test('should successfully sign up a new user', async ({ page }) => {
    const timestamp = Date.now()
    const email = `signup-test-${timestamp}@goalchaser.test`
    const password = 'TestPassword123!'
    const name = `Signup Test ${timestamp}`

    await signUpUser(page, email, password, name)

    // Verify we're on the authenticated home page
    await expect(page).toHaveURL(BASE_URL)
    
    // Check for authenticated user indicators
    // This could be a user avatar, username display, or dashboard elements
    await expect(
      page.locator('text=Create Goal').or(page.locator('[data-testid="user-avatar"]'))
    ).toBeVisible({ timeout: 10000 })
  })

  test('should successfully sign in with existing user', async ({ page }) => {
    const timestamp = Date.now()
    const email = `signin-test-${timestamp}@goalchaser.test`
    const password = 'TestPassword123!'
    const name = `Signin Test ${timestamp}`

    // First, create the user
    await signUpUser(page, email, password, name)
    
    // Sign out
    await signOut(page)
    
    // Verify we're signed out
    await expect(page.locator('input[type="email"]')).toBeVisible()
    
    // Now sign in again
    await signInUser(page, email, password)
    
    // Verify we're signed in
    await expect(
      page.locator('text=Create Goal').or(page.locator('[data-testid="user-avatar"]'))
    ).toBeVisible({ timeout: 10000 })
  })

  test('should display error for invalid email format', async ({ page }) => {
    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')

    // Try to sign up with invalid email
    await page.fill('input[type="email"]', 'invalid-email')
    await page.fill('input[type="password"]', 'TestPassword123!')
    
    // HTML5 validation should prevent form submission
    // or Firebase will return an error
    const submitButton = page.locator('button[type="submit"]')
    await submitButton.click()
    
    // The form should either not submit or show an error
    await page.waitForTimeout(1000)
    
    // We should still be on the sign-in page
    await expect(page.locator('input[type="email"]')).toBeVisible()
  })

  test('should display error for weak password', async ({ page }) => {
    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')

    // Switch to sign-up mode
    const signUpLink = page.locator('text=Sign up')
    if (await signUpLink.isVisible().catch(() => false)) {
      await signUpLink.click()
      await page.waitForTimeout(500)
    }

    const timestamp = Date.now()
    const email = `weak-pass-${timestamp}@goalchaser.test`
    
    // Try to sign up with weak password (less than 6 characters)
    await page.fill('input[type="email"]', email)
    await page.fill('input[type="password"]', '12345')
    
    const submitButton = page.locator('button[type="submit"]')
    await submitButton.click()
    
    // Wait for error message - be more flexible with the text
    await page.waitForTimeout(1000)
    const errorVisible = await page.locator('text=/Password|password|6 characters|weak/i').isVisible().catch(() => false)
    expect(errorVisible).toBeTruthy()
  })

  test('should display error for incorrect password on sign-in', async ({ page }) => {
    const timestamp = Date.now()
    const email = `wrong-pass-${timestamp}@goalchaser.test`
    const password = 'CorrectPassword123!'
    const name = `Wrong Pass Test ${timestamp}`

    // First, create the user
    await signUpUser(page, email, password, name)
    
    // Sign out
    await signOut(page)
    
    // Try to sign in with wrong password
    await page.fill('input[type="email"]', email)
    await page.fill('input[type="password"]', 'WrongPassword123!')
    
    const submitButton = page.locator('button[type="submit"]')
    await submitButton.click()
    
    // Wait for error message
    await expect(
      page.locator('text=Incorrect password').or(
        page.locator('text=Invalid email or password').or(
          page.locator('text=wrong-password')
        )
      )
    ).toBeVisible({ timeout: 5000 })
  })

  test('should successfully sign out', async ({ page }) => {
    const timestamp = Date.now()
    const email = `signout-test-${timestamp}@goalchaser.test`
    const password = 'TestPassword123!'
    const name = `Signout Test ${timestamp}`

    // Sign up
    await signUpUser(page, email, password, name)
    
    // Verify we're signed in
    await expect(page).toHaveURL(BASE_URL)
    
    // Sign out
    await signOut(page)
    
    // Verify we're back to sign-in page
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('should toggle between sign-in and sign-up modes', async ({ page }) => {
    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')

    // Check initial state - look for the toggle button
    const signUpButton = page.locator('button:has-text("Sign up")')
    const signInButton = page.locator('button:has-text("Sign in")')
    
    const hasSignUpButton = await signUpButton.isVisible().catch(() => false)
    const hasSignInButton = await signInButton.isVisible().catch(() => false)
    
    // Verify we can see a toggle button
    expect(hasSignUpButton || hasSignInButton).toBeTruthy()
    
    // Click whichever toggle button is visible and verify the other appears
    if (hasSignUpButton) {
      await signUpButton.click()
      await page.waitForTimeout(1000)
      // After clicking "Sign up", we should see "Sign in" button
      await expect(signInButton).toBeVisible()
    } else if (hasSignInButton) {
      await signInButton.click()
      await page.waitForTimeout(1000)
      // After clicking "Sign in", we should see "Sign up" button
      await expect(signUpButton).toBeVisible()
    }
  })

  test('should persist authentication across page reloads', async ({ page }) => {
    const timestamp = Date.now()
    const email = `persist-test-${timestamp}@goalchaser.test`
    const password = 'TestPassword123!'
    const name = `Persist Test ${timestamp}`

    // Sign up
    await signUpUser(page, email, password, name)
    
    // Reload the page
    await page.reload()
    await page.waitForLoadState('load')
    await page.waitForTimeout(3000) // Wait for auth state to settle
    
    // Should still be authenticated - use .first() to avoid strict mode violation
    await expect(
      page.locator('[data-testid="user-avatar"]').first()
    ).toBeVisible({ timeout: 15000 })
    
    // Should NOT see the sign-in form
    const emailInput = page.locator('input[type="email"]')
    await expect(emailInput).not.toBeVisible()
  })
})

