'use client'

import { useMemo, useState } from 'react'
import type { ExecutiveGoalPlan, ExecutiveGoalPlanInput } from '../types'
import type { ButtonConfig } from '@/types'
import type { YearViewConfig } from '@/types/year-view-config'
import { Modal } from '@/components/ui'
import { GenericYearView } from '@/components/features/year-view/GenericYearView'
import { ExecutiveGoalForm } from './ExecutiveGoalForm'
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
  onAddExecutiveGoal: (executiveGoal: ExecutiveGoalPlanInput) => void | Promise<void>
  onUpdateDay: (iso: string, updates: any) => Promise<void>
  onDeleteExecutiveGoal?: (executiveGoalId: string) => void | Promise<void>
  onJumpToDay?: (iso: string) => void
  onMonthClick?: (year: number, month: number) => void
  initialSelectedDay?: string | null
  allExecutiveGoals?: ExecutiveGoalPlan[]
}

export function YearView({
  year,
  todayISO,
  dayDetails,
  onPrevYear,
  onNextYear,
  onAddExecutiveGoal,
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
  const [editingExecutiveGoal, setEditingExecutiveGoal] = useState<ExecutiveGoalPlan | null>(null)
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
        iso.startsWith(yearPrefix) && (details.executiveGoalPlans?.length || 0) > 0,
    )

    return entries
  }, [dayDetails, yearPrefix])

  const weekdayExecutiveGoalCount = useMemo(
    () => executiveGoalEntries.filter(([iso]) => !isWeekend(iso)).length,
    [executiveGoalEntries],
  )

  const weekendExecutiveGoalCount = executiveGoalEntries.length - weekdayExecutiveGoalCount

  // Get executiveGoal plans for a specific month (goals only, no tasks)
  const getMonthExecutiveGoals = (year: number, month: number) => {
    const monthStart = `${year}-${String(month).padStart(2, '0')}-01`
    const daysInMonth = new Date(year, month, 0).getDate()
    const monthEnd = `${year}-${String(month).padStart(2, '0')}-${String(
      daysInMonth,
    ).padStart(2, '0')}`

    // Get unique executiveGoal plans that have at least one day in this month
    // Filter out tasks (those with parentExecutiveGoalId)
    const monthExecutiveGoalMap = new Map<string, ExecutiveGoalPlan>()

    Object.entries(dayDetails).forEach(([iso, details]) => {
      if (iso >= monthStart && iso <= monthEnd) {
        const executiveGoals = details.executiveGoalPlans || []
        // Only include goals (not tasks)
        executiveGoals.forEach((executiveGoal: any) => {
          if (!executiveGoal.parentExecutiveGoalId && !monthExecutiveGoalMap.has(executiveGoal.id)) {
            monthExecutiveGoalMap.set(executiveGoal.id, executiveGoal)
          }
        })
      }
    })

    return Array.from(monthExecutiveGoalMap.values())
  }

  const handleSaveExecutiveGoal = async (formData: {
    title: string
    description: string
    startDate: string
    endDate: string
    color: string
    note: string
    parentExecutiveGoalId?: string
  }) => {
    setIsSavingExecutiveGoal(true)
    try {
      const dates = enumerateDateRange(formData.startDate, formData.endDate)
      const normalizedStart = dates[0]
      const normalizedEnd = dates[dates.length - 1]

      if (editingExecutiveGoal) {
        // Update existing executiveGoal
        const updatedExecutiveGoal: ExecutiveGoalPlan = {
          ...editingExecutiveGoal,
          title: formData.title,
          description: formData.description || undefined,
          startDate: normalizedStart,
          endDate: normalizedEnd,
          note: formData.note || undefined,
          color: formData.color || undefined,
          parentExecutiveGoalId: formData.parentExecutiveGoalId || undefined,
        }

        const oldDates = enumerateDateRange(
          editingExecutiveGoal.startDate,
          editingExecutiveGoal.endDate,
        )
        const newDates = dates

        const updates: Promise<void>[] = []

        // Remove from old dates
        oldDates.forEach((iso) => {
          const existing = dayDetails[iso]?.executiveGoalPlans || []
          const filtered = existing.filter((t: any) => t.id !== editingExecutiveGoal.id)
          updates.push(onUpdateDay(iso, { executiveGoalPlans: filtered }))
        })

        // Add to new dates
        newDates.forEach((iso) => {
          const existing = dayDetails[iso]?.executiveGoalPlans || []
          const filtered = existing.filter((t: any) => t.id !== updatedExecutiveGoal.id)
          updates.push(
            onUpdateDay(iso, { executiveGoalPlans: [...filtered, updatedExecutiveGoal] }),
          )
        })

        await Promise.all(updates)

        setSelectedDay(updatedExecutiveGoal.startDate)
      } else {
        // Create new executiveGoal
        await onAddExecutiveGoal({
          title: formData.title,
          description: formData.description || undefined,
          startDate: normalizedStart,
          endDate: normalizedEnd,
          note: formData.note || undefined,
          color: formData.color || undefined,
          parentExecutiveGoalId: formData.parentExecutiveGoalId || undefined,
        })
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

  const handleEditExecutiveGoal = (executiveGoal: ExecutiveGoalPlan) => {
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
            const executiveGoals = dayDetails[day.iso]?.executiveGoalPlans || []
            
            // Separate goals (no parent) and tasks (have parent)
            const goals = executiveGoals.filter((eg: any) => !eg.parentExecutiveGoalId)
            const tasks = executiveGoals.filter((eg: any) => eg.parentExecutiveGoalId)
            
            // Calculate task completion
            const completedTasks = tasks.filter((t: any) => t.completed === true).length
            const totalTasks = tasks.length
            const completionPercent = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
            
            // Get goal colors for border
            const goalColors = goals.map((g: any) => g.color || '#8B5CF6')
            
            // Build day config
            const dayConfig: any = {
              iso: day.iso,
              dayOfMonth: day.dayOfMonth,
              weekdayIndex: day.weekdayIndex,
              indicators: [],
            }
            
            // Set background color based on task completion
            if (goals.length > 0 && totalTasks > 0) {
              dayConfig.highlighted = true
              dayConfig.highlightColor = getCompletionBackgroundColor(completionPercent)
            }
            
            // Set border style for goals
            if (goals.length > 0) {
              dayConfig.style = createMultiGoalBorderStyle(goalColors)
            }
            
            return dayConfig
          }),
          footer: monthExecutiveGoals.map((executiveGoal) => ({
            id: executiveGoal.id,
            type: 'travel' as const,
            title: executiveGoal.title,
            subtitle: `${executiveGoal.description ? `${executiveGoal.description} • ` : ''}${formatShortDate(
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
          const executiveGoals = dayDetails[date]?.executiveGoalPlans || []

          const sections = []

          // ExecutiveGoal plans section
          if (executiveGoals.length > 0) {
            sections.push({
              id: 'executiveGoal-plans',
              type: 'custom' as const,
              content: (
                <div className="space-y-3">
                  {executiveGoals.map((executiveGoal: any) => (
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
                            backgroundColor:
                              executiveGoal.color || 'rgba(14,165,233,0.25)',
                          }}
                        >
                          🎯
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-white/60">
                        {executiveGoal.description && (
                          <span>{executiveGoal.description} • </span>
                        )}
                        {formatShortDate(executiveGoal.startDate)} →{' '}
                        {formatShortDate(executiveGoal.endDate)}
                      </div>
                      {executiveGoal.note && (
                        <div className="mt-2 text-xs text-white/60">
                          {executiveGoal.note}
                        </div>
                      )}
                      <div className="mt-3 flex flex-wrap gap-2 text-xs">
                        <button
                          onClick={() => {
                            handleEditExecutiveGoal(executiveGoal)
                          }}
                          className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-white/80 hover:bg-white/10"
                        >
                          Edit executiveGoal
                        </button>
                        <button
                          onClick={() => removeExecutiveGoalForDay(date, executiveGoal.id)}
                          disabled={isUpdating}
                          className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Remove this day
                        </button>
                        <button
                          onClick={() => removeExecutiveGoalForTrip(executiveGoal.id)}
                          disabled={isUpdating}
                          className="px-3 py-1.5 rounded-lg border border-red-500/30 bg-red-500/10 text-red-200 hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Remove entire trip
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
        title={editingExecutiveGoal ? 'Edit executiveGoal' : 'Add executiveGoal'}
        onClose={handleCloseExecutiveGoalModal}
      >
        <ExecutiveGoalForm
          initialData={
            editingExecutiveGoal
              ? editingExecutiveGoal
              : prefilledDates
              ? {
                  startDate: prefilledDates.startDate,
                  endDate: prefilledDates.endDate,
                }
              : undefined
          }
          onSubmit={handleSaveExecutiveGoal}
          onCancel={handleCloseExecutiveGoalModal}
          isSubmitting={isSavingExecutiveGoal}
          availableExecutiveGoals={allExecutiveGoals}
        />
      </Modal>
    </>
  )
}
