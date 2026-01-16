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

    // Use VIBGYOR color based on progress (same as progress bar)
    const { getVibgyorColors } = require('@/utils')
    const vibgyorColors = getVibgyorColors()
    
    const ratio = Math.min(totalHours / maxHours, 1)
    const colorIndex = Math.min(
      Math.floor(ratio * vibgyorColors.length),
      vibgyorColors.length - 1
    )
    const color = vibgyorColors[colorIndex].color

    // Format hours
    const formatHours = (hours: number) => {
      const totalMinutes = Math.round(hours * 60)
      const h = Math.floor(totalMinutes / 60)
      const m = totalMinutes % 60
      if (m === 0) return `${h}h`
      return `${h}h ${m}m`
    }

    return {
      backgroundColor: `${color}20`, // Use color with opacity (hex format)
      content: (
        <div className="text-[10px] text-white/90 mt-1 font-medium">
          {formatHours(totalHours)}
        </div>
      ),
      indicators: [], // Remove dots since we're filling the background
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
