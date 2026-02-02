'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from './useAuth'
import { useGoals } from './useGoals'
import { useGoalDataQuery } from './useGoalDataQuery'
import { toISODateString, getMsUntilMidnight } from '@/utils'
import type { PluginConfigData, PluginDayData } from '@goal-chaser/sdk'

/**
 * Main hook for goal data management
 * Uses React Query for efficient data fetching and caching
 * 
 * This hook is CORE infrastructure and should NOT import from plugins.
 * Plugin-specific logic should live in plugin folders.
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

  // Use React Query based data loader
  const {
    pluginData,
    pluginConfigs,
    loading: dataLoading,
    error: dataError,
    updatePluginData,
    updatePluginDataBatch,
    updatePluginConfig,
    reload,
  } = useGoalDataQuery({
    userId: user?.uid || '',
    goalId,
    startDate,
    endDate,
    enabled: shouldLoad,
  })

  // Status bar state
  const [statusText, setStatusText] = useState('Ready')
  const [statusTone, setStatusTone] = useState<
    'info' | 'success' | 'error' | 'progress'
  >('info')

  const pushStatus = useCallback((status: {
    text: string
    tone?: 'info' | 'success' | 'error' | 'progress'
  }) => {
    setStatusText(status.text)
    setStatusTone(status.tone ?? 'info')
  }, [])

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

  // Generic config management helper
  const updateConfig = useCallback(
    async (pluginId: string, config: PluginConfigData) => {
      await updatePluginConfig(pluginId, config)
    },
    [updatePluginConfig]
  )

  // Generic data update helper
  const handleUpdateData = useCallback(
    async (pluginId: string, date: string, updates: Partial<PluginDayData>) => {
      await updatePluginData(pluginId, date, updates)
    },
    [updatePluginData]
  )

  // Batch update (one mutation for many days – use for travel/plugins that touch many dates)
  const handleUpdateDataBatch = useCallback(
    async (
      pluginId: string,
      updates: Array<{ date: string; updates: Partial<PluginDayData> }>,
    ) => {
      if (updates.length === 0) return
      if (updates.length === 1) {
        await updatePluginData(pluginId, updates[0].date, updates[0].updates)
        return
      }
      await updatePluginDataBatch(pluginId, updates)
    },
    [updatePluginData, updatePluginDataBatch],
  )

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/')
    }
  }, [authLoading, user, router])

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
    firebaseError: dataError,

    // Date state
    todayISO,

    // Generic plugin data
    pluginData,
    pluginConfigs,

    // Generic handlers
    handleUpdateData,
    handleUpdateDataBatch,
    updateConfig,

    // Status
    pushStatus,
    statusText,
    statusTone,

    // Additional methods
    reload,
  }
}
