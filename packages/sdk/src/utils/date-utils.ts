import type { MonthInfo, DayInfo } from '../types'

export function toISODateString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

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

export function getPreviousMonth(
  year: number,
  month: number
): { year: number; month: number } {
  if (month === 1) return { year: year - 1, month: 12 }
  return { year, month: month - 1 }
}

export function getNextMonth(
  year: number,
  month: number
): { year: number; month: number } {
  if (month === 12) return { year: year + 1, month: 1 }
  return { year, month: month + 1 }
}

export function enumerateDateRange(startISO: string, endISO: string): string[] {
  const startDate = new Date(`${startISO}T00:00:00`)
  const endDate = new Date(`${endISO}T00:00:00`)

  const [from, to] =
    startDate.getTime() <= endDate.getTime()
      ? [startDate, endDate]
      : [endDate, startDate]

  const dates: string[] = []
  const cursor = new Date(from)

  while (cursor.getTime() <= to.getTime()) {
    dates.push(toISODateString(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }

  return dates
}

export function isWeekend(iso: string): boolean {
  const day = new Date(`${iso}T00:00:00`).getDay()
  return day === 0 || day === 6
}

export function formatDateDisplay(iso: string): string {
  const date = new Date(iso + 'T00:00:00')
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function formatShortDate(iso: string): string {
  const date = new Date(iso + 'T00:00:00')
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
