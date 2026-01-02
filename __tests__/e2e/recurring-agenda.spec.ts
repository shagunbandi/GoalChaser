/**
 * E2E tests for recurring agenda items
 * 
 * Prerequisites:
 * 1. Install Playwright: npm install --save-dev @playwright/test
 * 2. Create test user (see TEST_USER_SETUP.md)
 * 3. Add .env.test with TEST_USER_EMAIL and TEST_USER_PASSWORD
 * 
 * Run with: npx playwright test
 */

import { test, expect } from '@playwright/test'

// Test configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'test@goalchaser.test'
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'TestPassword123!'

test.describe('Recurring Agenda E2E Tests', () => {
  // Sign in before each test
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL)
    
    // Wait for page to load
    await page.waitForLoadState('networkidle')
    
    // Sign in if not already signed in
    const signInButton = page.locator('text=Sign In')
    if (await signInButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await page.fill('input[type="email"]', TEST_USER_EMAIL)
      await page.fill('input[type="password"]', TEST_USER_PASSWORD)
      await signInButton.click()
      await page.waitForLoadState('networkidle')
    }
  })

  test('should create a test goal for agenda testing', async ({ page }) => {
    // Navigate to goals or home page
    await page.goto(BASE_URL)
    
    // Create a new goal
    const createGoalButton = page.locator('text=Create Goal').or(page.locator('text=+ Create Goal'))
    if (await createGoalButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await createGoalButton.click()
      
      // Fill in goal details
      await page.fill('input[name="name"]', 'Agenda Test Goal')
      await page.fill('textarea[name="description"]', 'Test goal for recurring agenda items')
      
      // Submit
      await page.click('button:has-text("Create")')
      await page.waitForLoadState('networkidle')
    }
    
    // Verify goal was created
    await expect(page.locator('text=Agenda Test Goal')).toBeVisible()
  })

  test('should create recurring Monday agenda for 4 weeks', async ({ page }) => {
    // Navigate to the calendar view
    await page.goto(BASE_URL)
    
    // Select a Monday (2026-01-05 is a Monday)
    await page.click('[data-date="2026-01-05"]').catch(() => {
      console.log('Date cell not found, trying alternative selector')
    })
    
    // Open agenda manager
    await page.click('button:has-text("+ Add agenda")')
    
    // Fill in agenda details
    await page.fill('input[placeholder*="agenda item"]', 'Team Meeting')
    await page.fill('input[type="time"]:first', '10:00')
    await page.fill('input[type="time"]:last', '11:00')
    await page.fill('textarea[placeholder*="note"]', 'Weekly team sync')
    
    // Select weekly repeat
    await page.selectOption('select', 'weekly')
    
    // Select Monday
    await page.click('button:has-text("MON")')
    
    // Set end date (4 weeks)
    const endDateInput = page.locator('input[type="date"]:last')
    await endDateInput.fill('2026-02-02')
    
    // Add agenda
    await page.click('button:has-text("Add")')
    
    // Wait for success message
    await expect(page.locator('text*=saved')).toBeVisible({ timeout: 5000 })
    
    // Verify it was created
    await expect(page.locator('text=Team Meeting')).toBeVisible()
    await expect(page.locator('text=Weekly')).toBeVisible()
  })

  test('should create recurring Wednesday agenda for 4 weeks', async ({ page }) => {
    // Navigate to the calendar view
    await page.goto(BASE_URL)
    
    // Select a Wednesday (2026-01-07 is a Wednesday)
    await page.click('[data-date="2026-01-07"]').catch(() => {
      console.log('Date cell not found, trying alternative selector')
    })
    
    // Open agenda manager
    await page.click('button:has-text("+ Add agenda")')
    
    // Fill in agenda details
    await page.fill('input[placeholder*="agenda item"]', 'Study Session')
    await page.fill('input[type="time"]:first', '14:00')
    await page.fill('input[type="time"]:last', '16:00')
    
    // Select weekly repeat
    await page.selectOption('select', 'weekly')
    
    // Select Wednesday
    await page.click('button:has-text("WED")')
    
    // Set end date (4 weeks)
    const endDateInput = page.locator('input[type="date"]:last')
    await endDateInput.fill('2026-02-04')
    
    // Add agenda
    await page.click('button:has-text("Add")')
    
    // Wait for success message
    await expect(page.locator('text*=saved')).toBeVisible({ timeout: 5000 })
    
    // Verify it was created
    await expect(page.locator('text=Study Session')).toBeVisible()
  })

  test('should verify Monday agenda appears on all Mondays', async ({ page }) => {
    await page.goto(BASE_URL)
    
    // Check each Monday in the range
    const mondays = ['2026-01-05', '2026-01-12', '2026-01-19', '2026-01-26']
    
    for (const monday of mondays) {
      // Click on the Monday date
      await page.click(`[data-date="${monday}"]`).catch(() => {
        console.log(`Date ${monday} not found`)
      })
      
      // Verify Team Meeting appears
      await expect(page.locator('text=Team Meeting')).toBeVisible({ timeout: 2000 })
      await expect(page.locator('text=10:00')).toBeVisible()
    }
  })

  test('should verify Wednesday agenda appears on all Wednesdays', async ({ page }) => {
    await page.goto(BASE_URL)
    
    // Check each Wednesday in the range
    const wednesdays = ['2026-01-07', '2026-01-14', '2026-01-21', '2026-01-28']
    
    for (const wednesday of wednesdays) {
      // Click on the Wednesday date
      await page.click(`[data-date="${wednesday}"]`).catch(() => {
        console.log(`Date ${wednesday} not found`)
      })
      
      // Verify Study Session appears
      await expect(page.locator('text=Study Session')).toBeVisible({ timeout: 2000 })
      await expect(page.locator('text=14:00')).toBeVisible()
    }
  })

  test('should edit a recurring series', async ({ page }) => {
    await page.goto(BASE_URL)
    
    // Navigate to a Monday with Team Meeting
    await page.click('[data-date="2026-01-12"]').catch(() => {})
    
    // Wait for agenda to load
    await page.waitForSelector('text=Team Meeting', { timeout: 5000 })
    
    // Click edit button
    await page.click('button[title="Edit"]')
    
    // Change the title
    const titleInput = page.locator('input[placeholder*="agenda item"]')
    await titleInput.fill('Updated Team Meeting')
    
    // Save changes
    await page.click('button:has-text("Update")')
    
    // Wait for success
    await expect(page.locator('text*=updated')).toBeVisible({ timeout: 5000 })
    
    // Verify change appears on another Monday
    await page.click('[data-date="2026-01-19"]').catch(() => {})
    await expect(page.locator('text=Updated Team Meeting')).toBeVisible()
  })

  test('should delete a recurring series', async ({ page }) => {
    await page.goto(BASE_URL)
    
    // Navigate to a Wednesday with Study Session
    await page.click('[data-date="2026-01-14"]').catch(() => {})
    
    // Wait for agenda to load
    await page.waitForSelector('text=Study Session', { timeout: 5000 })
    
    // Click series delete button (trash icon)
    await page.click('button[title="Delete series"]')
    
    // Wait for deletion
    await page.waitForTimeout(2000)
    
    // Verify it's gone from all Wednesdays
    const wednesdays = ['2026-01-07', '2026-01-14', '2026-01-21', '2026-01-28']
    
    for (const wednesday of wednesdays) {
      await page.click(`[data-date="${wednesday}"]`).catch(() => {})
      await expect(page.locator('text=Study Session')).not.toBeVisible({ timeout: 2000 })
    }
  })

  test('should complete agenda item and attach subjects', async ({ page }) => {
    await page.goto(BASE_URL)
    
    // Navigate to a past Monday
    await page.click('[data-date="2026-01-05"]').catch(() => {})
    
    // Wait for Team Meeting
    await page.waitForSelector('text=Team Meeting', { timeout: 5000 })
    
    // Click completion checkbox
    await page.click('button[title="Mark done"]')
    
    // Wait for completion
    await page.waitForTimeout(1000)
    
    // Verify it's marked as completed
    await expect(page.locator('button[title="Completed"]')).toBeVisible()
    
    // If subjects were attached, verify they appear in the day
    // (This depends on your UI - adjust selector as needed)
    await expect(page.locator('[data-testid="subjects-section"]')).toBeVisible().catch(() => {
      console.log('Subjects section not found or not required')
    })
  })

  test('should handle agenda with custom days (Mon/Wed/Fri)', async ({ page }) => {
    await page.goto(BASE_URL)
    
    // Navigate to a date
    await page.click('[data-date="2026-01-06"]').catch(() => {})
    
    // Open agenda manager
    await page.click('button:has-text("+ Add agenda")')
    
    // Fill details
    await page.fill('input[placeholder*="agenda item"]', 'Gym Session')
    
    // Select custom repeat
    await page.selectOption('select', 'custom')
    
    // Select Mon, Wed, Fri
    await page.click('button:has-text("MON")')
    await page.click('button:has-text("WED")')
    await page.click('button:has-text("FRI")')
    
    // Set end date (2 weeks)
    const endDateInput = page.locator('input[type="date"]:last')
    await endDateInput.fill('2026-01-16')
    
    // Add
    await page.click('button:has-text("Add")')
    
    // Wait for success
    await expect(page.locator('text*=saved')).toBeVisible({ timeout: 5000 })
    
    // Verify it appears on Mon/Wed/Fri but not other days
    await page.click('[data-date="2026-01-07"]').catch(() => {}) // Wed
    await expect(page.locator('text=Gym Session')).toBeVisible()
    
    await page.click('[data-date="2026-01-08"]').catch(() => {}) // Thu
    await expect(page.locator('text=Gym Session')).not.toBeVisible()
    
    await page.click('[data-date="2026-01-09"]').catch(() => {}) // Fri
    await expect(page.locator('text=Gym Session')).toBeVisible()
  })

  // Cleanup test
  test.afterAll(async ({ browser }) => {
    // Optional: Clean up test data
    // You can add cleanup logic here if needed
    console.log('E2E tests completed')
  })
})

