'use client'

import { useMemo, useState } from 'react'
import { HeaderRenderer } from '@/components/features/year-view/renderers/HeaderRenderer'
import { SubjectManager } from './SubjectManager'
import type { StudyDayData, SubjectConfig, StreakType } from '../types'

interface StudyHeaderProps {
  year: number
  dayData: Record<string, StudyDayData>
  maxHours?: number
  subjectConfigs?: SubjectConfig[]
  onPrevYear: () => void
  onNextYear: () => void
  onAddSubject?: (name: string) => void
  onRemoveSubject?: (id: string) => void
  onUpdateSubject?: (id: string, name: string) => void
  onToggleHasTopics?: (id: string) => void
  onAddTopic?: (subjectId: string, topic: string) => void
  onRemoveTopic?: (subjectId: string, topic: string) => void
  onUpdateTopic?: (subjectId: string, oldTopic: string, newTopic: string) => void
  isTopicInUse?: (subjectId: string, topic: string) => boolean
  onUpdateSubjectGoal?: (subjectId: string, streakType: StreakType, targetFrequency?: number) => void
  onToggleTrackStreaks?: (subjectId: string) => void
}

export function StudyHeader({
  year,
  dayData,
  maxHours = 14,
  subjectConfigs = [],
  onPrevYear,
  onNextYear,
  onAddSubject,
  onRemoveSubject,
  onUpdateSubject,
  onToggleHasTopics,
  onAddTopic,
  onRemoveTopic,
  onUpdateTopic,
  isTopicInUse,
  onUpdateSubjectGoal,
  onToggleTrackStreaks,
}: StudyHeaderProps) {
  const [showSubjectManager, setShowSubjectManager] = useState(false)

  const headerConfig = useMemo(() => {
    const yearPrefix = `${year}-`
    const yearEntries = Object.entries(dayData).filter(([iso]) =>
      iso.startsWith(yearPrefix),
    )

    const yearStats = {
      daysWithHours: yearEntries.filter(([, data]) => {
        const hours =
          (data?.subjects?.reduce(
            (s: number, entry: any) => s + (entry.hours || 0),
            0,
          ) || 0) + (data?.directHours || 0)
        return hours > 0
      }).length,
      totalHours: yearEntries.reduce((sum, [, data]) => {
        return (
          sum +
          (data?.subjects?.reduce(
            (s: number, entry: any) => s + (entry.hours || 0),
            0,
          ) || 0) +
          (data?.directHours || 0)
        )
      }, 0),
    }

    const average =
      yearStats.daysWithHours > 0
        ? yearStats.totalHours / yearStats.daysWithHours
        : 0

    return {
      icon: '📚',
      title: `Study Year:`,
      stats: [
        { label: 'Total hours', value: Math.round(yearStats.totalHours) },
        { label: 'Days tracked', value: yearStats.daysWithHours },
        {
          label: 'Avg/day',
          value: average.toFixed(1) + 'h',
          color: '#5856D6',
        },
      ],
      legends: [
        { label: `Target: ${maxHours}h/day`, color: 'rgb(155, 89, 182)' },
        { label: 'Progress: VIBGYOR scale', color: 'rgb(52, 152, 219)' },
      ],
      actions: onAddSubject
        ? [
            {
              id: 'manage-subjects',
              label: 'Manage Subjects',
              icon: '⚙️',
              onClick: () => setShowSubjectManager(true),
            },
          ]
        : [],
    }
  }, [dayData, year, maxHours, onAddSubject])

  if (!headerConfig) return null

  return (
    <>
      <HeaderRenderer
        config={headerConfig}
        year={year}
        onPrevYear={onPrevYear}
        onNextYear={onNextYear}
      />

      {showSubjectManager && onAddSubject && (
        <SubjectManager
          isOpen={showSubjectManager}
          subjectConfigs={subjectConfigs}
          onAddSubject={onAddSubject}
          onRemoveSubject={onRemoveSubject!}
          onUpdateSubject={onUpdateSubject!}
          onToggleHasTopics={onToggleHasTopics!}
          onAddTopic={onAddTopic!}
          onRemoveTopic={onRemoveTopic!}
          onUpdateTopic={onUpdateTopic!}
          isTopicInUse={isTopicInUse!}
          onUpdateSubjectGoal={onUpdateSubjectGoal}
          onToggleTrackStreaks={onToggleTrackStreaks}
          onClose={() => setShowSubjectManager(false)}
        />
      )}
    </>
  )
}
