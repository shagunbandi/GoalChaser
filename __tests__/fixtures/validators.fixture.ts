import { Page, expect } from '@playwright/test'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

/**
 * Validates that the user is on the authenticated home page
 */
export async function expectHomePage(page: Page) {
  await expect(page).toHaveURL(BASE_URL)
  await expect(page.getByTestId('create-goal-button')).toBeVisible({ timeout: 10000 })
}

/**
 * Validates that the user is on a goal page (with calendar)
 */
export async function expectGoalPage(page: Page) {
  await expect(page).toHaveURL(/\/goal\/.*/)
  await expect(page.getByTestId('calendar-header')).toBeVisible({ timeout: 10000 })
}

/**
 * Validates that the user is on the sign in page
 */
export async function expectSignInPage(page: Page) {
  await expect(page).toHaveURL(BASE_URL)
  await expect(page.locator('input[type="email"]')).toBeVisible()
  await expect(page.locator('input[type="password"]')).toBeVisible()
  await expect(page.locator('text=Sign in').or(page.locator('text=Sign up'))).toBeVisible()
}

/**
 * Validates that a specific element is visible on the page
 */
export async function expectVisible(page: Page, testId: string, timeout = 5000) {
  await expect(page.getByTestId(testId)).toBeVisible({ timeout })
}

/**
 * Validates that the calendar is displayed with weekday labels
 */
export async function expectCalendarVisible(page: Page) {
  await expect(page.getByTestId('calendar-weekdays')).toBeVisible()
  await expect(page.getByTestId('calendar-days-grid')).toBeVisible()
}

/**
 * Validates that the user sees a greeting message (authenticated state)
 */
export async function expectAuthenticatedGreeting(page: Page) {
  await expect(page.getByTestId('dashboard-greeting')).toBeVisible({ timeout: 10000 })
}

/**
 * Validates that a specific day is selected in the calendar
 */
export async function expectDaySelected(page: Page, dayNumber: number) {
  const dayCell = page.getByTestId(`calendar-day-${dayNumber}`)
  await expect(dayCell).toHaveAttribute('data-selected', 'true')
}

/**
 * Validates that a specific day is marked as today
 */
export async function expectDayIsToday(page: Page, dayNumber: number) {
  const dayCell = page.getByTestId(`calendar-day-${dayNumber}`)
  await expect(dayCell).toHaveAttribute('data-today', 'true')
}

/**
 * Validates the current month displayed in calendar
 */
export async function expectCalendarMonth(page: Page, month: string, year: number) {
  const header = page.getByTestId('calendar-month-year')
  await expect(header).toHaveText(`${month} ${year}`)
}

/**
 * Validates that goals list is visible
 */
export async function expectGoalsList(page: Page) {
  await expect(page.getByTestId('goals-list')).toBeVisible()
}

/**
 * Validates that create goal form is visible
 */
export async function expectCreateGoalForm(page: Page) {
  await expect(page.getByTestId('create-goal-form')).toBeVisible()
}

/**
 * Validates that a productivity score is selected
 */
export async function expectProductivityScoreSelected(page: Page, score: number) {
  const scoreButton = page.getByTestId(`productivity-score-${score}`)
  await expect(scoreButton).toHaveAttribute('data-selected', 'true')
}

/**
 * Validates that a subject entry is visible on the page
 */
export async function expectSubjectVisible(page: Page, subjectName: string) {
  await expect(page.getByTestId(`subject-entry-${subjectName}`)).toBeVisible()
}

/**
 * Validates that a topic is selected for a subject
 */
export async function expectTopicSelected(page: Page, subjectName: string, topicName: string) {
  const topicButton = page.getByTestId(`topic-${subjectName}-${topicName}`)
  await expect(topicButton).toHaveAttribute('data-selected', 'true')
}

/**
 * Validates that notes contain specific text
 */
export async function expectNotesContain(page: Page, text: string) {
  const notesInput = page.getByTestId('notes-input')
  await expect(notesInput).toHaveValue(text)
}

/**
 * Validates that an agenda item is visible by its ID.
 */
export async function expectAgendaItemVisible(page: Page, agendaId: string) {
  await expect(page.getByTestId(`agenda-item-${agendaId}`)).toBeVisible()
}

/**
 * Validates that an agenda item is NOT visible by its ID
 */
export async function expectAgendaItemNotVisible(page: Page, agendaId: string) {
  await expect(page.getByTestId(`agenda-item-${agendaId}`)).not.toBeVisible()
}

/**
 * Validates that an agenda item has a repeat badge by its ID.
 */
export async function expectAgendaItemHasRepeat(page: Page, agendaId: string, repeatType: string) {
  const agendaItem = page.getByTestId(`agenda-item-${agendaId}`)
  await expect(agendaItem.getByText(repeatType, { exact: true })).toBeVisible()
}

/**
 * Validates that subject hours are set correctly
 */
export async function expectSubjectHours(page: Page, subjectName: string, hours: number) {
  const hoursInput = page.getByTestId(`hours-input-${subjectName}`)
  await expect(hoursInput).toHaveValue(hours.toString())
}

/**
 * Validates agenda count.
 */
export async function expectAgendaCount(page: Page, count: number) {
  if (count === 0) {
    await expect(page.getByTestId('agenda-count')).not.toBeVisible()
  } else {
    await expect(page.getByTestId('agenda-count')).toContainText(`${count} item${count === 1 ? '' : 's'}`)
  }
}

