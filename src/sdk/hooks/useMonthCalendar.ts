/**
 * Hook to manage month calendar state and navigation
 */

import { useState, useMemo } from 'react'
import type { MonthInfo, DayInfo } from '@/types'

export interface UseMonthCalendarOptions {
  /** Initial year to display */
  initialYear?: number
  /** Initial month to display (1-12) */
  initialMonth?: number
  /** Initial selected date (ISO string) */
  initialSelectedDate?: string | null
  /** Callback when month changes */
  onMonthChange?: (year: number, month: number) => void
}

export interface UseMonthCalendarReturn {
  /** Current year */
  year: number
  /** Current month (1-12) */
  month: number
  /** Month information with all days */
  monthInfo: MonthInfo
  /** ISO string for today */
  todayISO: string
  /** Selected date (ISO string) */
  selectedDate: string | null
  /** Navigate to previous month */
  prevMonth: () => void
  /** Navigate to next month */
  nextMonth: () => void
  /** Navigate to specific month/year */
  goToMonth: (year: number, month: number) => void
  /** Set selected date */
  setSelectedDate: (iso: string | null) => void
  /** Get all dates in current month as ISO strings */
  getDateRange: () => string[]
}

export function useMonthCalendar({
  initialYear,
  initialMonth,
  initialSelectedDate,
  onMonthChange,
}: UseMonthCalendarOptions = {}): UseMonthCalendarReturn {
  const today = new Date()
  const [currentDate, setCurrentDate] = useState(() => {
    if (initialYear && initialMonth) {
      return new Date(initialYear, initialMonth - 1, 1)
    }
    return new Date(today.getFullYear(), today.getMonth(), 1)
  })
  const [selectedDate, setSelectedDate] = useState<string | null>(initialSelectedDate || null)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth() + 1

  const todayISO = useMemo(() => {
    return today.toISOString().split('T')[0]
  }, [])

  // Build monthInfo with all days
  const monthInfo: MonthInfo = useMemo(() => {
    const daysInMonth = new Date(year, month, 0).getDate()
    const days: DayInfo[] = []

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day)
      const iso = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      days.push({
        date,
        iso,
        dayOfMonth: day,
        weekdayIndex: (date.getDay() + 6) % 7, // Convert Sunday=0 to Monday=0
      })
    }

    return { year, month, days }
  }, [year, month])

  const prevMonth = () => {
    const newDate = new Date(year, month - 2, 1)
    setCurrentDate(newDate)
    const newYear = newDate.getFullYear()
    const newMonth = newDate.getMonth() + 1
    onMonthChange?.(newYear, newMonth)
  }

  const nextMonth = () => {
    const newDate = new Date(year, month, 1)
    setCurrentDate(newDate)
    const newYear = newDate.getFullYear()
    const newMonth = newDate.getMonth() + 1
    onMonthChange?.(newYear, newMonth)
  }

  const goToMonth = (targetYear: number, targetMonth: number) => {
    const newDate = new Date(targetYear, targetMonth - 1, 1)
    setCurrentDate(newDate)
    onMonthChange?.(targetYear, targetMonth)
  }

  const getDateRange = () => {
    return monthInfo.days.map((d) => d.iso)
  }

  return {
    year,
    month,
    monthInfo,
    todayISO,
    selectedDate,
    prevMonth,
    nextMonth,
    goToMonth,
    setSelectedDate,
    getDateRange,
  }
}
