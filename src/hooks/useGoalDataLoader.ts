'use client'

import { useState, useEffect, useCallback } from 'react'
import type { AddonId } from '@/types'
import { loadCalendarDays, saveCalendarDay } from '@/components/features/calendar/api'
// Exception: Finance and Travel APIs are imported directly for non-day-based data
// (budgets, SIPs, travel plans) which don't fit the standard day data provider pattern
import { 
  loadBudgetsFromFirebase,
  saveBudgetToFirebase,
  deleteBudgetFromFirebase,
  loadSIPsFromFirebase,
  saveSIPToFirebase,
  deleteSIPFromFirebase,
  setFirebaseDb
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
  
  // Non-day-based data (plugin-specific for now, but not tied to days)
  budgets: BudgetPlan[]
  sips: SIPPlan[]
  travelPlans: TravelPlan[]
  
  // Loading state
  loading: boolean
  error: Error | null
  
  // Save methods
  updatePluginData: (pluginId: string, date: string, updates: Partial<PluginDayData>) => Promise<void>
  updatePluginConfig: (pluginId: string, config: PluginConfigData) => Promise<void>
  saveBudget: (budget: BudgetPlan) => Promise<void>
  deleteBudget: (budgetId: string) => Promise<void>
  saveSIP: (sip: SIPPlan) => Promise<void>
  deleteSIP: (sipId: string) => Promise<void>
  saveTravelPlan: (plan: TravelPlan) => Promise<void>
  deleteTravelPlan: (planId: string) => Promise<void>
  
  // Reload methods
  reload: () => Promise<void>
}

/**
 * Smart data loader hook that:
 * 1. Loads data from all enabled add-ons in parallel
 * 2. Stores plugin data separately by pluginId
 * 3. Provides save methods that route to correct plugins
 * 4. Handles caching and selective reloading
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
  const [budgets, setBudgets] = useState<BudgetPlan[]>([])
  const [sips, setSips] = useState<SIPPlan[]>([])
  const [travelPlans, setTravelPlans] = useState<TravelPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [enabledAddons, setEnabledAddons] = useState<AddonId[]>(['calendar'])
  
  // Get plugin registry
  const { registry, initialized: registryInitialized } = usePluginRegistry()

  // Initialize Firebase DB
  useEffect(() => {
    async function init() {
      const app = getFirebaseApp()
      if (app) {
        const db = getFirestore(app)
        setFirebaseDb(db)
      }
      
      // Also initialize firebase-client for travel-api and other APIs
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
      }
    }
    
    loadAddonsConfig()
  }, [userId, goalId])

  // Main data loading function
  const loadData = useCallback(async () => {
    // Don't load if not enabled or userId is missing or registry not initialized
    if (!enabled || !userId || !registryInitialized) {
      setLoading(false)
      return
    }

    setLoading(true)
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
      
      // Load finance-specific data (budgets, SIPs) - these are not day-based
      let budgetsData: BudgetPlan[] = []
      let sipsData: SIPPlan[] = []
      if (enabledAddons.includes('finance')) {
        budgetsData = await loadBudgetsFromFirebase(userId, goalId)
        sipsData = await loadSIPsFromFirebase(userId, goalId)
      }
      
      // Note: Travel data is now loaded via the plugin's data provider (day-based storage)
      // No need to load from the old plans collection

      setPluginData(newPluginData)
      setPluginConfigs(newPluginConfigs)
      setBudgets(budgetsData)
      setSips(sipsData)
      setTravelPlans([])
    } catch (err) {
      console.error('Failed to load goal data:', err)
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [userId, goalId, startDate, endDate, enabledAddons, enabled, registryInitialized, registry])

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

  // Budget handlers
  const saveBudgetHandler = useCallback(async (budget: any) => {
    try {
      await saveBudgetToFirebase(userId, goalId, budget)
      setBudgets(prev => {
        const existing = prev.findIndex(b => b.id === budget.id)
        if (existing >= 0) {
          const updated = [...prev]
          updated[existing] = budget
          return updated
        }
        return [...prev, budget]
      })
    } catch (err) {
      console.error('Failed to save budget:', err)
      throw err
    }
  }, [userId, goalId])

  const deleteBudgetHandler = useCallback(async (budgetId: string) => {
    try {
      await deleteBudgetFromFirebase(userId, goalId, budgetId)
      setBudgets(prev => prev.filter(b => b.id !== budgetId))
    } catch (err) {
      console.error('Failed to delete budget:', err)
      throw err
    }
  }, [userId, goalId])

  // SIP handlers
  const saveSIPHandler = useCallback(async (sip: any) => {
    try {
      await saveSIPToFirebase(userId, goalId, sip)
      setSips(prev => {
        const existing = prev.findIndex(s => s.id === sip.id)
        if (existing >= 0) {
          const updated = [...prev]
          updated[existing] = sip
          return updated
        }
        return [...prev, sip]
      })
    } catch (err) {
      console.error('Failed to save SIP:', err)
      throw err
    }
  }, [userId, goalId])

  const deleteSIPHandler = useCallback(async (sipId: string) => {
    try {
      await deleteSIPFromFirebase(userId, goalId, sipId)
      setSips(prev => prev.filter(s => s.id !== sipId))
    } catch (err) {
      console.error('Failed to delete SIP:', err)
      throw err
    }
  }, [userId, goalId])

  // Travel handlers
  const saveTravelPlanHandler = useCallback(async (plan: any) => {
    try {
      await saveTravelPlan(userId, goalId, plan)
      setTravelPlans(prev => {
        const existing = prev.findIndex(t => t.id === plan.id)
        if (existing >= 0) {
          const updated = [...prev]
          updated[existing] = plan
          return updated
        }
        return [...prev, plan]
      })
      // Also reload to update date-based data
      await loadData()
    } catch (err) {
      console.error('Failed to save travel plan:', err)
      throw err
    }
  }, [userId, goalId, loadData])

  const deleteTravelPlanHandler = useCallback(async (planId: string) => {
    try {
      await deleteTravelPlan(userId, goalId, planId)
      setTravelPlans(prev => prev.filter(t => t.id !== planId))
      // Also reload to update date-based data
      await loadData()
    } catch (err) {
      console.error('Failed to delete travel plan:', err)
      throw err
    }
  }, [userId, goalId, loadData])

  return {
    pluginData,
    pluginConfigs,
    budgets,
    sips,
    travelPlans,
    loading,
    error,
    updatePluginData,
    updatePluginConfig,
    saveBudget: saveBudgetHandler,
    deleteBudget: deleteBudgetHandler,
    saveSIP: saveSIPHandler,
    deleteSIP: deleteSIPHandler,
    saveTravelPlan: saveTravelPlanHandler,
    deleteTravelPlan: deleteTravelPlanHandler,
    reload: loadData
  }
}
