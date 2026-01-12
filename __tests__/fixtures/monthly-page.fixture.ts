import type { Page } from '@playwright/test'
import type { RepeatType } from '@/types'
import { waitForAgendaItemInDb } from './firestore-interceptor.fixture'

/**
 * Selects a productivity score (1-10) for the currently selected day
 */
export async function selectProductivityScore(page: Page, score: number) {
  if (score < 1 || score > 10) {
    throw new Error('Productivity score must be between 1 and 10')
  }
  await page.getByTestId(`productivity-score-${score}`).click()
}

/**
 * Adds a subject to the current day by clicking the subject button or typing in the new subject input
 */
export async function addSubject(page: Page, subjectName: string) {
  // Try to find the quick-add button first
  const quickAddButton = page.getByTestId(`add-subject-${subjectName}`)
  const isQuickAddVisible = await quickAddButton.isVisible().catch(() => false)
  
  if (isQuickAddVisible) {
    await quickAddButton.click()
  } else {
    // If no quick-add button, use the "+ New Subject" input approach
    // Look for the subject entry that's being edited or the add button
    await page.getByText('+ New Subject').click()
    // Type the subject name
    const subjectInput = page.locator('input[placeholder*="subject" i]')
    await subjectInput.fill(subjectName)
    await subjectInput.press('Enter')
  }
}

/**
 * Selects a topic for a subject on the current day.
 * If the topic doesn't exist as a button, it will add it dynamically.
 */
export async function selectTopic(page: Page, subjectName: string, topicName: string) {
  // First expand the subject if not already expanded
  const subjectEntry = page.getByTestId(`subject-entry-${subjectName}`)
  await subjectEntry.click()
  
  // Wait a moment for expansion
  await page.waitForTimeout(300)
  
  // Try to find the topic button
  const topicButton = page.getByTestId(`topic-${subjectName}-${topicName}`)
  const isTopicVisible = await topicButton.isVisible().catch(() => false)
  
  if (isTopicVisible) {
    await topicButton.click()
  } else {
    // Topic doesn't exist, add it dynamically
    await page.getByText('+ Topic').click()
    const topicInput = page.locator('input[placeholder*="topic" i]')
    await topicInput.fill(topicName)
    // Press Enter to add the topic
    await topicInput.press('Enter')
    // Wait for it to be added
    await page.waitForTimeout(500)
  }
}

/**
 * Sets hours for a subject on the current day
 */
export async function setSubjectHours(page: Page, subjectName: string, hours: number) {
  const hoursInput = page.getByTestId(`hours-input-${subjectName}`)
  await hoursInput.fill(hours.toString())
}

/**
 * Enters text into the notes field for the current day
 */
export async function enterNotes(page: Page, notes: string) {
  await page.getByTestId('notes-input').fill(notes)
}

/**
 * Clicks on a specific day in the calendar
 */
export async function clickCalendarDay(page: Page, dayOfMonth: number) {
  // Use  to get the month view calendar (year view is typically first)
  await page.getByTestId(`calendar-day-${dayOfMonth}`).click()
}

/**
 * Opens the add agenda modal.
 */
export async function openAddAgendaModal(page: Page) {
  await page.getByTestId('button-add-agenda').click()
}

/**
 * Fills in the agenda form fields
 */
export async function fillAgendaForm(page: Page, options: {
  title: string
  startTime?: string
  endTime?: string
  note?: string
  repeatType?: RepeatType
  repeatDays?: string[]
  startDate?: string
  endDate?: string
}) {
  // Fill title
  await page.getByTestId('input-agenda-title').fill(options.title)
  
  // Fill optional fields
  if (options.startTime) {
    await page.getByTestId('input-start-time').fill(options.startTime)
  }
  
  if (options.endTime) {
    await page.getByTestId('input-end-time').fill(options.endTime)
  }
  
  if (options.note) {
    await page.getByTestId('input-agenda-note').fill(options.note)
  }
  
  // Set repeat type FIRST (this shows/hides weekday selector)
  if (options.repeatType) {
    await page.getByTestId('select-repeat-type').selectOption(options.repeatType)
    // Wait for weekday selector to appear if needed
    if (options.repeatType === 'weekly') {
      await page.waitForTimeout(200)
    }
  }
  
  // Select repeat days AFTER repeat type is set
  if (options.repeatDays && options.repeatDays.length > 0) {
    for (const day of options.repeatDays) {
      const dayButton = page.getByTestId(`button-weekday-${day}`)
      
      // Check if this day is already selected (auto-selected based on current date)
      const isSelected = await dayButton.evaluate((el) => {
        return el.classList.contains('bg-[#AF52DE]')
      })
      
      // Only click if not already selected
      if (!isSelected) {
        await dayButton.click()
        await page.waitForTimeout(100) // Small wait between clicks
      }
    }
  }
  
  // Set date range last (start date is usually auto-filled from the selected day)
  if (options.startDate) {
    await page.getByTestId('input-recurrence-start').fill(options.startDate)
  }
  
  if (options.endDate) {
    await page.getByTestId('input-recurrence-end').fill(options.endDate)
  }
}

/**
 * Submits the agenda form
 */
export async function submitAgendaForm(page: Page) {
  await page.getByTestId('button-submit-agenda').click()
  // Wait for modal to close
  await page.waitForTimeout(500)
}

/**
 * Adds a complete agenda item with one action.
 * Returns the created agenda ID.
 */
export async function addAgendaItem(
  page: Page, 
  userId: string,
  goalId: string,
  date: string,
  options: {
    title: string
    startTime?: string
    endTime?: string
    note?: string
    repeatType?: RepeatType
    repeatDays?: string[]
    startDate?: string
    endDate?: string
  }
): Promise<string> {
  await openAddAgendaModal(page)
  await fillAgendaForm(page, options)
  await submitAgendaForm(page)
  
  // Query Firestore directly to get the agenda ID by title
  const agendaId = await waitForAgendaItemInDb(userId, goalId, date, options.title)
  
  // Wait a bit for UI to update
  await page.waitForTimeout(500)
  
  return agendaId
}

/**
 * Deletes a single day's agenda item by its ID.
 */
export async function deleteAgendaSingleDay(page: Page, agendaId: string) {
  const agendaItem = page.getByTestId(`agenda-item-${agendaId}`)
  await agendaItem.getByTestId('button-delete-single').click()
  // Wait for deletion to complete
  await page.waitForTimeout(500)
}

/**
 * Deletes an entire agenda series by its ID.
 */
export async function deleteAgendaSeries(page: Page, agendaId: string) {
  const agendaItem = page.getByTestId(`agenda-item-${agendaId}`)
  await agendaItem.getByTestId('button-delete-series').click()
  // Wait for deletion to complete
  await page.waitForTimeout(500)
}

/**
 * Waits for the goal page to fully load
 */
export async function waitForGoalPageLoad(page: Page) {
  // Just wait a short time for initial render to complete
  await page.waitForTimeout(1000)
}

