'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import type { AddonId } from '@/types'
import { loadCalendarDays, saveCalendarDay } from '@/components/features/calendar/api'
import { initFirebase } from '@/lib/api/firebase-client'
import { loadGoalAddonsConfig } from '@/lib/api/addon-config-api'
import { usePluginRegistry } from '@/core/plugin-registry/hooks'
import { createPluginContext } from '@/sdk'
import type { PluginDayData, PluginConfigData } from '@/sdk'

// ============================================================================
// Query Keys - centralized for cache management
// ============================================================================
export const goalDataKeys = {
  all: ['goalData'] as const,
  addonsConfig: (userId: string, goalId: string) =>
    [...goalDataKeys.all, 'addonsConfig', userId, goalId] as const,
  pluginData: (userId: string, goalId: string, startDate: string, endDate: string) =>
    [...goalDataKeys.all, 'pluginData', userId, goalId, startDate, endDate] as const,
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
    // Use onMutate for optimistic updates (immediate UI feedback)
    onMutate: async ({ pluginId, date, updates }) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({
        queryKey: goalDataKeys.pluginData(userId, goalId, startDate, endDate),
      })

      // Snapshot the previous value for rollback
      const previousData = queryClient.getQueryData<GoalDataResult>(
        goalDataKeys.pluginData(userId, goalId, startDate, endDate),
      )

      // Optimistically update the cache immediately
      queryClient.setQueryData<GoalDataResult>(
        goalDataKeys.pluginData(userId, goalId, startDate, endDate),
        (old) => {
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
        },
      )

      return { previousData }
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(
          goalDataKeys.pluginData(userId, goalId, startDate, endDate),
          context.previousData,
        )
      }
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
    return queryClient.invalidateQueries({ queryKey: goalDataKeys.all })
  }, [queryClient])

  // ============================================================================
  // Combined loading state
  // ============================================================================
  const isLoading =
    addonsQuery.isLoading ||
    pluginDataQuery.isLoading ||
    (!registryInitialized && enabled && !!userId)

  const error = addonsQuery.error || pluginDataQuery.error

  return {
    // Data
    pluginData: pluginDataQuery.data?.pluginData ?? {},
    pluginConfigs: pluginDataQuery.data?.pluginConfigs ?? {},

    // Loading state
    loading: isLoading,
    error: error as Error | null,

    // Mutations
    updatePluginData,
    updatePluginConfig,

    // Reload
    reload,
  }
}
