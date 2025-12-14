import type { MonthInfo, DayInfo, TimeRange } from '@/types'

/**
 * Convert a Date object to ISO date string (YYYY-MM-DD)
 */
export function toISODateString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Compute month information including all days
 */
export function computeMonthInfo(year: number, month: number): MonthInfo {
  const days: DayInfo[] = []
  const daysInMonth = new Date(year, month, 0).getDate()

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day)
    const jsWeekday = date.getDay()
    const weekdayIndex = jsWeekday === 0 ? 6 : jsWeekday - 1

    days.push({
      date,
      iso: toISODateString(date),
      dayOfMonth: day,
      weekdayIndex,
    })
  }

  return { year, month, days }
}

/**
 * Get previous month's year and month
 */
export function getPreviousMonth(
  year: number,
  month: number
): { year: number; month: number } {
  if (month === 1) return { year: year - 1, month: 12 }
  return { year, month: month - 1 }
}

/**
 * Get next month's year and month
 */
export function getNextMonth(
  year: number,
  month: number
): { year: number; month: number } {
  if (month === 12) return { year: year + 1, month: 1 }
  return { year, month: month + 1 }
}

/**
 * Get milliseconds until midnight
 */
export function getMsUntilMidnight(): number {
  const now = new Date()
  const midnight = new Date(now)
  midnight.setHours(24, 0, 0, 0)
  return midnight.getTime() - now.getTime()
}

/**
 * Format ISO date string to full display format
 * e.g., "Sunday, December 14, 2025"
 */
export function formatDateDisplay(iso: string): string {
  const date = new Date(iso + 'T00:00:00')
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Format ISO date string to short format
 * e.g., "Dec 14, 2025"
 */
export function formatShortDate(iso: string): string {
  const date = new Date(iso + 'T00:00:00')
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/**
 * Get predefined time ranges based on today's date
 */
export function getTimeRanges(todayISO: string): TimeRange[] {
  const today = new Date(todayISO + 'T00:00:00')

  // Last 7 days
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - 6)

  // Last 30 days
  const monthStart = new Date(today)
  monthStart.setDate(today.getDate() - 29)

  // Last 365 days
  const yearStart = new Date(today)
  yearStart.setDate(today.getDate() - 364)

  return [
    {
      type: 'week',
      startDate: toISODateString(weekStart),
      endDate: todayISO,
      label: 'Last 7 Days',
    },
    {
      type: 'month',
      startDate: toISODateString(monthStart),
      endDate: todayISO,
      label: 'Last 30 Days',
    },
    {
      type: 'year',
      startDate: toISODateString(yearStart),
      endDate: todayISO,
      label: 'Last Year',
    },
  ]
}

