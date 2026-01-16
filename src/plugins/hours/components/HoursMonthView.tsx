'use client'

import { PluginMonthView } from '@/sdk'
import type { DayCustomization } from '@/sdk'
import type { HeaderConfig } from '@/types/year-view-config'
import { HoursPlugin } from '../plugin'
import type { HoursDayData } from '../types'

interface HoursMonthViewProps {
  plugin: any
  month: number
  year: number
  goalId: string
  todayISO: string
  dayData: Record<string, HoursDayData>
  initialSelectedDate: string | null
  subjectConfigs: any[]
  maxHours: number
  onUpdateDay: (iso: string, updates: Partial<HoursDayData>) => Promise<void>
  onBackToYear: () => void
  onAddSubject: (name: string) => void
  onAddTopic: (subjectId: string, topic: string) => void
  onRemoveTopic: (subjectId: string, topic: string) => void
  onUpdateTopic: (subjectId: string, oldTopic: string, newTopic: string) => void
  onRemoveSubject: (id: string) => void
  onUpdateSubject: (id: string, name: string) => void
  onToggleHasTopics: (id: string) => void
  isTopicInUse: (subjectId: string, topic: string) => boolean
  headerConfig?: HeaderConfig
  onPrevYear?: () => void
  onNextYear?: () => void
}

export function HoursMonthView({
  plugin,
  month,
  year,
  goalId,
  todayISO,
  dayData,
  initialSelectedDate,
  subjectConfigs,
  maxHours,
  onUpdateDay,
  onBackToYear,
  onAddSubject,
  onAddTopic,
  onRemoveTopic,
  onUpdateTopic,
  onRemoveSubject,
  onUpdateSubject,
  onToggleHasTopics,
  isTopicInUse,
  headerConfig,
  onPrevYear,
  onNextYear,
}: HoursMonthViewProps) {
  // Build day customizations based on hours tracked
  const buildDayCustomization = (
    date: string,
    data: HoursDayData | null,
  ): DayCustomization | null => {
    if (!data) return null

    // Calculate total hours
    const totalHours =
      data.subjects?.reduce((sum, entry) => sum + (entry.hours || 0), 0) ||
      data.directHours ||
      0

    if (totalHours === 0) return null

    // Color based on hours: 0-4 (red), 4-8 (orange), 8+ (green)
    const getHoursColor = (hours: number) => {
      if (hours >= 8) return { bg: 'bg-green-500/20', color: '#00FF00' }
      if (hours >= 4) return { bg: 'bg-orange-500/20', color: '#FFA500' }
      return { bg: 'bg-red-500/20', color: '#FF6B6B' }
    }

    const { bg, color } = getHoursColor(totalHours)

    return {
      backgroundColor: bg,
      content: (
        <div className="text-[10px] text-white/60 mt-1">
          {totalHours.toFixed(1)}h
        </div>
      ),
      indicators: [
        {
          id: 'hours',
          label: `${totalHours.toFixed(1)} hours`,
          color,
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
      headerConfig={headerConfig}
      onPrevYear={onPrevYear}
      onNextYear={onNextYear}
      detailContext={{
        subjectConfigs,
        maxHours,
        onAddSubject,
        onAddTopic,
        onRemoveTopic,
        onUpdateTopic,
        onRemoveSubject,
        onUpdateSubject,
        onToggleHasTopics,
        isTopicInUse,
      }}
    />
  )
}
