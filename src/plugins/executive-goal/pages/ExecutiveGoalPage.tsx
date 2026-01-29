'use client'

import { useMemo } from 'react'
import type { PluginPageProps } from '@/sdk'
import { usePluginPage, LoadingState, NotFoundState, ContentLoader } from '@/sdk'
import { useAuth } from '@/hooks/useAuth'
import { ExecutiveGoalHeader, YearView, ExecutiveGoalMonthView } from '../components'
import type { ExecutiveGoalPlan, ExecutiveGoalPlanInput, ExecutiveGoalDayData } from '../types'
import { ExecutiveGoalPlugin } from '../plugin'
import { saveExecutiveGoalPlan, deleteExecutiveGoalPlan } from '../api'

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

  // Extract all unique executiveGoals for parent selection
  const allExecutiveGoals = useMemo(() => {
    const planMap = new Map<string, ExecutiveGoalPlan>()
    Object.values(pluginDayData).forEach((data) => {
      data?.executiveGoalPlans?.forEach((plan) => {
        if (!planMap.has(plan.id)) {
          planMap.set(plan.id, plan)
        }
      })
    })
    return Array.from(planMap.values())
  }, [pluginDayData])

  const handleAddExecutiveGoal = async (executiveGoal: ExecutiveGoalPlanInput) => {
    const trimmedNote = executiveGoal.note?.trim()
    const trimmedPlan = executiveGoal.plan?.trim()

    const plan: ExecutiveGoalPlan = {
      id: `executiveGoal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: executiveGoal.title,
      startDate: executiveGoal.startDate,
      endDate: executiveGoal.endDate,
      ...(trimmedNote && { note: trimmedNote }),
      ...(trimmedPlan && { plan: trimmedPlan }),
      ...(executiveGoal.color && { color: executiveGoal.color }),
      ...(executiveGoal.parentExecutiveGoalId && { parentExecutiveGoalId: executiveGoal.parentExecutiveGoalId }),
    }

    const ok = await saveExecutiveGoalPlan(userId, goalId, plan)
    if (ok) await reload()
  }

  const handleUpdateExecutiveGoal = async (updatedExecutiveGoal: ExecutiveGoalPlan) => {
    const ok = await saveExecutiveGoalPlan(userId, goalId, updatedExecutiveGoal)
    if (ok) await reload()
  }

  const handleDeleteExecutiveGoal = async (executiveGoalId: string) => {
    const ok = await deleteExecutiveGoalPlan(userId, goalId, executiveGoalId)
    if (ok) await reload()
  }

  // Only show full-page loading on TRUE initial load (no goal AND no cached data)
  if (!goal && isLoading && !hasData) return <LoadingState />
  if (!goal && !isLoading) return <NotFoundState />

  return (
    <div className="space-y-6">
      {/* Header - ALWAYS rendered, never unmounted */}
      <ExecutiveGoalHeader
        year={currentYear}
        dayData={pluginDayData}
        onPrevYear={navigateToPrevYear}
        onNextYear={navigateToNextYear}
        onAddExecutiveGoal={handleAddExecutiveGoal}
        onUpdateExecutiveGoal={handleUpdateExecutiveGoal}
        onDeleteExecutiveGoal={handleDeleteExecutiveGoal}
        allExecutiveGoals={allExecutiveGoals}
        userId={userId}
        goalId={goalId}
      />

      {/* Content - shows inline loader when switching years */}
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
        />
      ) : (
        <YearView
          year={currentYear}
          todayISO={todayISO}
          dayDetails={pluginDayData}
          onPrevYear={navigateToPrevYear}
          onNextYear={navigateToNextYear}
          onAddExecutiveGoal={handleAddExecutiveGoal}
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
