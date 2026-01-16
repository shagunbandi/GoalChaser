import { toISODateString } from './date-utils'

// Generic repeat types (not plugin-specific)
export type RepeatType = 'none' | 'daily' | 'weekly'

export const WEEKDAY_CODES = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
export const REPEAT_WINDOW_DAYS = 365

export function addDays(date: Date, days: number): Date {
  const copy = new Date(date)
  copy.setDate(copy.getDate() + days)
  return copy
}

export function generateRecurrenceDates(
  startISO: string,
  type: RepeatType,
  days: string[],
  endISO?: string,
): string[] {
  if (type === 'none') return [startISO]

  const startDate = new Date(`${startISO}T00:00:00`)
  const endDate = endISO ? new Date(`${endISO}T00:00:00`) : null
  const usedDays =
    type === 'daily'
      ? []
      : days.length > 0
      ? days
      : [WEEKDAY_CODES[startDate.getDay()]]

  const occurrences: string[] = []

  const maxIterations = endDate
    ? Math.max(
        1,
        Math.min(
          REPEAT_WINDOW_DAYS,
          Math.round(
            (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
          ) + 1,
        ),
      )
    : REPEAT_WINDOW_DAYS

  for (let i = 0; i < maxIterations; i++) {
    const date = addDays(startDate, i)
    if (endDate && date > endDate) break
    const iso = toISODateString(date)
    if (type === 'daily') {
      occurrences.push(iso)
      continue
    }
    const code = WEEKDAY_CODES[date.getDay()]
    if (usedDays.includes(code)) {
      occurrences.push(iso)
    }
  }

  return occurrences.length > 0 ? occurrences : [startISO]
}

export function getWeekdayCode(iso: string): string {
  const date = new Date(`${iso}T00:00:00`)
  return WEEKDAY_CODES[date.getDay()]
}

