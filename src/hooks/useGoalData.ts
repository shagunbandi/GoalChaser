'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from './useAuth'
import { useGoals } from './useGoals'
import { useGoalDataLoader } from './useGoalDataLoader'
import type { TravelPlan } from '@/types'
import { toISODateString, getMsUntilMidnight, enumerateDateRange } from '@/utils'

/**
 * Main hook for goal data management
 * Now uses the new add-on-specific data loader architecture
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
    dayDetails,
    subjectConfigs,
    areaConfigs,
    budgets,
    sips,
    travelPlans,
    loading: dataLoading,
    error: dataError,
    updateDay,
    updateSubjectConfigs,
    updateAreaConfigs,
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

  // Subject management helpers
  const addSubjectConfig = useCallback(async (name: string) => {
    const newConfig = {
      id: `subject_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      name,
      topics: [],
      hasTopics: true
    }
    await updateSubjectConfigs([...subjectConfigs, newConfig])
  }, [subjectConfigs, updateSubjectConfigs])

  const removeSubjectConfig = useCallback(async (id: string) => {
    await updateSubjectConfigs(subjectConfigs.filter(s => s.id !== id))
  }, [subjectConfigs, updateSubjectConfigs])

  const updateSubjectConfig = useCallback(async (id: string, name: string) => {
    await updateSubjectConfigs(
      subjectConfigs.map(s => s.id === id ? { ...s, name } : s)
    )
  }, [subjectConfigs, updateSubjectConfigs])

  const toggleSubjectHasTopics = useCallback(async (id: string) => {
    await updateSubjectConfigs(
      subjectConfigs.map(s => s.id === id ? { ...s, hasTopics: !(s.hasTopics ?? true) } : s)
    )
  }, [subjectConfigs, updateSubjectConfigs])

  const addTopicToSubject = useCallback(async (subjectId: string, topic: string) => {
    await updateSubjectConfigs(
      subjectConfigs.map(s => 
        s.id === subjectId 
          ? { ...s, topics: [...s.topics, topic] }
          : s
      )
    )
  }, [subjectConfigs, updateSubjectConfigs])

  const removeTopicFromSubject = useCallback(async (subjectId: string, topic: string) => {
    await updateSubjectConfigs(
      subjectConfigs.map(s => 
        s.id === subjectId 
          ? { ...s, topics: s.topics.filter(t => t !== topic) }
          : s
      )
    )
  }, [subjectConfigs, updateSubjectConfigs])

  const updateTopicInSubject = useCallback(async (subjectId: string, oldTopic: string, newTopic: string) => {
    await updateSubjectConfigs(
      subjectConfigs.map(s => 
        s.id === subjectId 
          ? { ...s, topics: s.topics.map(t => t === oldTopic ? newTopic : t) }
          : s
      )
    )
  }, [subjectConfigs, updateSubjectConfigs])

  const isTopicInUse = useCallback((subjectId: string, topic: string): boolean => {
    return Object.values(dayDetails).some(day =>
      day.subjects?.some(entry =>
        subjectConfigs.find(s => s.id === subjectId)?.name === entry.subject &&
        entry.topics.includes(topic)
      )
    )
  }, [dayDetails, subjectConfigs])

  // Area management helpers (for productivity)
  const addAreaConfig = useCallback(async (name: string) => {
    const newConfig = {
      id: `area_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      name,
      topics: [],
      hasTopics: true
    }
    await updateAreaConfigs([...areaConfigs, newConfig])
  }, [areaConfigs, updateAreaConfigs])

  const removeAreaConfig = useCallback(async (id: string) => {
    await updateAreaConfigs(areaConfigs.filter(a => a.id !== id))
  }, [areaConfigs, updateAreaConfigs])

  const updateAreaConfig = useCallback(async (id: string, name: string) => {
    await updateAreaConfigs(
      areaConfigs.map(a => a.id === id ? { ...a, name } : a)
    )
  }, [areaConfigs, updateAreaConfigs])

  const toggleAreaHasTopics = useCallback(async (id: string) => {
    await updateAreaConfigs(
      areaConfigs.map(a => a.id === id ? { ...a, hasTopics: !(a.hasTopics ?? true) } : a)
    )
  }, [areaConfigs, updateAreaConfigs])

  const addTopicToArea = useCallback(async (areaId: string, topic: string) => {
    await updateAreaConfigs(
      areaConfigs.map(a =>
        a.id === areaId
          ? { ...a, topics: [...a.topics, topic] }
          : a
      )
    )
  }, [areaConfigs, updateAreaConfigs])

  const removeTopicFromArea = useCallback(async (areaId: string, topic: string) => {
    await updateAreaConfigs(
      areaConfigs.map(a =>
        a.id === areaId
          ? { ...a, topics: a.topics.filter(t => t !== topic) }
          : a
      )
    )
  }, [areaConfigs, updateAreaConfigs])

  const updateTopicInArea = useCallback(async (areaId: string, oldTopic: string, newTopic: string) => {
    await updateAreaConfigs(
      areaConfigs.map(a =>
        a.id === areaId
          ? { ...a, topics: a.topics.map(t => t === oldTopic ? newTopic : t) }
          : a
      )
    )
  }, [areaConfigs, updateAreaConfigs])

  const isAreaTopicInUse = useCallback((areaId: string, topic: string): boolean => {
    return Object.values(dayDetails).some(day =>
      day.areas?.some(entry =>
        areaConfigs.find(a => a.id === areaId)?.name === entry.area &&
        entry.topics.includes(topic)
      )
    )
  }, [dayDetails, areaConfigs])

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
      const plan: TravelPlan = {
        ...travel,
        id: `travel_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      }

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
  const handleSaveBudget = useCallback(async (budget: any) => {
    if (!user) return
    await saveBudget(budget)
  }, [user, saveBudget])

  const handleDeleteBudget = useCallback(async (budgetId: string) => {
    if (!user) return
    await deleteBudgetHandler(budgetId)
  }, [user, deleteBudgetHandler])

  // SIP handlers
  const handleSaveSIP = useCallback(async (sip: any) => {
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
    
    // Data
    dayDetails,
    subjectConfigs,
    areaConfigs,
    budgets,
    sips,
    travelPlans,

    // Subject handlers (for hours)
    handleAddSubject: addSubjectConfig,
    handleRemoveSubject: removeSubjectConfig,
    handleUpdateSubject: updateSubjectConfig,
    handleToggleHasTopics: toggleSubjectHasTopics,
    handleAddTopic: addTopicToSubject,
    handleRemoveTopic: removeTopicFromSubject,
    handleUpdateTopic: updateTopicInSubject,
    isTopicInUse,

    // Area handlers (for productivity)
    handleAddArea: addAreaConfig,
    handleRemoveArea: removeAreaConfig,
    handleUpdateArea: updateAreaConfig,
    handleToggleAreaHasTopics: toggleAreaHasTopics,
    handleAddAreaTopic: addTopicToArea,
    handleRemoveAreaTopic: removeTopicFromArea,
    handleUpdateAreaTopic: updateTopicInArea,
    isAreaTopicInUse,

    // Day details handler
    handleUpdateDetails: updateDay,
    
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
