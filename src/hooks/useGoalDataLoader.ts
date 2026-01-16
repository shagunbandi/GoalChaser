'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import type { 
  DayDetails, 
  SubjectConfig, 
  AreaConfig,
  BudgetPlan, 
  SIPPlan, 
  TravelPlan,
  AddonId 
} from '@/types'
import { loadCalendarDays, saveCalendarDay } from '@/lib/api/calendar-api'
import { loadProductivityDays, saveProductivityDay, loadProductivityConfig, saveProductivityConfig } from '@/lib/api/productivity-api'
import { loadHoursDays, saveHoursDay, loadHoursConfig, saveHoursConfig } from '@/lib/api/hours-api'
import { 
  loadFinanceTransactions, 
  saveFinanceTransaction,
  loadBudgetsFromFirebase,
  saveBudgetToFirebase,
  deleteBudgetFromFirebase,
  loadSIPsFromFirebase,
  saveSIPToFirebase,
  deleteSIPFromFirebase
} from '@/lib/api/budget-api'
import { loadTravelPlans, saveTravelPlan, deleteTravelPlan } from '@/lib/api/travel-api'
import { setFirebaseDb } from '@/lib/api/budget-api'
import { getFirestore } from 'firebase/firestore'
import { getFirebaseApp } from '@/lib/firebase-service'
import { loadGoalAddonsConfig } from '@/lib/api/addon-config-api'

interface UseGoalDataLoaderParams {
  userId: string
  goalId: string
  startDate: string
  endDate: string
  enabled?: boolean  // Only load data when enabled (default true)
}

interface UseGoalDataLoaderResult {
  // Aggregated data
  dayDetails: Record<string, DayDetails>
  subjectConfigs: SubjectConfig[]
  areaConfigs: AreaConfig[]
  budgets: BudgetPlan[]
  sips: SIPPlan[]
  travelPlans: TravelPlan[]
  
  // Loading state
  loading: boolean
  error: Error | null
  
  // Save methods
  updateDay: (date: string, updates: Partial<DayDetails>) => Promise<void>
  updateSubjectConfigs: (configs: SubjectConfig[]) => Promise<void>
  updateAreaConfigs: (configs: AreaConfig[]) => Promise<void>
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
 * 2. Aggregates data into a single DayDetails record
 * 3. Provides save methods that route to correct APIs
 * 4. Handles caching and selective reloading
 */
export function useGoalDataLoader({
  userId,
  goalId,
  startDate,
  endDate,
  enabled = true
}: UseGoalDataLoaderParams): UseGoalDataLoaderResult {
  const [dayDetails, setDayDetails] = useState<Record<string, DayDetails>>({})
  const [subjectConfigs, setSubjectConfigs] = useState<SubjectConfig[]>([])
  const [areaConfigs, setAreaConfigs] = useState<AreaConfig[]>([])
  const [budgets, setBudgets] = useState<BudgetPlan[]>([])
  const [sips, setSips] = useState<SIPPlan[]>([])
  const [travelPlans, setTravelPlans] = useState<TravelPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [enabledAddons, setEnabledAddons] = useState<AddonId[]>(['calendar'])

  // Initialize Firebase DB
  useEffect(() => {
    const app = getFirebaseApp()
    if (app) {
      const db = getFirestore(app)
      setFirebaseDb(db)
    }
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
    // Don't load if not enabled or userId is missing
    if (!enabled || !userId) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Create promises for all enabled add-ons
      const promises: Promise<any>[] = []
      
      // Calendar (always loaded)
      promises.push(loadCalendarDays(userId, goalId, startDate, endDate))
      
      // Productivity + config
      if (enabledAddons.includes('productivity')) {
        promises.push(loadProductivityDays(userId, goalId, startDate, endDate))
        promises.push(loadProductivityConfig(userId, goalId))
      } else {
        promises.push(Promise.resolve({}))
        promises.push(Promise.resolve([]))
      }
      
      // Hours + config
      if (enabledAddons.includes('hours')) {
        promises.push(loadHoursDays(userId, goalId, startDate, endDate))
        promises.push(loadHoursConfig(userId, goalId))
      } else {
        promises.push(Promise.resolve({}))
        promises.push(Promise.resolve([]))
      }
      
      // Finance
      if (enabledAddons.includes('finance')) {
        promises.push(loadFinanceTransactions(userId, goalId, startDate, endDate))
        promises.push(loadBudgetsFromFirebase(userId, goalId))
        promises.push(loadSIPsFromFirebase(userId, goalId))
      } else {
        promises.push(Promise.resolve({}))
        promises.push(Promise.resolve([]))
        promises.push(Promise.resolve([]))
      }
      
      // Travel
      if (enabledAddons.includes('travel')) {
        promises.push(loadTravelPlans(userId, goalId, startDate, endDate))
      } else {
        promises.push(Promise.resolve([]))
      }

      // Execute all queries in parallel
      const [
        calendarData,
        productivityData,
        productivityConfigData,
        hoursData,
        hoursConfigData,
        financeData,
        budgetsData,
        sipsData,
        travelData
      ] = await Promise.all(promises)

      // Aggregate data into DayDetails format
      const aggregated: Record<string, DayDetails> = {}
      
      // Get all dates covered by travel plans
      const travelDates = new Set<string>()
      travelData.forEach((plan: TravelPlan) => {
        const start = new Date(plan.startDate)
        const end = new Date(plan.endDate)
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().split('T')[0]
          travelDates.add(dateStr)
        }
      })
      
      // Get all unique dates from all sources including travel
      const allDates = new Set<string>([
        ...Object.keys(calendarData),
        ...Object.keys(productivityData),
        ...Object.keys(hoursData),
        ...Object.keys(financeData),
        ...travelDates
      ])

      // Aggregate each date
      for (const date of allDates) {
        const calendar = calendarData[date] || { note: '', agendaItems: [] }
        const productivity = productivityData[date] || { status: null, areas: [] }
        const hours = hoursData[date] || { subjects: [], directHours: 0 }
        const finance = financeData[date] || { expenses: [], income: [] }

        aggregated[date] = {
          // Calendar
          note: calendar.note,
          agendaItems: calendar.agendaItems,
          
          // Productivity
          status: productivity.status,
          areas: productivity.areas,
          
          // Hours
          subjects: hours.subjects,
          directHours: hours.directHours,
          subject: '',
          topic: '',
          
          // Finance
          expenses: finance.expenses,
          income: finance.income,
          
          // Travel (aggregated separately)
          travelPlans: travelData.filter((plan: TravelPlan) => 
            plan.startDate <= date && plan.endDate >= date
          )
        }
      }

      setDayDetails(aggregated)
      setSubjectConfigs(hoursConfigData)
      setAreaConfigs(productivityConfigData)
      setBudgets(budgetsData)
      setSips(sipsData)
      setTravelPlans(travelData)
    } catch (err) {
      console.error('Failed to load goal data:', err)
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [userId, goalId, startDate, endDate, enabledAddons, enabled])

  // Load data on mount and when params change
  useEffect(() => {
    loadData()
  }, [loadData])

  // Update day details
  const updateDay = useCallback(async (date: string, updates: Partial<DayDetails>) => {
    try {
      // Determine which add-on APIs to call based on updates
      const promises: Promise<any>[] = []

      // Calendar updates
      if ('note' in updates || 'agendaItems' in updates) {
        promises.push(saveCalendarDay(userId, goalId, date, {
          note: updates.note,
          agendaItems: updates.agendaItems
        }))
      }

      // Productivity updates
      if ('status' in updates || 'areas' in updates) {
        promises.push(saveProductivityDay(userId, goalId, date, {
          status: updates.status ?? null,
          areas: updates.areas
        }))
      }

      // Hours updates
      if ('subjects' in updates || 'directHours' in updates) {
        promises.push(saveHoursDay(userId, goalId, date, {
          subjects: updates.subjects,
          directHours: updates.directHours
        }))
      }

      // Finance updates
      if ('expenses' in updates || 'income' in updates) {
        promises.push(saveFinanceTransaction(userId, goalId, date, {
          expenses: updates.expenses,
          income: updates.income
        }))
      }

      // Travel updates (handled differently - by plan ID)
      if ('travelPlans' in updates && updates.travelPlans) {
        for (const plan of updates.travelPlans) {
          promises.push(saveTravelPlan(userId, goalId, plan))
        }
      }

      await Promise.all(promises)

      // Update local state optimistically
      setDayDetails(prev => ({
        ...prev,
        [date]: {
          ...prev[date],
          ...updates
        }
      }))
    } catch (err) {
      console.error('Failed to update day:', err)
      throw err
    }
  }, [userId, goalId])

  // Update subject configs
  const updateSubjectConfigs = useCallback(async (configs: SubjectConfig[]) => {
    try {
      await saveHoursConfig(userId, goalId, configs)
      setSubjectConfigs(configs)
    } catch (err) {
      console.error('Failed to update subject configs:', err)
      throw err
    }
  }, [userId, goalId])

  // Update area configs
  const updateAreaConfigs = useCallback(async (configs: AreaConfig[]) => {
    try {
      await saveProductivityConfig(userId, goalId, configs)
      setAreaConfigs(configs)
    } catch (err) {
      console.error('Failed to update area configs:', err)
      throw err
    }
  }, [userId, goalId])

  // Budget handlers
  const saveBudget = useCallback(async (budget: BudgetPlan) => {
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

  const deleteBudget = useCallback(async (budgetId: string) => {
    try {
      await deleteBudgetFromFirebase(userId, goalId, budgetId)
      setBudgets(prev => prev.filter(b => b.id !== budgetId))
    } catch (err) {
      console.error('Failed to delete budget:', err)
      throw err
    }
  }, [userId, goalId])

  // SIP handlers
  const saveSIP = useCallback(async (sip: SIPPlan) => {
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

  const deleteSIP = useCallback(async (sipId: string) => {
    try {
      await deleteSIPFromFirebase(userId, goalId, sipId)
      setSips(prev => prev.filter(s => s.id !== sipId))
    } catch (err) {
      console.error('Failed to delete SIP:', err)
      throw err
    }
  }, [userId, goalId])

  // Travel handlers
  const saveTravelPlanHandler = useCallback(async (plan: TravelPlan) => {
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
      // Also update dayDetails to include this plan in relevant dates
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
      // Also update dayDetails to remove this plan from dates
      await loadData()
    } catch (err) {
      console.error('Failed to delete travel plan:', err)
      throw err
    }
  }, [userId, goalId, loadData])

  return {
    dayDetails,
    subjectConfigs,
    areaConfigs,
    budgets,
    sips,
    travelPlans,
    loading,
    error,
    updateDay,
    updateSubjectConfigs,
    updateAreaConfigs,
    saveBudget,
    deleteBudget,
    saveSIP,
    deleteSIP,
    saveTravelPlan: saveTravelPlanHandler,
    deleteTravelPlan: deleteTravelPlanHandler,
    reload: loadData
  }
}
