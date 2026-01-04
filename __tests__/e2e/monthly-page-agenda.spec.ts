import { test, expect } from '@playwright/test'
import {
  seedUser,
  seedGoal,
  verifyAgendaInDb,
} from '../seeds'
import {
  signIn,
  navigateToGoal,
  clickCalendarDay,
  addAgendaItem,
  deleteAgendaSingleDay,
  deleteAgendaSeries,
  waitForGoalPageLoad,
} from '../fixtures'
import {
  expectDaySelected,
  expectAgendaItemVisible,
  expectAgendaItemNotVisible,
  expectAgendaCount,
  expectAgendaItemHasRepeat,
} from '../fixtures'

// Fixed date for testing - January 15, 2025 (Wednesday)
const FIXED_DATE = '2025-01-15'
const FIXED_TIMESTAMP = new Date(FIXED_DATE).getTime()

test.describe('Monthly Page - Agenda Management', () => {
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

  test('should create daily recurring agenda and verify all instances in database', async ({ page }) => {
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

    // Add daily recurring agenda for 7 days
    const agendaId = await addAgendaItem(page, user.uid, goal.id, FIXED_DATE, {
      title: 'Morning Exercise',
      startTime: '06:00',
      endTime: '07:00',
      note: '30 min cardio + stretching',
      repeatType: 'daily',
      startDate: FIXED_DATE,
      endDate: '2025-01-21', // 7 days
    })

    // Wait for save
    await page.waitForTimeout(1500)

    // Verify visually
    await expectAgendaItemVisible(page, agendaId)
    await expectAgendaItemHasRepeat(page, agendaId, 'Daily')

    // Verify in database - check all 7 days
    for (let day = 15; day <= 21; day++) {
      const date = `2025-01-${day.toString().padStart(2, '0')}`
      const hasAgenda = await verifyAgendaInDb(user.uid, goal.id, date, 'Morning Exercise')
      expect(hasAgenda).toBe(true)
    }
  })

  test('should create weekly recurring agenda on specific days', async ({ page }) => {
    // Seed data
    const { user, credentials } = await seedUser()
    const goal = await seedGoal({ userId: user.uid, name: 'Test Goal' })

    // Sign in
    await page.goto('/')
    await signIn(page, credentials)
    await navigateToGoal(page, goal.id)
    await waitForGoalPageLoad(page)

    // Select today (Wednesday, Jan 15)
    await clickCalendarDay(page, 15)
    await expectDaySelected(page, 15)

    // Add weekly recurring agenda for Mon, Wed, Fri
    // Fixture will automatically handle which days are already selected
    const agendaId = await addAgendaItem(page, user.uid, goal.id, FIXED_DATE, {
      title: 'Team Meeting',
      startTime: '10:00',
      endTime: '11:00',
      repeatType: 'weekly',
      repeatDays: ['mon', 'wed', 'fri'],
      endDate: '2025-01-31', // About 2 weeks
    })

    // Wait for save
    await page.waitForTimeout(1500)

    // Verify visually on today (Wednesday)
    await expectAgendaItemVisible(page, agendaId)
    await expectAgendaItemHasRepeat(page, agendaId, 'Weekly')

    // Verify in database - should exist on Mon/Wed/Fri from Jan 15 through Jan 31
    const expectedDates = [
      '2025-01-15', // Wed (today)
      '2025-01-17', // Fri
      '2025-01-20', // Mon
      '2025-01-22', // Wed
      '2025-01-24', // Fri
      '2025-01-27', // Mon
      '2025-01-29', // Wed
      '2025-01-31', // Fri
    ]
    
    for (const date of expectedDates) {
      const hasAgenda = await verifyAgendaInDb(user.uid, goal.id, date, 'Team Meeting')
      expect(hasAgenda).toBe(true)
    }

    // Verify it doesn't exist on other days (e.g., Tuesday 21st, Thursday 23rd)
    const hasAgendaOnTuesday = await verifyAgendaInDb(user.uid, goal.id, '2025-01-21', 'Team Meeting')
    expect(hasAgendaOnTuesday).toBe(false)
    
    const hasAgendaOnThursday = await verifyAgendaInDb(user.uid, goal.id, '2025-01-23', 'Team Meeting')
    expect(hasAgendaOnThursday).toBe(false)
  })

  test('should delete a single day agenda without affecting others', async ({ page }) => {
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

    // Add daily recurring agenda
    const agendaId = await addAgendaItem(page, user.uid, goal.id, FIXED_DATE, {
      title: 'Daily Standup',
      repeatType: 'daily',
      startDate: FIXED_DATE,
      endDate: '2025-01-19', // 5 days
    })

    await page.waitForTimeout(1500)

    // Verify it exists
    await expectAgendaItemVisible(page, agendaId)

    // Delete only today's instance
    await deleteAgendaSingleDay(page, agendaId)
    await page.waitForTimeout(1000)

    // Verify it's gone from UI
    await expectAgendaItemNotVisible(page, agendaId)

    // Verify in database - should be deleted from today but exist on other days
    const hasAgendaToday = await verifyAgendaInDb(user.uid, goal.id, FIXED_DATE, 'Daily Standup')
    expect(hasAgendaToday).toBe(false)

    const hasAgendaTomorrow = await verifyAgendaInDb(user.uid, goal.id, '2025-01-16', 'Daily Standup')
    expect(hasAgendaTomorrow).toBe(true)
  })

  test('should delete entire series and remove all instances', async ({ page }) => {
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

    // Add daily recurring agenda
    const agendaId = await addAgendaItem(page, user.uid, goal.id, FIXED_DATE, {
      title: 'Code Review',
      repeatType: 'daily',
      startDate: FIXED_DATE,
      endDate: '2025-01-20', // 6 days
    })

    await page.waitForTimeout(1500)

    // Verify it exists
    await expectAgendaItemVisible(page, agendaId)

    // Delete entire series
    await deleteAgendaSeries(page, agendaId)
    await page.waitForTimeout(1000)

    // Verify it's gone from UI
    await expectAgendaItemNotVisible(page, agendaId)

    // Verify in database - should be deleted from all days
    for (let day = 15; day <= 20; day++) {
      const date = `2025-01-${day.toString().padStart(2, '0')}`
      const hasAgenda = await verifyAgendaInDb(user.uid, goal.id, date, 'Code Review')
      expect(hasAgenda).toBe(false)
    }
  })

  test('should show recurring agenda items visually on the page', async ({ page }) => {
    // Seed data
    const { user, credentials } = await seedUser()
    const goal = await seedGoal({ userId: user.uid, name: 'Test Goal' })

    // Sign in
    await page.goto('/')
    await signIn(page, credentials)
    await navigateToGoal(page, goal.id)
    await waitForGoalPageLoad(page)

    // Select today (Wednesday, Jan 15)
    await clickCalendarDay(page, 15)
    await expectDaySelected(page, 15)

    // Add first agenda item - daily (start date auto-filled as today)
    const agendaId1 = await addAgendaItem(page, user.uid, goal.id, FIXED_DATE, {
      title: 'Morning Meditation',
      repeatType: 'daily',
      endDate: '2025-01-17', // 3 days
    })

    await page.waitForTimeout(1000)

    // Add second agenda item - weekly on Mon, Wed, Fri
    // Fixture will automatically handle which days are already selected
    const agendaId2 = await addAgendaItem(page, user.uid, goal.id, FIXED_DATE, {
      title: 'Gym Session',
      repeatType: 'weekly',
      repeatDays: ['mon', 'wed', 'fri'],
      endDate: '2025-01-17', // Until Fri
    })

    await page.waitForTimeout(1000)

    // Verify both are visible on today (Wednesday)
    await expectAgendaItemVisible(page, agendaId1)
    await expectAgendaItemVisible(page, agendaId2)
    await expectAgendaCount(page, 2)

    // Verify they have repeat badges
    await expectAgendaItemHasRepeat(page, agendaId1, 'Daily')
    await expectAgendaItemHasRepeat(page, agendaId2, 'Weekly')
  })
})

