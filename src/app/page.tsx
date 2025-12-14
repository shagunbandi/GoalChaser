'use client'

import { useState, useMemo } from 'react'

// ============ Types ============
export type DayStatus = 'RED' | 'YELLOW' | 'GREEN' | null

interface DayInfo {
  date: Date
  iso: string
  dayOfMonth: number
  weekdayIndex: number // 0 = Monday, 6 = Sunday
}

interface MonthInfo {
  year: number
  month: number // 1–12
  days: DayInfo[]
}

// ============ Helper Functions ============

// Helper to get ISO string "YYYY-MM-DD"
function toISODateString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Helper to compute MonthInfo
function computeMonthInfo(year: number, month: number): MonthInfo {
  const days: DayInfo[] = []

  // Get number of days in the month
  const daysInMonth = new Date(year, month, 0).getDate()

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day)
    const jsWeekday = date.getDay() // 0 = Sunday, 6 = Saturday
    // Convert to Monday = 0, Sunday = 6
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

// Helper to cycle status
function nextStatus(current: DayStatus): DayStatus {
  if (current === null) return 'RED'
  if (current === 'RED') return 'YELLOW'
  if (current === 'YELLOW') return 'GREEN'
  return null
}

// Helper to get previous month
function getPreviousMonth(
  year: number,
  month: number,
): { year: number; month: number } {
  if (month === 1) {
    return { year: year - 1, month: 12 }
  }
  return { year, month: month - 1 }
}

// Helper to get next month
function getNextMonth(
  year: number,
  month: number,
): { year: number; month: number } {
  if (month === 12) {
    return { year: year + 1, month: 1 }
  }
  return { year, month: month + 1 }
}

// ============ Constants ============
const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

// ============ Main Component ============
export default function Home() {
  const today = useMemo(() => new Date(), [])
  const todayISO = useMemo(() => toISODateString(today), [today])

  const [currentYear, setCurrentYear] = useState(() => today.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(() => today.getMonth() + 1) // 1-12

  const [dayStatuses, setDayStatuses] = useState<Record<string, DayStatus>>({})

  // Compute months data with useMemo - recomputes only when year/month changes
  // We compute current, previous, and next months for instant navigation
  const { currentMonthInfo, prevMonthInfo, nextMonthInfo } = useMemo(() => {
    const prev = getPreviousMonth(currentYear, currentMonth)
    const next = getNextMonth(currentYear, currentMonth)

    return {
      currentMonthInfo: computeMonthInfo(currentYear, currentMonth),
      prevMonthInfo: computeMonthInfo(prev.year, prev.month),
      nextMonthInfo: computeMonthInfo(next.year, next.month),
    }
  }, [currentYear, currentMonth])

  // Keep prev/next in scope but they're precomputed for instant navigation
  void prevMonthInfo
  void nextMonthInfo

  // Navigation handlers
  const goToPreviousMonth = () => {
    const prev = getPreviousMonth(currentYear, currentMonth)
    setCurrentYear(prev.year)
    setCurrentMonth(prev.month)
  }

  const goToNextMonth = () => {
    const next = getNextMonth(currentYear, currentMonth)
    setCurrentYear(next.year)
    setCurrentMonth(next.month)
  }

  // Handle day click
  const handleDayClick = (iso: string) => {
    setDayStatuses((prev) => ({
      ...prev,
      [iso]: nextStatus(prev[iso] || null),
    }))
  }

  // Get background classes for a day
  const getDayClasses = (status: DayStatus, isToday: boolean): string => {
    let bg = ''

    switch (status) {
      case 'RED':
        bg = 'bg-red-500 text-white'
        break
      case 'YELLOW':
        bg = 'bg-yellow-400 text-slate-900'
        break
      case 'GREEN':
        bg = 'bg-green-500 text-white'
        break
      default:
        bg = 'bg-white text-slate-900 border border-slate-200'
    }

    const todayRing = isToday ? 'ring-2 ring-sky-400 ring-offset-1' : ''

    return `${bg} ${todayRing} aspect-square rounded-lg cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all duration-150 flex flex-col items-start justify-start p-2`
  }

  // Calculate empty cells at the start
  const firstDayWeekdayIndex = currentMonthInfo.days[0]?.weekdayIndex || 0
  const emptyCells = Array(firstDayWeekdayIndex).fill(null)

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-slate-800 mb-2">
              Goal Chaser
            </h1>
            <p className="text-slate-500">
              Tap days to mark them Red, Yellow, Green
            </p>
          </div>

          {/* Month Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={goToPreviousMonth}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
            >
              ← Previous
            </button>

            <h2 className="text-xl font-semibold text-slate-800">
              {MONTH_NAMES[currentMonth - 1]} {currentYear}
            </h2>

            <button
              onClick={goToNextMonth}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
            >
              Next →
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {WEEKDAY_LABELS.map((label) => (
              <div
                key={label}
                className="text-center text-sm font-medium text-slate-500 py-2"
              >
                {label}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Empty cells for alignment */}
            {emptyCells.map((_, index) => (
              <div key={`empty-${index}`} className="aspect-square" />
            ))}

            {/* Day cells */}
            {currentMonthInfo.days.map((day) => {
              const status = dayStatuses[day.iso] || null
              const isToday = day.iso === todayISO

              return (
                <div
                  key={day.iso}
                  onClick={() => handleDayClick(day.iso)}
                  className={getDayClasses(status, isToday)}
                >
                  <span className="text-sm font-medium">{day.dayOfMonth}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
          <div className="flex flex-wrap items-center justify-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-500" />
              <span className="text-sm text-slate-600">
                Red = bad / unproductive
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-yellow-400" />
              <span className="text-sm text-slate-600">Yellow = okay</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500" />
              <span className="text-sm text-slate-600">
                Green = good / productive
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
