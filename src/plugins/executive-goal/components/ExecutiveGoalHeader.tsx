'use client'

import { useMemo, useState } from 'react'
import { HeaderRenderer } from '@/components/features/year-view/renderers/HeaderRenderer'
import { ExecutiveGoalManager } from './ExecutiveGoalManager'
import type { ExecutiveGoalDayData, ExecutiveGoalPlan, ExecutiveGoalPlanInput } from '../types'
import { isWeekend } from '@/utils'

interface ExecutiveGoalHeaderProps {
  year: number
  dayData: Record<string, ExecutiveGoalDayData>
  onPrevYear: () => void
  onNextYear: () => void
  onAddExecutiveGoal?: (goal: ExecutiveGoalPlanInput) => void | Promise<void>
  onUpdateExecutiveGoal?: (goal: ExecutiveGoalPlan) => void | Promise<void>
  onDeleteExecutiveGoal?: (goalId: string) => void | Promise<void>
  allExecutiveGoals?: ExecutiveGoalPlan[]
  userId?: string
  goalId?: string
}

export function ExecutiveGoalHeader({
  year,
  dayData,
  onPrevYear,
  onNextYear,
  onAddExecutiveGoal,
  onUpdateExecutiveGoal,
  onDeleteExecutiveGoal,
  allExecutiveGoals,
  userId,
  goalId,
}: ExecutiveGoalHeaderProps) {
  const [showExecutiveGoalManager, setShowExecutiveGoalManager] = useState(false)

  const headerConfig = useMemo(() => {
    const yearPrefix = `${year}-`
    const executiveGoalEntries = Object.entries(dayData).filter(
      ([iso, details]) =>
        iso.startsWith(yearPrefix) && (details.executiveGoalPlans?.length || 0) > 0,
    )
    const executiveGoalDays = executiveGoalEntries.length
    const weekdayCount = executiveGoalEntries.filter(([iso]) => !isWeekend(iso)).length
    const weekendCount = executiveGoalDays - weekdayCount

    return {
      icon: '🎯',
      title: `Executive Goals Year:`,
      stats: [
        { label: 'Goal days', value: executiveGoalDays },
        { label: 'Weekdays', value: weekdayCount },
        { label: 'Weekends', value: weekendCount },
      ],
      legends: [],
      actions: onAddExecutiveGoal
        ? [
            {
              id: 'manage-executiveGoal',
              label: 'Manage Goals',
              icon: '⚙️',
              onClick: () => setShowExecutiveGoalManager(true),
            },
          ]
        : [],
    }
  }, [dayData, year, onAddExecutiveGoal])

  if (!headerConfig) return null

  return (
    <>
      <HeaderRenderer
        config={headerConfig}
        year={year}
        onPrevYear={onPrevYear}
        onNextYear={onNextYear}
      />

      {/* Executive Goal Manager Drawer */}
      {showExecutiveGoalManager && onAddExecutiveGoal && onUpdateExecutiveGoal && onDeleteExecutiveGoal && (
        <ExecutiveGoalManager
          isOpen={showExecutiveGoalManager}
          dayData={dayData}
          onAddExecutiveGoal={onAddExecutiveGoal}
          onUpdateExecutiveGoal={onUpdateExecutiveGoal}
          onDeleteExecutiveGoal={onDeleteExecutiveGoal}
          onClose={() => setShowExecutiveGoalManager(false)}
          allExecutiveGoals={allExecutiveGoals}
          userId={userId}
          goalId={goalId}
        />
      )}
    </>
  )
}
