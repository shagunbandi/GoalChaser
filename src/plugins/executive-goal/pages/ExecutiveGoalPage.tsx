'use client'

import { useState, useEffect, useCallback } from 'react'
import type { PluginPageProps } from '@/sdk'
import { usePluginPage, LoadingState, NotFoundState, ContentLoader } from '@/sdk'
import { useAuth } from '@/hooks/useAuth'
import { ExecutiveGoalHeader, YearView, ExecutiveGoalMonthView } from '../components'
import type { ExecutiveGoal, ExecutiveGoalInput, ExecutiveGoalDayData } from '../types'
import { ExecutiveGoalPlugin } from '../plugin'
import {
  loadExecutiveGoals,
  saveExecutiveGoal,
  deleteExecutiveGoal,
} from '../api'

export default function ExecutiveGoalPage({ params, year, month }: PluginPageProps) {
  const { user } = useAuth()
  const userId = user?.uid ?? ''
  const {
    goal,
    goalId,
    isLoading,
    todayISO,
    pluginDayData,
    initialSelectedDay,
    updateDayData,
    reload,
    navigateToPrevYear,
    navigateToNextYear,
    navigateToYear,
    navigateToMonth,
    jumpToMonth,
    hasData,
    year: currentYear,
  } = usePluginPage<ExecutiveGoalDayData>({
    pluginId: 'executiveGoal',
    params,
    year,
  })

  const [allExecutiveGoals, setAllExecutiveGoals] = useState<ExecutiveGoal[]>([])

  const loadGoals = useCallback(async () => {
    if (!userId || !goalId) return
    const goals = await loadExecutiveGoals(userId, goalId)
    setAllExecutiveGoals(goals)
  }, [userId, goalId])

  useEffect(() => {
    loadGoals()
  }, [loadGoals])

  const handleAddExecutiveGoal = async (input: ExecutiveGoalInput) => {
    const goal: ExecutiveGoal = {
      id: `executiveGoal_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      title: input.title,
      startDate: input.startDate,
      endDate: input.endDate,
      ...(input.note?.trim() && { note: input.note.trim() }),
      ...(input.plan?.trim() && { plan: input.plan.trim() }),
      ...(input.color && { color: input.color }),
    }
    const ok = await saveExecutiveGoal(userId, goalId, goal)
    if (ok) await loadGoals()
  }

  const handleUpdateExecutiveGoal = async (updated: ExecutiveGoal) => {
    const ok = await saveExecutiveGoal(userId, goalId, updated)
    if (ok) await loadGoals()
  }

  const handleDeleteExecutiveGoal = async (executiveGoalId: string) => {
    const ok = await deleteExecutiveGoal(userId, goalId, executiveGoalId)
    if (ok) await loadGoals()
  }

  const loadAllPlansForGoal = () => loadExecutiveGoals(userId, goalId)

  if (!goal && isLoading && !hasData) return <LoadingState />
  if (!goal && !isLoading) return <NotFoundState />

  return (
    <div className="space-y-6">
      <ExecutiveGoalHeader
        year={currentYear}
        dayData={pluginDayData}
        allExecutiveGoals={allExecutiveGoals}
        onPrevYear={navigateToPrevYear}
        onNextYear={navigateToNextYear}
        onAddExecutiveGoal={handleAddExecutiveGoal}
        onUpdateExecutiveGoal={handleUpdateExecutiveGoal}
        onDeleteExecutiveGoal={handleDeleteExecutiveGoal}
        userId={userId}
        goalId={goalId}
      />

      {isLoading && !hasData ? (
        <ContentLoader color="#8B5CF6" />
      ) : month ? (
        <ExecutiveGoalMonthView
          plugin={ExecutiveGoalPlugin}
          month={month}
          year={currentYear}
          goalId={goalId}
          todayISO={todayISO}
          dayData={pluginDayData}
          initialSelectedDate={initialSelectedDay}
          onUpdateDay={updateDayData}
          onBackToYear={() => navigateToYear(currentYear)}
          onEditExecutiveGoal={handleUpdateExecutiveGoal}
          onDeleteExecutiveGoal={handleDeleteExecutiveGoal}
          onAddExecutiveGoal={handleAddExecutiveGoal}
          allExecutiveGoals={allExecutiveGoals}
          userId={userId}
          loadAllPlansForGoal={loadAllPlansForGoal}
        />
      ) : (
        <YearView
          year={currentYear}
          todayISO={todayISO}
          dayDetails={pluginDayData}
          onPrevYear={navigateToPrevYear}
          onNextYear={navigateToNextYear}
          onAddExecutiveGoal={handleAddExecutiveGoal}
          onUpdateExecutiveGoal={handleUpdateExecutiveGoal}
          onUpdateDay={updateDayData}
          onDeleteExecutiveGoal={handleDeleteExecutiveGoal}
          onJumpToDay={jumpToMonth}
          onMonthClick={navigateToMonth}
          initialSelectedDay={initialSelectedDay}
          allExecutiveGoals={allExecutiveGoals}
        />
      )}
    </div>
  )
}
