'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { AddonId } from '@/types'
import { loadCalendarDays, saveCalendarDay } from '@/components/features/calendar/api'
import { initFirebase } from '@/lib/api/firebase-client'
import { loadGoalAddonsConfig } from '@/lib/api/addon-config-api'
import { usePluginRegistry } from '@/core/plugin-registry/hooks'
import { createPluginContext } from '@/sdk'
import type { PluginDayData, PluginConfigData } from '@/sdk'

interface UseGoalDataLoaderParams {
  userId: string
  goalId: string
  startDate: string
  endDate: string
  enabled?: boolean  // Only load data when enabled (default true)
}

interface UseGoalDataLoaderResult {
  // Generic plugin data: pluginId -> date -> data
  pluginData: Record<string, Record<string, PluginDayData>>
  
  // Plugin configs: pluginId -> config
  pluginConfigs: Record<string, PluginConfigData>
  
  // Loading state
  loading: boolean
  error: Error | null
  
  // Save methods
  updatePluginData: (pluginId: string, date: string, updates: Partial<PluginDayData>) => Promise<void>
  updatePluginConfig: (pluginId: string, config: PluginConfigData) => Promise<void>
  
  // Reload methods
  reload: () => Promise<void>
}

/**
 * Smart data loader hook that:
 * 1. Loads data from all enabled add-ons in parallel
 * 2. Stores plugin data separately by pluginId
 * 3. Provides save methods that route to correct plugins
 * 4. Handles caching and selective reloading
 * 
 * This hook is CORE infrastructure and should NOT import from plugins.
 * Plugin-specific logic should live in plugin folders.
 */
export function useGoalDataLoader({
  userId,
  goalId,
  startDate,
  endDate,
  enabled = true
}: UseGoalDataLoaderParams): UseGoalDataLoaderResult {
  // Generic plugin data structure: pluginId -> date -> data
  const [pluginData, setPluginData] = useState<Record<string, Record<string, PluginDayData>>>({})
  const [pluginConfigs, setPluginConfigs] = useState<Record<string, PluginConfigData>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [enabledAddons, setEnabledAddons] = useState<AddonId[]>(['calendar'])
  
  // Track if we've done the initial load - use ref to avoid re-triggering loadData
  const hasInitiallyLoadedRef = useRef(false)
  
  // Track if addons config has been loaded - prevents double data loading
  const [addonsConfigLoaded, setAddonsConfigLoaded] = useState(false)
  
  // Get plugin registry
  const { registry, initialized: registryInitialized } = usePluginRegistry()

  // Initialize Firebase DB
  useEffect(() => {
    async function init() {
      // Initialize firebase-client for all APIs
      await initFirebase()
    }
    
    init()
  }, [])

  // Load enabled add-ons configuration
  useEffect(() => {
    async function loadAddonsConfig() {
      // Don't load if userId is not available yet
      if (!userId || !goalId) {
        return
      }
      
      try {
        const config = await loadGoalAddonsConfig(userId, goalId)
        setEnabledAddons(config.enabled)
      } catch (err) {
        console.error('Failed to load add-ons config:', err)
      } finally {
        setAddonsConfigLoaded(true)
      }
    }
    
    loadAddonsConfig()
  }, [userId, goalId])

  // Main data loading function
  const loadData = useCallback(async () => {
    // Don't load if not enabled, userId is missing, registry not initialized, or addons config not loaded
    if (!enabled || !userId || !registryInitialized || !addonsConfigLoaded) {
      // Only set loading to false if we're not waiting for something
      if (!enabled) {
        setLoading(false)
      }
      return
    }

    // Only show loading state on INITIAL load, not subsequent loads
    // This prevents the UI from flashing loading state when switching years
    if (!hasInitiallyLoadedRef.current) {
      setLoading(true)
    }
    setError(null)

    try {
      const newPluginData: Record<string, Record<string, PluginDayData>> = {}
      const newPluginConfigs: Record<string, PluginConfigData> = {}
      
      // Calendar (always loaded - core feature)
      const calendarData = await loadCalendarDays(userId, goalId, startDate, endDate)
      newPluginData['calendar'] = calendarData
      
      // Load data from plugins using plugin registry
      for (const addonId of enabledAddons) {
        if (addonId === 'calendar') continue // Already loaded
        
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

      setPluginData(newPluginData)
      setPluginConfigs(newPluginConfigs)
    } catch (err) {
      console.error('Failed to load goal data:', err)
      setError(err as Error)
    } finally {
      setLoading(false)
      hasInitiallyLoadedRef.current = true
    }
  }, [userId, goalId, startDate, endDate, enabledAddons, enabled, registryInitialized, registry, addonsConfigLoaded])

  // Load data on mount and when params change
  useEffect(() => {
    loadData()
  }, [loadData])

  // Update plugin data
  const updatePluginData = useCallback(async (pluginId: string, date: string, updates: Record<string, any>) => {
    try {
      // Route to appropriate plugin or core feature
      if (pluginId === 'calendar') {
        // Calendar is a core feature with its own API
        await saveCalendarDay(userId, goalId, date, updates)
      } else {
        // Use plugin's data provider
        const plugin = registry.getPlugin(pluginId)
        if (plugin?.dataProvider) {
          const context = createPluginContext({ userId, goalId, pluginId })
          await plugin.dataProvider.saveDayData(context, date, updates)
        }
      }

      // Update local state optimistically
      setPluginData(prev => ({
        ...prev,
        [pluginId]: {
          ...prev[pluginId],
          [date]: {
            ...(prev[pluginId]?.[date] || {}),
            ...updates
          }
        }
      }))
    } catch (err) {
      console.error(`Failed to update ${pluginId} data:`, err)
      throw err
    }
  }, [userId, goalId, registry])

  // Update plugin config
  const updatePluginConfig = useCallback(async (pluginId: string, config: any) => {
    try {
      const plugin = registry.getPlugin(pluginId)
      if (plugin?.dataProvider?.saveConfig) {
        const context = createPluginContext({ userId, goalId, pluginId })
        await plugin.dataProvider.saveConfig(context, config)
      }
      setPluginConfigs(prev => ({
        ...prev,
        [pluginId]: config
      }))
    } catch (err) {
      console.error(`Failed to update ${pluginId} config:`, err)
      throw err
    }
  }, [userId, goalId, registry])

  return {
    pluginData,
    pluginConfigs,
    loading,
    error,
    updatePluginData,
    updatePluginConfig,
    reload: loadData
  }
}
