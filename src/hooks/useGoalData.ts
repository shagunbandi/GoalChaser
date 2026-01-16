'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from './useAuth'
import { useGoals } from './useGoals'
import { useGoalDataLoader } from './useGoalDataLoader'
import { toISODateString, getMsUntilMidnight } from '@/utils'
import type { PluginConfigData, PluginDayData } from '@/sdk'
import type { TravelPlan } from '@/plugins/travel/types'
import type { BudgetPlan, SIPPlan } from '@/plugins/finance/types'

/**
 * Main hook for goal data management
 * Now uses the new generic plugin data architecture
 */
export function useGoalData(goalId: string, year?: number) {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const { getGoal, isLoading: goalsLoading } = useGoals()
  const goal = getGoal(goalId)

  // Today's date
  const [todayISO, setTodayISO] = useState(() => toISODateString(new Date()))

  // Calculate date range for data loading
  // Load data for the specified year plus buffer for adjacent months
  const currentYear = year || new Date().getFullYear()
  // Load 2 months before and after to handle cross-year navigation
  const startDate = `${currentYear - 1}-11-01`
  const endDate = `${currentYear + 1}-02-28`

  // Only use data loader when user is available
  const shouldLoad = !!user?.uid
  
  // Use new data loader hook
  const {
    pluginData,
    pluginConfigs,
    budgets,
    sips,
    travelPlans,
    loading: dataLoading,
    error: dataError,
    updatePluginData,
    updatePluginConfig,
    saveBudget,
    deleteBudget: deleteBudgetHandler,
    saveSIP,
    deleteSIP: deleteSIPHandler,
    saveTravelPlan,
    deleteTravelPlan: deleteTravelPlanHandler,
    reload
  } = useGoalDataLoader({
    userId: user?.uid || '',
    goalId,
    startDate,
    endDate,
    enabled: shouldLoad
  })

  // Status bar state
  const [statusText, setStatusText] = useState('Ready')
  const [statusTone, setStatusTone] = useState<
    'info' | 'success' | 'error' | 'progress'
  >('info')

  const pushStatus = (status: {
    text: string
    tone?: 'info' | 'success' | 'error' | 'progress'
  }) => {
    setStatusText(status.text)
    setStatusTone(status.tone ?? 'info')
  }

  // Update todayISO at midnight
  useEffect(() => {
    const scheduleUpdate = () => {
      const msUntilMidnight = getMsUntilMidnight()
      return setTimeout(() => {
        setTodayISO(toISODateString(new Date()))
        scheduleUpdate()
      }, msUntilMidnight + 100)
    }
    const timeoutId = scheduleUpdate()
    return () => clearTimeout(timeoutId)
  }, [])

  // Generic config management helpers
  const updateConfig = useCallback(async (pluginId: string, config: PluginConfigData) => {
    await updatePluginConfig(pluginId, config)
  }, [updatePluginConfig])

  // Generic data update helper
  const handleUpdateData = useCallback(async (pluginId: string, date: string, updates: Partial<PluginDayData>) => {
    await updatePluginData(pluginId, date, updates)
  }, [updatePluginData])

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/')
    }
  }, [authLoading, user, router])

  // Travel handler
  const handleAddTravel = useCallback(async (travel: Omit<TravelPlan, 'id'>) => {
    pushStatus({ text: 'Saving travel…', tone: 'progress' })

    try {
      const plan = {
        ...travel,
        id: `travel_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      } as TravelPlan

      await saveTravelPlan(plan)

      pushStatus({
        text: 'Travel saved',
        tone: 'success',
      })
    } catch (err) {
      console.error('Failed to save travel:', err)
      pushStatus({ text: 'Failed to save travel', tone: 'error' })
    }
  }, [saveTravelPlan, pushStatus])

  // Budget handlers  
  const handleSaveBudget = useCallback(async (budget: BudgetPlan) => {
    if (!user) return
    await saveBudget(budget)
  }, [user, saveBudget])

  const handleDeleteBudget = useCallback(async (budgetId: string) => {
    if (!user) return
    await deleteBudgetHandler(budgetId)
  }, [user, deleteBudgetHandler])

  // SIP handlers
  const handleSaveSIP = useCallback(async (sip: SIPPlan) => {
    if (!user) return
    await saveSIP(sip)
  }, [user, saveSIP])

  const handleDeleteSIP = useCallback(async (sipId: string) => {
    if (!user) return
    await deleteSIPHandler(sipId)
  }, [user, deleteSIPHandler])

  return {
    // Goal data
    goal,
    goalId,
    user,
    
    // Loading states
    isLoading: authLoading || goalsLoading || dataLoading,
    authLoading,
    goalsLoading,
    firebaseLoading: dataLoading,
    budgetingLoading: dataLoading,
    firebaseError: dataError,
    
    // Date state
    todayISO,
    
    // Generic plugin data
    pluginData,
    pluginConfigs,
    
    // Non-day-based data
    budgets,
    sips,
    travelPlans,

    // Generic handlers
    handleUpdateData,
    updateConfig,
    
    // Travel handlers
    handleAddTravel,
    
    // Budget handlers
    handleSaveBudget,
    handleDeleteBudget,
    handleSaveSIP,
    handleDeleteSIP,
    
    // Status
    pushStatus,
    statusText,
    statusTone,
    
    // Additional methods
    reload
  }
}
