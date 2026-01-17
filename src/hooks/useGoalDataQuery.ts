'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect } from 'react'
import type { AddonId } from '@/types'
import { loadCalendarDays, saveCalendarDay } from '@/components/features/calendar/api'
import {
  loadBudgetsFromFirebase,
  saveBudgetToFirebase,
  deleteBudgetFromFirebase,
  loadSIPsFromFirebase,
  saveSIPToFirebase,
  deleteSIPFromFirebase,
  setFirebaseDb,
} from '@/plugins/finance/api'
import { saveTravelPlan, deleteTravelPlan } from '@/plugins/travel/api'
import { initFirebase } from '@/lib/api/firebase-client'
import { getFirestore } from 'firebase/firestore'
import { getFirebaseApp } from '@/lib/firebase-service'
import { loadGoalAddonsConfig } from '@/lib/api/addon-config-api'
import { usePluginRegistry } from '@/core/plugin-registry/hooks'
import { createPluginContext } from '@/sdk'
import type { PluginDayData, PluginConfigData } from '@/sdk'
import type { BudgetPlan, SIPPlan } from '@/plugins/finance/types'
import type { TravelPlan } from '@/plugins/travel/types'

// ============================================================================
// Query Keys - centralized for cache management
// ============================================================================
export const goalDataKeys = {
  all: ['goalData'] as const,
  addonsConfig: (userId: string, goalId: string) =>
    [...goalDataKeys.all, 'addonsConfig', userId, goalId] as const,
  pluginData: (userId: string, goalId: string, startDate: string, endDate: string) =>
    [...goalDataKeys.all, 'pluginData', userId, goalId, startDate, endDate] as const,
  budgets: (userId: string, goalId: string) =>
    [...goalDataKeys.all, 'budgets', userId, goalId] as const,
  sips: (userId: string, goalId: string) =>
    [...goalDataKeys.all, 'sips', userId, goalId] as const,
}

// ============================================================================
// Types
// ============================================================================
interface UseGoalDataQueryParams {
  userId: string
  goalId: string
  startDate: string
  endDate: string
  enabled?: boolean
}

interface GoalDataResult {
  pluginData: Record<string, Record<string, PluginDayData>>
  pluginConfigs: Record<string, PluginConfigData>
}

// ============================================================================
// Query Functions
// ============================================================================

// Initialize Firebase (called once)
let firebaseInitialized = false
async function ensureFirebaseInit() {
  if (firebaseInitialized) return
  const app = getFirebaseApp()
  if (app) {
    const db = getFirestore(app)
    setFirebaseDb(db)
  }
  await initFirebase()
  firebaseInitialized = true
}

// Fetch addons config
async function fetchAddonsConfig(userId: string, goalId: string): Promise<AddonId[]> {
  await ensureFirebaseInit()
  const config = await loadGoalAddonsConfig(userId, goalId)
  return config.enabled
}

// Fetch all plugin data
async function fetchPluginData(
  userId: string,
  goalId: string,
  startDate: string,
  endDate: string,
  enabledAddons: AddonId[],
  registry: any
): Promise<GoalDataResult> {
  await ensureFirebaseInit()

  const newPluginData: Record<string, Record<string, PluginDayData>> = {}
  const newPluginConfigs: Record<string, PluginConfigData> = {}

  // Calendar (always loaded - core feature)
  const calendarData = await loadCalendarDays(userId, goalId, startDate, endDate)
  newPluginData['calendar'] = calendarData

  // Load data from plugins using plugin registry
  for (const addonId of enabledAddons) {
    if (addonId === 'calendar') continue

    const plugin = registry.getPlugin(addonId)
    if (plugin?.dataProvider) {
      const context = createPluginContext({ userId, goalId, pluginId: addonId })

      // Load day data
      const dayData = await plugin.dataProvider.loadDateRange(context, startDate, endDate)
      newPluginData[addonId] = dayData || {}

      // Load config if available
      if (plugin.dataProvider.loadConfig) {
        const config = await plugin.dataProvider.loadConfig(context)
        newPluginConfigs[addonId] = config
      }
    }
  }

  return { pluginData: newPluginData, pluginConfigs: newPluginConfigs }
}

// Fetch budgets
async function fetchBudgets(userId: string, goalId: string): Promise<BudgetPlan[]> {
  await ensureFirebaseInit()
  return loadBudgetsFromFirebase(userId, goalId)
}

// Fetch SIPs
async function fetchSIPs(userId: string, goalId: string): Promise<SIPPlan[]> {
  await ensureFirebaseInit()
  return loadSIPsFromFirebase(userId, goalId)
}

// ============================================================================
// Main Hook
// ============================================================================
export function useGoalDataQuery({
  userId,
  goalId,
  startDate,
  endDate,
  enabled = true,
}: UseGoalDataQueryParams) {
  const queryClient = useQueryClient()
  const { registry, initialized: registryInitialized } = usePluginRegistry()

  // Query 1: Addons Config
  const addonsQuery = useQuery({
    queryKey: goalDataKeys.addonsConfig(userId, goalId),
    queryFn: () => fetchAddonsConfig(userId, goalId),
    enabled: enabled && !!userId && !!goalId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })

  const enabledAddons = addonsQuery.data ?? ['calendar']

  // Query 2: Plugin Data (depends on addons config and registry)
  const pluginDataQuery = useQuery({
    queryKey: goalDataKeys.pluginData(userId, goalId, startDate, endDate),
    queryFn: () =>
      fetchPluginData(userId, goalId, startDate, endDate, enabledAddons, registry),
    enabled: enabled && !!userId && !!goalId && registryInitialized && addonsQuery.isSuccess,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Query 3: Budgets (independent, only if finance enabled)
  const budgetsQuery = useQuery({
    queryKey: goalDataKeys.budgets(userId, goalId),
    queryFn: () => fetchBudgets(userId, goalId),
    enabled: enabled && !!userId && !!goalId && enabledAddons.includes('finance'),
    staleTime: 5 * 60 * 1000,
  })

  // Query 4: SIPs (independent, only if finance enabled)
  const sipsQuery = useQuery({
    queryKey: goalDataKeys.sips(userId, goalId),
    queryFn: () => fetchSIPs(userId, goalId),
    enabled: enabled && !!userId && !!goalId && enabledAddons.includes('finance'),
    staleTime: 5 * 60 * 1000,
  })

  // ============================================================================
  // Mutations
  // ============================================================================

  // Update plugin day data
  const updatePluginDataMutation = useMutation({
    mutationFn: async ({
      pluginId,
      date,
      updates,
    }: {
      pluginId: string
      date: string
      updates: Record<string, any>
    }) => {
      if (pluginId === 'calendar') {
        await saveCalendarDay(userId, goalId, date, updates)
      } else {
        const plugin = registry.getPlugin(pluginId)
        if (plugin?.dataProvider) {
          const context = createPluginContext({ userId, goalId, pluginId })
          await plugin.dataProvider.saveDayData(context, date, updates)
        }
      }
      return { pluginId, date, updates }
    },
    onSuccess: ({ pluginId, date, updates }) => {
      // Optimistically update the cache
      queryClient.setQueryData(
        goalDataKeys.pluginData(userId, goalId, startDate, endDate),
        (old: GoalDataResult | undefined) => {
          if (!old) return old
          return {
            ...old,
            pluginData: {
              ...old.pluginData,
              [pluginId]: {
                ...old.pluginData[pluginId],
                [date]: {
                  ...(old.pluginData[pluginId]?.[date] || {}),
                  ...updates,
                },
              },
            },
          }
        }
      )
    },
  })

  // Update plugin config
  const updatePluginConfigMutation = useMutation({
    mutationFn: async ({
      pluginId,
      config,
    }: {
      pluginId: string
      config: any
    }) => {
      const plugin = registry.getPlugin(pluginId)
      if (plugin?.dataProvider?.saveConfig) {
        const context = createPluginContext({ userId, goalId, pluginId })
        await plugin.dataProvider.saveConfig(context, config)
      }
      return { pluginId, config }
    },
    onSuccess: ({ pluginId, config }) => {
      queryClient.setQueryData(
        goalDataKeys.pluginData(userId, goalId, startDate, endDate),
        (old: GoalDataResult | undefined) => {
          if (!old) return old
          return {
            ...old,
            pluginConfigs: {
              ...old.pluginConfigs,
              [pluginId]: config,
            },
          }
        }
      )
    },
  })

  // Budget mutations
  const saveBudgetMutation = useMutation({
    mutationFn: (budget: BudgetPlan) => saveBudgetToFirebase(userId, goalId, budget),
    onSuccess: (_, budget) => {
      queryClient.setQueryData(
        goalDataKeys.budgets(userId, goalId),
        (old: BudgetPlan[] | undefined) => {
          if (!old) return [budget]
          const idx = old.findIndex((b) => b.id === budget.id)
          if (idx >= 0) {
            const updated = [...old]
            updated[idx] = budget
            return updated
          }
          return [...old, budget]
        }
      )
    },
  })

  const deleteBudgetMutation = useMutation({
    mutationFn: (budgetId: string) => deleteBudgetFromFirebase(userId, goalId, budgetId),
    onSuccess: (_, budgetId) => {
      queryClient.setQueryData(
        goalDataKeys.budgets(userId, goalId),
        (old: BudgetPlan[] | undefined) => old?.filter((b) => b.id !== budgetId) ?? []
      )
    },
  })

  // SIP mutations
  const saveSIPMutation = useMutation({
    mutationFn: (sip: SIPPlan) => saveSIPToFirebase(userId, goalId, sip),
    onSuccess: (_, sip) => {
      queryClient.setQueryData(
        goalDataKeys.sips(userId, goalId),
        (old: SIPPlan[] | undefined) => {
          if (!old) return [sip]
          const idx = old.findIndex((s) => s.id === sip.id)
          if (idx >= 0) {
            const updated = [...old]
            updated[idx] = sip
            return updated
          }
          return [...old, sip]
        }
      )
    },
  })

  const deleteSIPMutation = useMutation({
    mutationFn: (sipId: string) => deleteSIPFromFirebase(userId, goalId, sipId),
    onSuccess: (_, sipId) => {
      queryClient.setQueryData(
        goalDataKeys.sips(userId, goalId),
        (old: SIPPlan[] | undefined) => old?.filter((s) => s.id !== sipId) ?? []
      )
    },
  })

  // Travel mutations
  const saveTravelPlanMutation = useMutation({
    mutationFn: (plan: TravelPlan) => saveTravelPlan(userId, goalId, plan),
    onSuccess: () => {
      // Invalidate plugin data to reload travel data
      queryClient.invalidateQueries({
        queryKey: goalDataKeys.pluginData(userId, goalId, startDate, endDate),
      })
    },
  })

  const deleteTravelPlanMutation = useMutation({
    mutationFn: (planId: string) => deleteTravelPlan(userId, goalId, planId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: goalDataKeys.pluginData(userId, goalId, startDate, endDate),
      })
    },
  })

  // ============================================================================
  // Wrapper functions for mutations
  // ============================================================================
  const updatePluginData = useCallback(
    (pluginId: string, date: string, updates: Record<string, any>) =>
      updatePluginDataMutation.mutateAsync({ pluginId, date, updates }),
    [updatePluginDataMutation]
  )

  const updatePluginConfig = useCallback(
    (pluginId: string, config: any) =>
      updatePluginConfigMutation.mutateAsync({ pluginId, config }),
    [updatePluginConfigMutation]
  )

  const reload = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: goalDataKeys.all })
  }, [queryClient])

  // ============================================================================
  // Combined loading state
  // ============================================================================
  const isLoading =
    addonsQuery.isLoading ||
    pluginDataQuery.isLoading ||
    (!registryInitialized && enabled && !!userId)

  const error = addonsQuery.error || pluginDataQuery.error || budgetsQuery.error || sipsQuery.error

  return {
    // Data
    pluginData: pluginDataQuery.data?.pluginData ?? {},
    pluginConfigs: pluginDataQuery.data?.pluginConfigs ?? {},
    budgets: budgetsQuery.data ?? [],
    sips: sipsQuery.data ?? [],
    travelPlans: [] as TravelPlan[], // Travel is now in pluginData

    // Loading state
    loading: isLoading,
    error: error as Error | null,

    // Mutations
    updatePluginData,
    updatePluginConfig,
    saveBudget: saveBudgetMutation.mutateAsync,
    deleteBudget: deleteBudgetMutation.mutateAsync,
    saveSIP: saveSIPMutation.mutateAsync,
    deleteSIP: deleteSIPMutation.mutateAsync,
    saveTravelPlan: saveTravelPlanMutation.mutateAsync,
    deleteTravelPlan: deleteTravelPlanMutation.mutateAsync,

    // Reload
    reload,
  }
}
