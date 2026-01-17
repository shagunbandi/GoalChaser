'use client'

import { PluginMonthView } from '@/sdk'
import type { DayCustomization } from '@/sdk'
import { TravelPlugin } from '../plugin'
import type { TravelDayData } from '../types'

interface TravelMonthViewProps {
  plugin: any
  month: number
  year: number
  goalId: string
  todayISO: string
  dayData: Record<string, TravelDayData>
  initialSelectedDate: string | null
  onUpdateDay: (iso: string, updates: Partial<TravelDayData>) => Promise<void>
  onBackToYear: () => void
}

export function TravelMonthView({
  plugin,
  month,
  year,
  goalId,
  todayISO,
  dayData,
  initialSelectedDate,
  onUpdateDay,
  onBackToYear,
}: TravelMonthViewProps) {
  // Build day customizations based on travel plans
  const buildDayCustomization = (
    date: string,
    data: TravelDayData | null,
  ): DayCustomization | null => {
    if (!data || !data.travelPlans || data.travelPlans.length === 0) return null

    const travelCount = data.travelPlans.length

    return {
      backgroundColor: 'bg-blue-500/20',
      content: (
        <div className="hidden md:block text-[10px] text-white/60 mt-1">
          {travelCount} {travelCount === 1 ? 'trip' : 'trips'}
        </div>
      ),
      indicators: [
        {
          id: 'travel',
          label: `${travelCount} travel plan${travelCount !== 1 ? 's' : ''}`,
          color: '#007AFF',
        },
      ],
    }
  }

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
    />
  )
}
