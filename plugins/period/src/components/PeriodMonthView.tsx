'use client'

import { PluginMonthView } from '@goal-chaser/sdk'
import type { DayCustomization } from '@goal-chaser/sdk'
import type { PeriodDayData } from '../types'
import type { Plugin } from '@goal-chaser/sdk'

interface PeriodMonthViewProps {
  plugin: Plugin
  month: number
  year: number
  goalId: string
  todayISO: string
  dayData: Record<string, PeriodDayData>
  initialSelectedDate?: string | null
  onUpdateDay: (iso: string, updates: Partial<PeriodDayData>) => Promise<void>
  onBackToYear: () => void
}

// Colors for calendar - Rose theme
const PERIOD_COLOR = '#F43F5E' // Rose-500 for period days
const PERIOD_BG = 'rgba(244, 63, 94, 0.2)' // Rose with 20% opacity

export function PeriodMonthView({
  plugin,
  month,
  year,
  goalId,
  todayISO,
  dayData,
  initialSelectedDate,
  onUpdateDay,
  onBackToYear,
}: PeriodMonthViewProps) {
  // Build day customization based on period status
  const buildDayCustomization = (
    date: string,
    data: PeriodDayData | null
  ): DayCustomization | null => {
    if (!data?.isPeriod) {
      return null
    }

    return {
      backgroundColor: PERIOD_BG,
      borderColor: PERIOD_COLOR,
      indicators: [
        {
          id: 'period',
          label: 'Period Day',
          color: PERIOD_COLOR,
        },
      ],
    }
  }

  // Legend component for calendar footer
  const legendContent = (
    <div className="flex items-center gap-4 text-xs text-white/60">
      <span className="text-white/40">Legend:</span>
      <div className="flex items-center gap-1.5">
        <div 
          className="w-3 h-3 rounded-full" 
          style={{ backgroundColor: PERIOD_COLOR }}
        />
        <span>Period Day</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-3 h-3 rounded-full bg-white/20" />
        <span>Non-Period</span>
      </div>
    </div>
  )

  return (
    <PluginMonthView
      plugin={plugin}
      year={year}
      month={month}
      goalId={goalId}
      todayISO={todayISO}
      dayData={dayData}
      initialSelectedDate={initialSelectedDate}
      onUpdateDay={onUpdateDay}
      onBackToYear={onBackToYear}
      buildDayCustomization={buildDayCustomization}
      detailContext={{
        allData: dayData,
      }}
      footerContent={legendContent}
    />
  )
}
