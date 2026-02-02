'use client'

import { PluginMonthView } from '@/sdk'
import type { DayCustomization } from '@/sdk'
import { ExecutiveGoalPlugin } from '../plugin'
import type { ExecutiveGoalDayData, ExecutiveGoal, ExecutiveGoalInput } from '../types'
import { getExecutiveGoalDayCustomization } from '../calendar-utils'

interface ExecutiveGoalMonthViewProps {
  plugin: any
  month: number
  year: number
  goalId: string
  todayISO: string
  dayData: Record<string, ExecutiveGoalDayData>
  initialSelectedDate: string | null
  onUpdateDay: (iso: string, updates: Partial<ExecutiveGoalDayData>) => Promise<void>
  onBackToYear: () => void
  onEditExecutiveGoal?: (goal: ExecutiveGoal) => void | Promise<void>
  onDeleteExecutiveGoal?: (goalId: string) => void | Promise<void>
  onAddExecutiveGoal?: (goal: ExecutiveGoalInput) => void | Promise<void>
  allExecutiveGoals?: ExecutiveGoal[]
  userId?: string
  loadAllPlansForGoal?: () => Promise<ExecutiveGoal[]>
}

export function ExecutiveGoalMonthView({
  plugin,
  month,
  year,
  goalId,
  todayISO,
  dayData,
  initialSelectedDate,
  onUpdateDay,
  onBackToYear,
  onEditExecutiveGoal,
  onDeleteExecutiveGoal,
  onAddExecutiveGoal,
  allExecutiveGoals,
  userId,
  loadAllPlansForGoal,
}: ExecutiveGoalMonthViewProps) {
  // Build day customizations based on executive goal plans
  // Show borders for goals, background for task completion, and dots for tasks
  const buildDayCustomization = (
    date: string,
    data: ExecutiveGoalDayData | null,
  ): DayCustomization | null => {
    return getExecutiveGoalDayCustomization(date, data, true)
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
        onEditExecutiveGoal,
        onDeleteExecutiveGoal,
        onAddExecutiveGoal,
        allExecutiveGoals,
        userId,
        goalId,
        loadAllPlansForGoal,
      }}
    />
  )
}
