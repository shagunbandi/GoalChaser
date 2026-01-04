import { test, expect } from '@playwright/test'
import {
  seedUser,
  seedGoal,
  seedDayDetails,
  seedMultipleDayDetails,
  getDayDetailsFromDb,
} from '../seeds'
import {
  signIn,
  navigateToGoal,
  clickCalendarDay,
  selectProductivityScore,
  addSubject,
  selectTopic,
  setSubjectHours,
  enterNotes,
  waitForGoalPageLoad,
} from '../fixtures'
import {
  expectGoalPage,
  expectDaySelected,
  expectProductivityScoreSelected,
  expectSubjectVisible,
  expectTopicSelected,
  expectNotesContain,
  expectSubjectHours,
} from '../fixtures'

// Fixed date for testing - January 15, 2025 (Wednesday)
const FIXED_DATE = '2025-01-15'
const FIXED_TIMESTAMP = new Date(FIXED_DATE).getTime()

test.describe('Monthly Page - Day Details', () => {
  test.beforeEach(async ({ page, context }) => {
    // Freeze time to a fixed date
    await context.addInitScript(`{
      Date.now = () => ${FIXED_TIMESTAMP};
      const OriginalDate = Date;
      Date = class extends OriginalDate {
        constructor(...args) {
          if (args.length === 0) {
            super(${FIXED_TIMESTAMP});
          } else {
            super(...args);
          }
        }
        static now() {
          return ${FIXED_TIMESTAMP};
        }
      };
    }`)
  })

  test('should select productivity score and persist to database', async ({ page }) => {
    // Seed data
    const { user, credentials } = await seedUser()
    const goal = await seedGoal({ userId: user.uid, name: 'Test Goal' })
    
    // Seed some historical data (past 7 days with different scores)
    await seedMultipleDayDetails({
      userId: user.uid,
      goalId: goal.id,
      startDate: '2025-01-08',
      endDate: '2025-01-14',
      details: Array.from({ length: 7 }, (_, i) => ({
        status: (i % 3) + 3, // Scores 3, 4, 5, 3, 4, 5, 3
        note: `Day ${i + 1}`,
      })),
    })

    // Sign in and navigate
    await page.goto('/')
    await signIn(page, credentials)
    await navigateToGoal(page, goal.id)
    await waitForGoalPageLoad(page)

    // Click on today (day 15)
    await clickCalendarDay(page, 15)
    await expectDaySelected(page, 15)

    // Select productivity score 8
    await selectProductivityScore(page, 8)
    
    // Wait for save
    await page.waitForTimeout(1000)

    // Verify visually
    await expectProductivityScoreSelected(page, 8)

    // Verify in database
    const dayDetails = await getDayDetailsFromDb(user.uid, goal.id, FIXED_DATE)
    expect(dayDetails?.status).toBe(8)
  })

  test('should update subject and verify in database and UI', async ({ page }) => {
    // Seed data
    const { user, credentials } = await seedUser()
    const goal = await seedGoal({ userId: user.uid, name: 'Test Goal' })
    
    // Seed day details on a past day with Math subject - this will create the subject config
    await seedDayDetails({
      userId: user.uid,
      goalId: goal.id,
      date: '2025-01-10',
      status: 7,
      subjects: [{ subject: 'Math', topics: ['Algebra', 'Geometry'], hours: 2 }],
    })

    // Sign in
    await page.goto('/')
    await signIn(page, credentials)
    await navigateToGoal(page, goal.id)
    await waitForGoalPageLoad(page)

    // Select today
    await clickCalendarDay(page, 15)

    // Add Math subject
    await addSubject(page, 'Math')
    await expectSubjectVisible(page, 'Math')

    // Wait for save
    await page.waitForTimeout(1000)

    // Verify in database
    const dayDetails = await getDayDetailsFromDb(user.uid, goal.id, FIXED_DATE)
    expect(dayDetails?.subjects?.some(s => s.subject === 'Math')).toBe(true)
  })

  test('should select topic and verify in database and UI', async ({ page }) => {
    // Seed data with subject and topics
    const { user, credentials } = await seedUser()
    const goal = await seedGoal({ userId: user.uid, name: 'Test Goal' })
    
    // Seed day details on a past day with Science subject - this will create the subject config
    await seedDayDetails({
      userId: user.uid,
      goalId: goal.id,
      date: '2025-01-10',
      status: 7,
      subjects: [{ subject: 'Science', topics: ['Physics', 'Chemistry', 'Biology'], hours: 2 }],
    })

    // Sign in
    await page.goto('/')
    await signIn(page, credentials)
    await navigateToGoal(page, goal.id)
    await waitForGoalPageLoad(page)

    // Select today
    await clickCalendarDay(page, 15)

    // Add Science subject
    await addSubject(page, 'Science')
    await expectSubjectVisible(page, 'Science')

    // Select Physics topic
    await selectTopic(page, 'Science', 'Physics')
    await expectTopicSelected(page, 'Science', 'Physics')

    // Wait for save
    await page.waitForTimeout(1000)

    // Verify in database
    const dayDetails = await getDayDetailsFromDb(user.uid, goal.id, FIXED_DATE)
    const scienceSubject = dayDetails?.subjects?.find(s => s.subject === 'Science')
    expect(scienceSubject?.topics).toContain('Physics')
  })

  test('should set hours for subject and verify in database', async ({ page }) => {
    // Seed data
    const { user, credentials } = await seedUser()
    const goal = await seedGoal({ userId: user.uid, name: 'Test Goal' })
    
    // Seed day details on a past day with English subject - this will create the subject config
    await seedDayDetails({
      userId: user.uid,
      goalId: goal.id,
      date: '2025-01-10',
      status: 7,
      subjects: [{ subject: 'English', topics: ['Grammar', 'Literature'], hours: 1 }],
    })

    // Sign in
    await page.goto('/')
    await signIn(page, credentials)
    await navigateToGoal(page, goal.id)
    await waitForGoalPageLoad(page)

    // Select today
    await clickCalendarDay(page, 15)

    // Add English subject
    await addSubject(page, 'English')

    // Set hours to 4
    await setSubjectHours(page, 'English', 4)
    await expectSubjectHours(page, 'English', 4)

    // Wait for save
    await page.waitForTimeout(1000)

    // Verify in database
    const dayDetails = await getDayDetailsFromDb(user.uid, goal.id, FIXED_DATE)
    const englishSubject = dayDetails?.subjects?.find(s => s.subject === 'English')
    expect(englishSubject?.hours).toBe(4)
  })

  test('should save notes and verify in database and UI', async ({ page }) => {
    // Seed data
    const { user, credentials } = await seedUser()
    const goal = await seedGoal({ userId: user.uid, name: 'Test Goal' })

    // Sign in
    await page.goto('/')
    await signIn(page, credentials)
    await navigateToGoal(page, goal.id)
    await waitForGoalPageLoad(page)

    // Select today
    await clickCalendarDay(page, 15)

    // Enter notes
    const testNotes = 'Today was a productive day! Learned a lot about testing.'
    await enterNotes(page, testNotes)
    await expectNotesContain(page, testNotes)

    // Wait for save
    await page.waitForTimeout(1500)

    // Verify in database
    const dayDetails = await getDayDetailsFromDb(user.uid, goal.id, FIXED_DATE)
    expect(dayDetails?.note).toBe(testNotes)
  })

  test('should update all fields together (score, subject, topic, hours, notes)', async ({ page }) => {
    // Seed data
    const { user, credentials } = await seedUser()
    const goal = await seedGoal({ userId: user.uid, name: 'Test Goal' })
    
    // Seed day details on a past day with History subject - this will create the subject config
    await seedDayDetails({
      userId: user.uid,
      goalId: goal.id,
      date: '2025-01-10',
      status: 5,
      subjects: [{ subject: 'History', topics: ['World War I', 'World War II', 'Cold War'], hours: 2 }],
    })

    // Sign in
    await page.goto('/')
    await signIn(page, credentials)
    await navigateToGoal(page, goal.id)
    await waitForGoalPageLoad(page)

    // Select today
    await clickCalendarDay(page, 15)

    // Set productivity score
    await selectProductivityScore(page, 9)
    await expectProductivityScoreSelected(page, 9)

    // Add subject
    await addSubject(page, 'History')
    await expectSubjectVisible(page, 'History')

    // Select topic
    await selectTopic(page, 'History', 'World War II')
    await expectTopicSelected(page, 'History', 'World War II')

    // Set hours
    await setSubjectHours(page, 'History', 3.5)
    await expectSubjectHours(page, 'History', 3.5)

    // Enter notes
    const notes = 'Studied the causes and timeline of WWII'
    await enterNotes(page, notes)
    await expectNotesContain(page, notes)

    // Wait for all saves
    await page.waitForTimeout(2000)

    // Verify everything in database
    const dayDetails = await getDayDetailsFromDb(user.uid, goal.id, FIXED_DATE)
    expect(dayDetails?.status).toBe(9)
    expect(dayDetails?.note).toBe(notes)
    
    const historySubject = dayDetails?.subjects?.find(s => s.subject === 'History')
    expect(historySubject).toBeDefined()
    expect(historySubject?.topics).toContain('World War II')
    expect(historySubject?.hours).toBe(3.5)
  })
})

