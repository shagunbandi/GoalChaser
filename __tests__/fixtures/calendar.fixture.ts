import { Page } from '@playwright/test'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

/**
 * Navigates to a goal's page
 */
export async function navigateToGoal(page: Page, goalId: string) {
  await page.goto(`${BASE_URL}/goal/${goalId}`)
  await page.waitForLoadState('networkidle')
}

/**
 * Clicks the previous month button on the calendar
 */
export async function goToPreviousMonth(page: Page) {
  await page.getByTestId('calendar-prev-month').click()
  await page.waitForTimeout(300) // Wait for UI update
}

/**
 * Clicks the next month button on the calendar
 */
export async function goToNextMonth(page: Page) {
  await page.getByTestId('calendar-next-month').click()
  await page.waitForTimeout(300) // Wait for UI update
}

/**
 * Clicks on a specific day in the calendar
 */
export async function clickDay(page: Page, dayNumber: number) {
  await page.getByTestId(`calendar-day-${dayNumber}`).click()
  await page.waitForTimeout(300) // Wait for selection to update
}

/**
 * Gets the current month/year text from calendar header
 */
export async function getCalendarHeader(page: Page): Promise<string> {
  const header = page.getByTestId('calendar-month-year')
  return await header.textContent() || ''
}

/**
 * Checks if a day is highlighted as today (blue ring)
 */
export async function isDayToday(page: Page, dayNumber: number): Promise<boolean> {
  const dayCell = page.getByTestId(`calendar-day-${dayNumber}`)
  const isTodayAttr = await dayCell.getAttribute('data-today')
  return isTodayAttr === 'true'
}

/**
 * Checks if a day is selected (purple ring)
 */
export async function isDaySelected(page: Page, dayNumber: number): Promise<boolean> {
  const dayCell = page.getByTestId(`calendar-day-${dayNumber}`)
  const isSelectedAttr = await dayCell.getAttribute('data-selected')
  return isSelectedAttr === 'true'
}

