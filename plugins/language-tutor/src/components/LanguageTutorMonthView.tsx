'use client'

import { PluginMonthView } from '@goal-chaser/sdk'
import type { DayCustomization } from '@goal-chaser/sdk'
import { LanguageTutorPlugin } from '../plugin'
import type {
  LanguageTutorDayData,
  LanguageLearning,
  LanguageLearningInput,
} from '../types'
import { getLanguageTutorDayCustomization } from '../calendar-utils'

interface LanguageTutorMonthViewProps {
  plugin: any
  month: number
  year: number
  goalId: string
  todayISO: string
  dayData: Record<string, LanguageTutorDayData>
  initialSelectedDate: string | null
  onUpdateDay: (
    iso: string,
    updates: Partial<LanguageTutorDayData>,
  ) => Promise<void>
  onBackToYear: () => void
  onEditLearning?: (learning: LanguageLearning) => void | Promise<void>
  onDeleteLearning?: (learningId: string) => void | Promise<void>
  onAddLearning?: (learning: LanguageLearningInput) => void | Promise<void>
  allLearnings?: LanguageLearning[]
  userId?: string
  loadAllLearnings?: () => Promise<LanguageLearning[]>
}

export function LanguageTutorMonthView({
  plugin,
  month,
  year,
  goalId,
  todayISO,
  dayData,
  initialSelectedDate,
  onUpdateDay,
  onBackToYear,
  onEditLearning,
  onDeleteLearning,
  onAddLearning,
  allLearnings,
  userId,
  loadAllLearnings,
}: LanguageTutorMonthViewProps) {
  // Build day customizations based on learning data
  const buildDayCustomization = (
    date: string,
    data: LanguageTutorDayData | null,
  ): DayCustomization | null => {
    return getLanguageTutorDayCustomization(date, data, true)
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
        onEditLearning,
        onDeleteLearning,
        onAddLearning,
        allLearnings,
        userId,
        goalId,
        loadAllLearnings,
      }}
    />
  )
}
