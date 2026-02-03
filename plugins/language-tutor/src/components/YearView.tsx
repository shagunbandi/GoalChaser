'use client'

import { useMemo, useState } from 'react'
import type {
  LanguageLearning,
  LanguageLearningInput,
  LanguageTutorDayData,
} from '../types'
import type { YearViewConfig } from '@goal-chaser/sdk'
import {
  Modal,
  GenericYearView,
  computeMonthInfo,
  formatShortDate,
  isWeekend,
} from '@goal-chaser/sdk'
import { LanguageTutorForm } from './LanguageTutorForm'
import { AddLanguageTutorChat } from './AddLanguageTutorChat'
import { getLanguageTutorDayCustomization } from '../calendar-utils'

interface YearViewProps {
  year: number
  todayISO: string
  dayDetails: Record<string, LanguageTutorDayData>
  onPrevYear: () => void
  onNextYear: () => void
  onAddLearning: (learning: LanguageLearningInput) => void | Promise<void>
  onUpdateLearning?: (learning: LanguageLearning) => void | Promise<void>
  onUpdateDay: (iso: string, updates: any) => Promise<void>
  onDeleteLearning?: (learningId: string) => void | Promise<void>
  onJumpToDay?: (iso: string) => void
  onMonthClick?: (year: number, month: number) => void
  initialSelectedDay?: string | null
  allLearnings?: LanguageLearning[]
}

export function YearView({
  year,
  todayISO,
  dayDetails,
  onPrevYear,
  onNextYear,
  onAddLearning,
  onUpdateLearning,
  onUpdateDay,
  onDeleteLearning,
  onJumpToDay,
  onMonthClick,
  initialSelectedDay,
  allLearnings,
}: YearViewProps) {
  const [showLearningModal, setShowLearningModal] = useState(false)
  const [editingLearning, setEditingLearning] =
    useState<LanguageLearning | null>(null)
  const [isSavingLearning, setIsSavingLearning] = useState(false)
  const [prefilledStartDate, setPrefilledStartDate] = useState<string | null>(
    null,
  )

  const yearPrefix = `${year}-`

  const months = useMemo(
    () =>
      Array.from({ length: 12 }, (_, index) =>
        computeMonthInfo(year, index + 1),
      ),
    [year],
  )

  const learningEntries = useMemo(() => {
    return Object.entries(dayDetails).filter(
      ([iso, details]) =>
        iso.startsWith(yearPrefix) && (details.teachingContent || details.qna),
    )
  }, [dayDetails, yearPrefix])

  const weekdayLearningCount = useMemo(
    () => learningEntries.filter(([iso]) => !isWeekend(iso)).length,
    [learningEntries],
  )

  const weekendLearningCount = learningEntries.length - weekdayLearningCount

  const getMonthLearnings = (
    year: number,
    month: number,
  ): LanguageLearning[] => {
    const monthStart = `${year}-${String(month).padStart(2, '0')}-01`
    const daysInMonth = new Date(year, month, 0).getDate()
    const monthEnd = `${year}-${String(month).padStart(2, '0')}-${String(
      daysInMonth,
    ).padStart(2, '0')}`
    return (allLearnings || []).filter(
      (l) => l.endDate >= monthStart && l.startDate <= monthEnd,
    )
  }

  const handleSaveLearning = async (formData: LanguageLearningInput) => {
    setIsSavingLearning(true)
    try {
      if (editingLearning) {
        await onUpdateLearning?.({ ...editingLearning, ...formData })
      } else {
        await onAddLearning(formData)
      }
      setShowLearningModal(false)
      setEditingLearning(null)
      setPrefilledStartDate(null)
    } finally {
      setIsSavingLearning(false)
    }
  }

  const learningCountByMonth = useMemo(() => {
    const counts: Record<number, number> = {}
    learningEntries.forEach(([iso]) => {
      const month = Number(iso.slice(5, 7))
      counts[month] = (counts[month] || 0) + 1
    })
    return counts
  }, [learningEntries])

  const handleEditLearning = (learning: LanguageLearning) => {
    setEditingLearning(learning)
    setPrefilledStartDate(null)
    setShowLearningModal(true)
  }

  const handleAddNewLearning = () => {
    setEditingLearning(null)
    setPrefilledStartDate(null)
    setShowLearningModal(true)
  }

  const handleAddLearningFromDay = (startDate: string) => {
    setEditingLearning(null)
    setPrefilledStartDate(startDate)
    setShowLearningModal(true)
  }

  const handleCloseLearningModal = () => {
    setShowLearningModal(false)
    setEditingLearning(null)
    setPrefilledStartDate(null)
  }

  const config: YearViewConfig = useMemo(
    () => ({
      year,
      todayISO,
      header: undefined,
      months: months.map((month) => {
        const monthLearning = learningCountByMonth[month.month] || 0
        const monthLearnings = getMonthLearnings(year, month.month)

        return {
          month: month.month,
          year: month.year,
          onHeaderClick: () => onMonthClick?.(month.year, month.month),
          headerRight: (
            <div className="text-xs text-white/50">
              {monthLearning} learning day{monthLearning === 1 ? '' : 's'}
            </div>
          ),
          days: month.days.map((day) => {
            const dayData: LanguageTutorDayData | null =
              dayDetails[day.iso] || null
            const learningsForDay = (allLearnings || []).filter(
              (l) => day.iso >= l.startDate && day.iso <= l.endDate,
            )

            const customization = getLanguageTutorDayCustomization(
              day.iso,
              dayData,
              true,
            )

            return {
              iso: day.iso,
              dayOfMonth: day.dayOfMonth,
              weekdayIndex: day.weekdayIndex,
              indicators: customization?.dots || [],
              highlighted: !!customization?.backgroundColor,
              highlightColor: customization?.backgroundColor,
              style: customization?.style,
            }
          }),
          footer: monthLearnings.map((learning) => ({
            id: learning.id,
            type: 'learning',
            title: learning.targetLanguage,
            subtitle: `${
              learning.metadata.proficiencyLevel
            } • ${formatShortDate(learning.startDate)} → ${formatShortDate(
              learning.endDate,
            )}`,
            icon: '🎓',
            color: learning.color || '#8B5CF6',
            actionButton: {
              icon: '✏️',
              onClick: () => handleEditLearning(learning),
            },
          })),
        }
      }),
      modal: {
        getSections: (date: string) => {
          const learningsForDay = (allLearnings || []).filter(
            (l) => date >= l.startDate && date <= l.endDate,
          )
          const sections: any[] = []
          if (learningsForDay.length > 0) {
            sections.push({
              id: 'learnings',
              type: 'custom' as const,
              content: (
                <div className="space-y-3">
                  {learningsForDay.map((learning) => (
                    <div
                      key={learning.id}
                      className="rounded-xl border border-white/10 bg-white/5 p-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold text-white">
                          {learning.targetLanguage}
                        </div>
                        <span
                          className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/15 text-sm"
                          style={{
                            backgroundColor:
                              learning.color || 'rgba(139,92,246,0.25)',
                          }}
                        >
                          🎓
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-white/60">
                        {learning.metadata.proficiencyLevel} •{' '}
                        {formatShortDate(learning.startDate)} →{' '}
                        {formatShortDate(learning.endDate)}
                      </div>
                      {learning.objectives && (
                        <div className="mt-2 text-xs text-white/60">
                          {learning.objectives}
                        </div>
                      )}
                      <div className="mt-3 flex flex-wrap gap-2 text-xs">
                        <button
                          onClick={() => handleEditLearning(learning)}
                          className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-white/80 hover:bg-white/10"
                        >
                          Edit learning
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ),
            })
          }
          return sections
        },
        getActions: (date: string) => {
          const actions: any[] = [
            {
              id: 'add-learning',
              label: 'Add learning',
              icon: '🎓',
              onClick: () => handleAddLearningFromDay(date),
              color: 'info',
            },
          ]

          if (onJumpToDay) {
            actions.push({
              id: 'open-day',
              label: 'Open day view',
              onClick: () => onJumpToDay(date),
              color: 'secondary',
            })
          }

          return actions
        },
      },
      onDaySelect: (date: string | null) => {
        if (date && onJumpToDay) {
          onJumpToDay(date)
        }
      },
      showDayModal: false,
      onPrevYear,
      onNextYear,
      onMonthClick,
    }),
    [
      year,
      todayISO,
      months,
      learningCountByMonth,
      dayDetails,
      allLearnings,
      onPrevYear,
      onNextYear,
      onMonthClick,
      onJumpToDay,
    ],
  )

  return (
    <>
      <GenericYearView
        config={config}
        initialSelectedDay={initialSelectedDay}
      />

      <Modal
        open={showLearningModal}
        title={editingLearning ? 'Edit Learning' : 'Add Learning'}
        onClose={handleCloseLearningModal}
      >
        {editingLearning ? (
          <LanguageTutorForm
            initialData={editingLearning}
            onSubmit={handleSaveLearning}
            onCancel={handleCloseLearningModal}
            isSubmitting={isSavingLearning}
          />
        ) : (
          <AddLanguageTutorChat
            onSubmit={handleSaveLearning}
            onCancel={handleCloseLearningModal}
            prefilledStartDate={prefilledStartDate || undefined}
          />
        )}
      </Modal>
    </>
  )
}
