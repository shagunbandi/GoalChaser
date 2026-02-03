'use client'

import { useMemo, useState } from 'react'
import { HeaderRenderer, isWeekend } from '@goal-chaser/sdk'
import { LanguageTutorManager } from './LanguageTutorManager'
import type {
  LanguageTutorDayData,
  LanguageLearning,
  LanguageLearningInput,
} from '../types'

interface LanguageTutorHeaderProps {
  year: number
  dayData: Record<string, LanguageTutorDayData>
  onPrevYear: () => void
  onNextYear: () => void
  onAddLearning?: (learning: LanguageLearningInput) => void | Promise<void>
  onUpdateLearning?: (learning: LanguageLearning) => void | Promise<void>
  onDeleteLearning?: (learningId: string) => void | Promise<void>
  allLearnings?: LanguageLearning[]
  userId?: string
  goalId?: string
}

export function LanguageTutorHeader({
  year,
  dayData,
  onPrevYear,
  onNextYear,
  onAddLearning,
  onUpdateLearning,
  onDeleteLearning,
  allLearnings,
  userId,
  goalId,
}: LanguageTutorHeaderProps) {
  const [showLearningManager, setShowLearningManager] = useState(false)

  const headerConfig = useMemo(() => {
    const yearPrefix = `${year}-`
    const learningEntries = Object.entries(dayData).filter(
      ([iso, details]) =>
        iso.startsWith(yearPrefix) && (details.teachingContent || details.qna),
    )
    const learningDays = learningEntries.length
    const weekdayCount = learningEntries.filter(
      ([iso]) => !isWeekend(iso),
    ).length
    const weekendCount = learningDays - weekdayCount

    // Calculate average quiz score for the year
    const quizDays = learningEntries.filter(([, data]) => data.qna?.score)
    const avgScore =
      quizDays.length > 0
        ? Math.round(
            quizDays.reduce(
              (sum, [, data]) => sum + (data.qna?.score?.percentage ?? 0),
              0,
            ) / quizDays.length,
          )
        : 0

    return {
      icon: '🎓',
      title: `Language Learning Year:`,
      stats: [
        { label: 'Learning days', value: learningDays },
        { label: 'Weekdays', value: weekdayCount },
        { label: 'Weekends', value: weekendCount },
        ...(avgScore > 0
          ? [{ label: 'Avg Score', value: `${avgScore}%` }]
          : []),
      ],
      legends: [
        { color: '#22C55E', label: 'Excellent (80%+)' },
        { color: '#FBBF24', label: 'Good (60-79%)' },
        { color: '#EF4444', label: 'Needs Review (<60%)' },
        { color: '#8B5CF6', label: 'In Progress' },
      ],
      actions: onAddLearning
        ? [
            {
              id: 'manage-learning',
              label: 'Manage Learnings',
              icon: '⚙️',
              onClick: () => setShowLearningManager(true),
            },
          ]
        : [],
    }
  }, [dayData, year, onAddLearning])

  if (!headerConfig) return null

  return (
    <>
      <HeaderRenderer
        config={headerConfig}
        year={year}
        onPrevYear={onPrevYear}
        onNextYear={onNextYear}
      />

      {showLearningManager &&
        onAddLearning &&
        onUpdateLearning &&
        onDeleteLearning && (
          <LanguageTutorManager
            isOpen={showLearningManager}
            dayData={dayData}
            onAddLearning={onAddLearning}
            onUpdateLearning={onUpdateLearning}
            onDeleteLearning={onDeleteLearning}
            onClose={() => setShowLearningManager(false)}
            allLearnings={allLearnings}
            userId={userId}
            goalId={goalId}
          />
        )}
    </>
  )
}
