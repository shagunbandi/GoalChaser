'use client'

import { PluginMonthView } from '@/sdk'
import type { DayCustomization } from '@/sdk'
import { TravelPlugin } from '../plugin'
import type { TravelDayData, TravelPlan } from '../types'

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
  onEditTravel?: (travel: TravelPlan) => void | Promise<void>
  onDeleteTravel?: (travelId: string) => void | Promise<void>
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
  onEditTravel,
  onDeleteTravel,
}: TravelMonthViewProps) {
  // Build day customizations based on travel plans
  const buildDayCustomization = (
    date: string,
    data: TravelDayData | null,
  ): DayCustomization | null => {
    if (!data || !data.travelPlans || data.travelPlans.length === 0) return null

    // Show one dot per travel plan with its color
    const indicators = data.travelPlans.map((plan, index) => ({
      id: `travel-${index}`,
      label: plan.title || 'Travel',
      color: plan.color || '#007AFF',
    }))

    return {
      backgroundColor: 'bg-blue-500/20',
      indicators,
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
      detailContext={{
        onEditTravel,
        onDeleteTravel,
      }}
    />
  )
}
