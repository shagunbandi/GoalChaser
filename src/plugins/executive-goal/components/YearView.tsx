'use client'

import { useMemo, useState } from 'react'
import type { ExecutiveGoal, ExecutiveGoalInput, ExecutiveGoalTask } from '../types'
import type { ButtonConfig } from '@/types'
import type { YearViewConfig } from '@/types/year-view-config'
import { Modal } from '@/components/ui'
import { GenericYearView } from '@/components/features/year-view/GenericYearView'
import { ExecutiveGoalForm } from './ExecutiveGoalForm'
import { AddExecutiveGoalChat } from './AddExecutiveGoalChat'
import {
  computeMonthInfo,
  enumerateDateRange,
  formatShortDate,
  isWeekend,
} from '@/utils'
import {
  getCompletionBackgroundColor,
  createMultiGoalBorderStyle,
} from '../calendar-utils'

interface YearViewProps {
  year: number
  todayISO: string
  dayDetails: Record<string, any>
  onPrevYear: () => void
  onNextYear: () => void
  onAddExecutiveGoal: (executiveGoal: ExecutiveGoalInput) => void | Promise<void>
  onUpdateExecutiveGoal?: (executiveGoal: ExecutiveGoal) => void | Promise<void>
  onUpdateDay: (iso: string, updates: any) => Promise<void>
  onDeleteExecutiveGoal?: (executiveGoalId: string) => void | Promise<void>
  onJumpToDay?: (iso: string) => void
  onMonthClick?: (year: number, month: number) => void
  initialSelectedDay?: string | null
  allExecutiveGoals?: ExecutiveGoal[]
}

export function YearView({
  year,
  todayISO,
  dayDetails,
  onPrevYear,
  onNextYear,
  onAddExecutiveGoal,
  onUpdateExecutiveGoal,
  onUpdateDay,
  onDeleteExecutiveGoal,
  onJumpToDay,
  onMonthClick,
  initialSelectedDay,
  allExecutiveGoals,
}: YearViewProps) {
  const [showExecutiveGoalModal, setShowExecutiveGoalModal] = useState(false)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [editingExecutiveGoal, setEditingExecutiveGoal] = useState<ExecutiveGoal | null>(null)
  const [isSavingExecutiveGoal, setIsSavingExecutiveGoal] = useState(false)
  const [prefilledDates, setPrefilledDates] = useState<{
    startDate: string
    endDate: string
  } | null>(null)

  const yearPrefix = `${year}-`

  const months = useMemo(
    () =>
      Array.from({ length: 12 }, (_, index) =>
        computeMonthInfo(year, index + 1),
      ),
    [year],
  )

  const executiveGoalEntries = useMemo(() => {
    const entries = Object.entries(dayDetails).filter(
      ([iso, details]) =>
        iso.startsWith(yearPrefix) && (details.tasks?.length || 0) > 0,
    )
    return entries
  }, [dayDetails, yearPrefix])

  const weekdayExecutiveGoalCount = useMemo(
    () => executiveGoalEntries.filter(([iso]) => !isWeekend(iso)).length,
    [executiveGoalEntries],
  )

  const weekendExecutiveGoalCount = executiveGoalEntries.length - weekdayExecutiveGoalCount

  // Goals that overlap this month (from goal-level list)
  const getMonthExecutiveGoals = (year: number, month: number): ExecutiveGoal[] => {
    const monthStart = `${year}-${String(month).padStart(2, '0')}-01`
    const daysInMonth = new Date(year, month, 0).getDate()
    const monthEnd = `${year}-${String(month).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`
    return (allExecutiveGoals || []).filter(
      (g) => g.endDate >= monthStart && g.startDate <= monthEnd
    )
  }

  const handleSaveExecutiveGoal = async (formData: ExecutiveGoalInput) => {
    setIsSavingExecutiveGoal(true)
    try {
      if (editingExecutiveGoal) {
        await onUpdateExecutiveGoal?.({
          ...editingExecutiveGoal,
          ...formData,
        })
      } else {
        await onAddExecutiveGoal(formData)
      }
      setShowExecutiveGoalModal(false)
      setEditingExecutiveGoal(null)
    } finally {
      setIsSavingExecutiveGoal(false)
    }
  }

  const executiveGoalCountByMonth = useMemo(() => {
    const counts: Record<number, number> = {}
    executiveGoalEntries.forEach(([iso]) => {
      const month = Number(iso.slice(5, 7))
      counts[month] = (counts[month] || 0) + 1
    })
    return counts
  }, [executiveGoalEntries])

  const handleEditExecutiveGoal = (executiveGoal: ExecutiveGoal) => {
    setEditingExecutiveGoal(executiveGoal)
    setPrefilledDates(null)
    setShowExecutiveGoalModal(true)
  }

  const handleAddNewExecutiveGoal = () => {
    setEditingExecutiveGoal(null)
    setPrefilledDates(null)
    setShowExecutiveGoalModal(true)
  }

  const handleAddExecutiveGoalFromDay = (startDate: string) => {
    // Pre-fill dates without setting editingExecutiveGoal (so it's treated as new)
    setEditingExecutiveGoal(null)
    setPrefilledDates({ startDate, endDate: startDate })
    setSelectedDay(null) // Close the day modal
    setShowExecutiveGoalModal(true)
  }

  const handleCloseExecutiveGoalModal = () => {
    setShowExecutiveGoalModal(false)
    setEditingExecutiveGoal(null)
    setPrefilledDates(null)
  }

  const removeExecutiveGoalForDay = async (_iso: string, executiveGoalId: string) => {
    if (!onDeleteExecutiveGoal) return
    setIsUpdating(true)
    try {
      await onDeleteExecutiveGoal(executiveGoalId)
      setSelectedDay(null)
    } finally {
      setIsUpdating(false)
    }
  }

  const removeExecutiveGoalForTrip = async (executiveGoalId: string) => {
    if (!onDeleteExecutiveGoal) return
    setIsUpdating(true)
    try {
      await onDeleteExecutiveGoal(executiveGoalId)
      setSelectedDay(null)
    } finally {
      setIsUpdating(false)
    }
  }


  // Build year view configuration
  const config: YearViewConfig = useMemo(
    () => ({
      year,
      todayISO,
      header: undefined, // Header is rendered separately in ExecutiveGoalPage
      months: months.map((month) => {
        const monthExecutiveGoal = executiveGoalCountByMonth[month.month] || 0
        const monthExecutiveGoals = getMonthExecutiveGoals(year, month.month)

        return {
          month: month.month,
          year: month.year,
          onHeaderClick: () => onMonthClick?.(month.year, month.month), // Navigate to month view
          headerRight: (
            <div className="text-xs text-white/50">
              {monthExecutiveGoal} executiveGoal day{monthExecutiveGoal === 1 ? '' : 's'}
            </div>
          ),
          days: month.days.map((day) => {
            const tasksForDay: ExecutiveGoalTask[] = dayDetails[day.iso]?.tasks || []
            const goalsForDay = (allExecutiveGoals || []).filter(
              (g) => day.iso >= g.startDate && day.iso <= g.endDate
            )
            const completedTasks = tasksForDay.filter((t) => t.completed).length
            const totalTasks = tasksForDay.length
            const completionPercent = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
            const goalColors = goalsForDay.map((g) => g.color || '#8B5CF6')
            
            const dayConfig: any = {
              iso: day.iso,
              dayOfMonth: day.dayOfMonth,
              weekdayIndex: day.weekdayIndex,
              indicators: [],
            }
            if (goalsForDay.length > 0 && totalTasks > 0) {
              dayConfig.highlighted = true
              dayConfig.highlightColor = getCompletionBackgroundColor(completionPercent)
            }
            if (goalsForDay.length > 0) {
              dayConfig.style = createMultiGoalBorderStyle(goalColors)
            }
            
            return dayConfig
          }),
          footer: monthExecutiveGoals.map((executiveGoal) => ({
            id: executiveGoal.id,
            type: 'travel' as const,
            title: executiveGoal.title,
            subtitle: `${executiveGoal.plan ? `${executiveGoal.plan} • ` : ''}${formatShortDate(
              executiveGoal.startDate,
            )} → ${formatShortDate(executiveGoal.endDate)}`,
            color: executiveGoal.color,
            actionButton: {
              icon: '✏️',
              onClick: () => handleEditExecutiveGoal(executiveGoal),
            },
          })),
        }
      }),
      modal: {
        getSections: (date: string) => {
          const goalsForDay = (allExecutiveGoals || []).filter(
            (g) => date >= g.startDate && date <= g.endDate
          )
          const sections: any[] = []
          if (goalsForDay.length > 0) {
            sections.push({
              id: 'executiveGoal-goals',
              type: 'custom' as const,
              content: (
                <div className="space-y-3">
                  {goalsForDay.map((executiveGoal) => (
                    <div
                      key={executiveGoal.id}
                      className="rounded-xl border border-white/10 bg-white/5 p-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold text-white">
                          {executiveGoal.title}
                        </div>
                        <span
                          className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/15 text-sm"
                          style={{
                            backgroundColor: executiveGoal.color || 'rgba(14,165,233,0.25)',
                          }}
                        >
                          🎯
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-white/60">
                        {executiveGoal.plan && <span>{executiveGoal.plan} • </span>}
                        {formatShortDate(executiveGoal.startDate)} →{' '}
                        {formatShortDate(executiveGoal.endDate)}
                      </div>
                      {executiveGoal.note && (
                        <div className="mt-2 text-xs text-white/60">{executiveGoal.note}</div>
                      )}
                      <div className="mt-3 flex flex-wrap gap-2 text-xs">
                        <button
                          onClick={() => handleEditExecutiveGoal(executiveGoal)}
                          className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-white/80 hover:bg-white/10"
                        >
                          Edit goal
                        </button>
                        <button
                          onClick={() => removeExecutiveGoalForTrip(executiveGoal.id)}
                          disabled={isUpdating}
                          className="px-3 py-1.5 rounded-lg border border-red-500/30 bg-red-500/10 text-red-200 hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Delete goal
                        </button>
                      </div>
                    </div>
                  ))}
                  {isUpdating && <span className="text-white/50">Updating…</span>}
                </div>
              ),
            })
          }
          return sections
        },
        getActions: (date: string) => {
          const actions: ButtonConfig[] = [
            {
              id: 'add-executiveGoal',
              label: 'Add executiveGoal plan',
              icon: '🎯',
              onClick: () => handleAddExecutiveGoalFromDay(date),
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
        // Navigate directly to month view, don't open modal
        if (date && onJumpToDay) {
          onJumpToDay(date)
        }
      },
      showDayModal: false, // Don't show modal on day click, navigate to month view instead
      onPrevYear,
      onNextYear,
      onMonthClick,
    }),
    [
      year,
      todayISO,
      executiveGoalEntries.length,
      weekdayExecutiveGoalCount,
      weekendExecutiveGoalCount,
      months,
      executiveGoalCountByMonth,
      dayDetails,
      isUpdating,
      onPrevYear,
      onNextYear,
      onMonthClick,
      onJumpToDay,
    ],
  )

  return (
    <>
      <GenericYearView config={config} initialSelectedDay={initialSelectedDay} />


      <Modal
        open={showExecutiveGoalModal}
        title={editingExecutiveGoal ? 'Edit executive goal' : 'Add executive goal'}
        onClose={handleCloseExecutiveGoalModal}
      >
        {editingExecutiveGoal ? (
          <ExecutiveGoalForm
            initialData={editingExecutiveGoal}
            onSubmit={handleSaveExecutiveGoal}
            onCancel={handleCloseExecutiveGoalModal}
            isSubmitting={isSavingExecutiveGoal}
          />
        ) : (
          <AddExecutiveGoalChat
            onSubmit={handleSaveExecutiveGoal}
            onCancel={handleCloseExecutiveGoalModal}
            prefilledStartDate={prefilledDates?.startDate}
          />
        )}
      </Modal>
    </>
  )
}
