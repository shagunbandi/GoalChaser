'use client'

import { ReactNode } from 'react'
import { MONTH_NAMES, WEEKDAY_LABELS } from '@/constants'

interface MonthInfo {
  month: number
  year: number
  days: Array<{ iso: string; dayOfMonth: number; weekdayIndex: number }>
}

interface MonthCardProps {
  month: MonthInfo
  todayISO: string
  headerRight?: ReactNode
  renderDay: (day: {
    iso: string
    dayOfMonth: number
    weekdayIndex: number
  }) => ReactNode
  footerContent?: ReactNode
}

export function MonthCard({
  month,
  todayISO,
  headerRight,
  renderDay,
  footerContent,
}: MonthCardProps) {
  const offset = month.days[0]?.weekdayIndex || 0
  const monthLabel = MONTH_NAMES[month.month - 1]

  return (
    <div className="rounded-2xl border border-white/8 bg-white/3 p-4 flex flex-col">
      {/* Month Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-semibold text-white/90">{monthLabel}</div>
        {headerRight}
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={`${month.month}-${label}`}
            className="text-[10px] text-center text-white/40"
          >
            {label}
          </div>
        ))}
      </div>

      {/* Calendar Grid - grows to fill space in row */}
      <div className="grid grid-cols-7 gap-1 flex-1 content-start">
        {Array.from({ length: offset }).map((_, index) => (
          <div key={`empty-${month.month}-${index}`} className="h-8" />
        ))}
        {month.days.map((day) => renderDay(day))}
      </div>

      {/* Footer Content */}
      {footerContent && (
        <div className="mt-3 pt-3 border-t border-white/10 min-h-[120px]">
          {footerContent}
        </div>
      )}
    </div>
  )
}
