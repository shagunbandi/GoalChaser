'use client'

import { useMemo } from 'react'
import type { PluginPageProps } from '@/sdk'
import { usePluginPage, LoadingState, NotFoundState, ContentLoader } from '@/sdk'
import { useAuth } from '@/hooks/useAuth'
import { ExecutiveGoalHeader, YearView, ExecutiveGoalMonthView } from '../components'
import { enumerateDateRange } from '@/utils'
import type { ExecutiveGoalPlan, ExecutiveGoalPlanInput, ExecutiveGoalDayData } from '../types'
import { ExecutiveGoalPlugin } from '../plugin'

export default function ExecutiveGoalPage({ params, year, month }: PluginPageProps) {
  const { user } = useAuth()
  const userId = user?.uid
  const {
    goal,
    goalId,
    isLoading,
    todayISO,
    pluginDayData,
    initialSelectedDay,
    updateDayData,
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
    const dates = enumerateDateRange(
      executiveGoal.startDate as string,
      executiveGoal.endDate as string,
    )

    const trimmedNote = executiveGoal.note?.trim()
    const trimmedDescription = executiveGoal.description?.trim()

    const executiveGoalWithId: ExecutiveGoalPlan = {
      id: `executiveGoal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: executiveGoal.title,
      startDate: executiveGoal.startDate,
      endDate: executiveGoal.endDate,
      ...(trimmedNote && { note: trimmedNote }),
      ...(trimmedDescription && { description: trimmedDescription }),
      ...(executiveGoal.color && { color: executiveGoal.color }),
      ...(executiveGoal.parentExecutiveGoalId && { parentExecutiveGoalId: executiveGoal.parentExecutiveGoalId }),
    }

    for (const date of dates) {
      const existing = (pluginDayData[date]?.executiveGoalPlans as ExecutiveGoalPlan[]) || []
      await updateDayData(date, {
        executiveGoalPlans: [...existing, executiveGoalWithId],
      })
    }
  }

  const handleUpdateExecutiveGoal = async (updatedExecutiveGoal: ExecutiveGoalPlan) => {
    // Find the old executiveGoal to get its date range
    let oldExecutiveGoal: ExecutiveGoalPlan | null = null
    for (const data of Object.values(pluginDayData)) {
      const found = data?.executiveGoalPlans?.find((p) => p.id === updatedExecutiveGoal.id)
      if (found) {
        oldExecutiveGoal = found
        break
      }
    }

    if (!oldExecutiveGoal) return

    // Remove from old dates
    const oldDates = enumerateDateRange(oldExecutiveGoal.startDate, oldExecutiveGoal.endDate)
    for (const date of oldDates) {
      const existing = (pluginDayData[date]?.executiveGoalPlans as ExecutiveGoalPlan[]) || []
      await updateDayData(date, {
        executiveGoalPlans: existing.filter((p) => p.id !== updatedExecutiveGoal.id),
      })
    }

    // Add to new dates
    const newDates = enumerateDateRange(
      updatedExecutiveGoal.startDate,
      updatedExecutiveGoal.endDate,
    )
    for (const date of newDates) {
      const existing = (pluginDayData[date]?.executiveGoalPlans as ExecutiveGoalPlan[]) || []
      // Filter out any existing with same ID (in case dates overlap)
      const filtered = existing.filter((p) => p.id !== updatedExecutiveGoal.id)
      await updateDayData(date, {
        executiveGoalPlans: [...filtered, updatedExecutiveGoal],
      })
    }
  }

  const handleDeleteExecutiveGoal = async (executiveGoalId: string) => {
    // Find the executiveGoal to get its date range
    let executiveGoal: ExecutiveGoalPlan | null = null
    for (const data of Object.values(pluginDayData)) {
      const found = data?.executiveGoalPlans?.find((p) => p.id === executiveGoalId)
      if (found) {
        executiveGoal = found
        break
      }
    }

    if (!executiveGoal) return

    // Remove from all dates in the range
    const dates = enumerateDateRange(executiveGoal.startDate, executiveGoal.endDate)
    for (const date of dates) {
      const existing = (pluginDayData[date]?.executiveGoalPlans as ExecutiveGoalPlan[]) || []
      await updateDayData(date, {
        executiveGoalPlans: existing.filter((p) => p.id !== executiveGoalId),
      })
    }
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
          onJumpToDay={jumpToMonth}
          onMonthClick={navigateToMonth}
          initialSelectedDay={initialSelectedDay}
          allExecutiveGoals={allExecutiveGoals}
        />
      )}
    </div>
  )
}
