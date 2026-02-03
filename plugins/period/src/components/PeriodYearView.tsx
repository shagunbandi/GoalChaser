'use client'

import { useMemo } from 'react'
import type { PeriodDayData } from '../types'
import type { YearViewConfig } from '@goal-chaser/sdk'
import { GenericYearView } from '@goal-chaser/sdk'
import { computeMonthInfo } from '@goal-chaser/sdk'
import { countPeriodDays } from '../utils'

interface PeriodYearViewProps {
  year: number
  todayISO: string
  dayData: Record<string, PeriodDayData>
  onPrevYear: () => void
  onNextYear: () => void
  onJumpToDay?: (iso: string) => void
  onMonthClick?: (year: number, month: number) => void
  initialSelectedDay?: string | null
}

export function PeriodYearView({
  year,
  todayISO,
  dayData,
  onPrevYear,
  onNextYear,
  onJumpToDay,
  onMonthClick,
  initialSelectedDay,
}: PeriodYearViewProps) {
  const months = useMemo(
    () => Array.from({ length: 12 }, (_, i) => computeMonthInfo(year, i + 1)),
    [year]
  )

  // Calculate monthly stats
  const monthlyStats = useMemo(() => {
    const stats: Record<number, number> = {}

    months.forEach((month) => {
      const monthData = Object.fromEntries(
        Object.entries(dayData).filter(([date]) => {
          const [y, m] = date.split('-')
          return parseInt(y) === year && parseInt(m) === month.month
        })
      )
      stats[month.month] = countPeriodDays(monthData)
    })

    return stats
  }, [dayData, year, months])

  // Period day color (rose)
  const PERIOD_COLOR = 'rgba(244, 63, 94, 0.8)' // Rose-500

  const config: YearViewConfig = useMemo(
    () => ({
      year,
      todayISO,
      onDaySelect: (date: string | null) => {
        if (date && onJumpToDay) {
          onJumpToDay(date)
        }
      },
      showDayModal: false,
      hideMonthFooter: true,
      header: undefined,
      months: months.map((month) => {
        const periodDays = monthlyStats[month.month] || 0

        return {
          month: month.month,
          year: month.year,
          onHeaderClick: () => onMonthClick?.(month.year, month.month),
          headerRight: periodDays > 0 ? (
            <div className="text-xs text-red-400">
              {periodDays} day{periodDays === 1 ? '' : 's'}
            </div>
          ) : undefined,
          days: month.days.map((day) => {
            const isPeriod = dayData[day.iso]?.isPeriod
            return {
              iso: day.iso,
              dayOfMonth: day.dayOfMonth,
              weekdayIndex: day.weekdayIndex,
              highlighted: isPeriod === true,
              highlightColor: isPeriod ? PERIOD_COLOR : undefined,
              indicators: [],
            }
          }),
          footer: [],
        }
      }),
      modal: {
        getSections: () => [],
        getActions: () => [],
      },
      onPrevYear,
      onNextYear,
      onMonthClick,
    }),
    [
      year,
      todayISO,
      monthlyStats,
      months,
      dayData,
      onPrevYear,
      onNextYear,
      onJumpToDay,
      onMonthClick,
    ]
  )

  return (
    <GenericYearView
      config={config}
      initialSelectedDay={initialSelectedDay}
    />
  )
}
