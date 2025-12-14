'use client'

import type { DayStatus, MonthInfo } from '@/types'
import { Card } from '@/components/ui/Card'
import { getScoreColorClass } from '@/lib/scoreUtils'
import { WEEKDAY_LABELS, MONTH_NAMES } from '@/constants'

interface CalendarProps {
  currentYear: number
  currentMonth: number
  monthInfo: MonthInfo
  dayStatuses: Record<string, DayStatus>
  selectedDate: string
  todayISO: string
  onPrevMonth: () => void
  onNextMonth: () => void
  onDayClick: (iso: string) => void
  noCard?: boolean
}

export function Calendar({
  currentYear,
  currentMonth,
  monthInfo,
  dayStatuses,
  selectedDate,
  todayISO,
  onPrevMonth,
  onNextMonth,
  onDayClick,
  noCard = false,
}: CalendarProps) {
  const firstDayWeekdayIndex = monthInfo.days[0]?.weekdayIndex || 0
  const emptyCells = Array(firstDayWeekdayIndex).fill(null)

  const getDayClasses = (
    status: DayStatus,
    isToday: boolean,
    isSelected: boolean
  ): string => {
    const bg = getScoreColorClass(status)
    const todayRing = isToday ? 'ring-2 ring-cyan-400 ring-offset-1' : ''
    const selectedRing = isSelected
      ? 'ring-2 ring-violet-400 ring-offset-2 ring-offset-slate-900'
      : ''
    return `${bg} ${todayRing} ${selectedRing} aspect-square rounded-lg cursor-pointer hover:shadow-lg hover:scale-[1.03] transition-all duration-150 flex flex-col items-start justify-start p-2`
  }

  const content = (
    <>
      {/* Month Navigation Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4 gap-2">
        <button
          onClick={onPrevMonth}
          className="px-2 sm:px-3 py-1.5 bg-white/10 hover:bg-white/20 text-slate-200 rounded-lg font-medium text-xs sm:text-sm transition-all duration-200 hover:scale-105 shrink-0"
        >
          ←
        </button>
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg sm:text-xl">📅</span>
          <h2 className="text-base sm:text-lg font-bold text-white uppercase tracking-wide truncate">
            {MONTH_NAMES[currentMonth - 1]} {currentYear}
          </h2>
        </div>
        <button
          onClick={onNextMonth}
          className="px-2 sm:px-3 py-1.5 bg-white/10 hover:bg-white/20 text-slate-200 rounded-lg font-medium text-xs sm:text-sm transition-all duration-200 hover:scale-105 shrink-0"
        >
          →
        </button>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 gap-2 mb-3">
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className="text-center text-xs font-semibold text-slate-400 uppercase tracking-wider py-2"
          >
            {label}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-2">
        {emptyCells.map((_, index) => (
          <div key={`empty-${index}`} className="aspect-square" />
        ))}
        {monthInfo.days.map((day) => {
          const status = dayStatuses[day.iso] || null
          const isToday = day.iso === todayISO
          const isSelected = day.iso === selectedDate
          return (
            <div
              key={day.iso}
              onClick={() => onDayClick(day.iso)}
              className={getDayClasses(status, isToday, isSelected)}
            >
              <span className="text-sm font-semibold">{day.dayOfMonth}</span>
            </div>
          )
        })}
      </div>
    </>
  )

  if (noCard) {
    return <div className="p-5">{content}</div>
  }

  return <Card className="p-5">{content}</Card>
}

