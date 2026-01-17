'use client'

import { PluginMonthView } from '@/sdk'
import type { DayCustomization } from '@/sdk'
import type { StudyDayData } from '../types'

interface StudyMonthViewProps {
  plugin: any
  month: number
  year: number
  goalId: string
  todayISO: string
  dayData: Record<string, StudyDayData>
  initialSelectedDate: string | null
  subjectConfigs: any[]
  maxHours: number
  onUpdateDay: (iso: string, updates: Partial<StudyDayData>) => Promise<void>
  onBackToYear: () => void
  onAddSubject: (name: string) => void
  onAddTopic: (subjectId: string, topic: string) => void
  onRemoveTopic: (subjectId: string, topic: string) => void
  onUpdateTopic: (subjectId: string, oldTopic: string, newTopic: string) => void
  onRemoveSubject: (id: string) => void
  onUpdateSubject: (id: string, name: string) => void
  onToggleHasTopics: (id: string) => void
  isTopicInUse: (subjectId: string, topic: string) => boolean
}

export function StudyMonthView({
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
}: StudyMonthViewProps) {
  // Build day customizations based on hours tracked
  const buildDayCustomization = (
    date: string,
    data: StudyDayData | null,
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
      backgroundColor: `${color}CC`, // 80% opacity (CC in hex)
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
