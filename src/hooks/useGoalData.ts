'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from './useAuth'
import { useFirebase } from './useFirebase'
import { useGoals } from './useGoals'
import type { BudgetPlan, SIPPlan, DayDetails, TravelPlan } from '@/types'
import {
  setFirebaseDb,
  loadBudgetsFromFirebase,
  saveBudgetToFirebase,
  deleteBudgetFromFirebase,
  loadSIPsFromFirebase,
  saveSIPToFirebase,
  deleteSIPFromFirebase,
} from '@/lib/api/budget-api'
import { getFirestore } from 'firebase/firestore'
import { getFirebaseApp } from '@/lib/firebase-service'
import { toISODateString, getMsUntilMidnight, enumerateDateRange } from '@/utils'

export function useGoalData(goalId: string) {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const { getGoal, isLoading: goalsLoading } = useGoals()
  const goal = getGoal(goalId)

  // Firebase hook for data persistence
  const {
    dayDetails,
    subjectConfigs,
    isLoading: firebaseLoading,
    error: firebaseError,
    updateDayDetails,
    addSubjectConfig,
    removeSubjectConfig,
    updateSubjectConfig,
    toggleSubjectHasTopics,
    addTopicToSubject,
    removeTopicFromSubject,
    updateTopicInSubject,
    isTopicInUse,
  } = useFirebase(goalId)

  // Budgeting data
  const [budgets, setBudgets] = useState<BudgetPlan[]>([])
  const [sips, setSips] = useState<SIPPlan[]>([])
  const [budgetingLoading, setBudgetingLoading] = useState(true)

  // Today's date
  const [todayISO, setTodayISO] = useState(() => toISODateString(new Date()))

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

  // Load budgets and SIPs from Firebase
  useEffect(() => {
    if (!user) return

    const loadBudgetingData = async () => {
      try {
        const app = getFirebaseApp()
        if (!app) return

        const db = getFirestore(app)
        setFirebaseDb(db)

        const [loadedBudgets, loadedSIPs] = await Promise.all([
          loadBudgetsFromFirebase(user.uid, goalId),
          loadSIPsFromFirebase(user.uid, goalId),
        ])

        setBudgets(loadedBudgets)
        setSips(loadedSIPs)
      } catch (error) {
        console.error('Failed to load budgeting data:', error)
      } finally {
        setBudgetingLoading(false)
      }
    }

    loadBudgetingData()
  }, [user, goalId])

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/')
    }
  }, [authLoading, user, router])

  // Travel handler
  const handleAddTravel = async (travel: Omit<TravelPlan, 'id'>) => {
    pushStatus({ text: 'Saving travel…', tone: 'progress' })

    try {
      const plan: TravelPlan = {
        ...travel,
        id: `travel_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      }

      const dates = enumerateDateRange(plan.startDate, plan.endDate)

      pushStatus({
        text: `Saving travel to ${dates.length} day${
          dates.length === 1 ? '' : 's'
        }...`,
        tone: 'progress',
      })

      const results = await Promise.all(
        dates.map(async (iso) => {
          const existing = dayDetails[iso]?.travelPlans || []
          const filtered = existing.filter((t) => t.id !== plan.id)
          const updatedPlans = [...filtered, plan]

          try {
            await updateDayDetails(iso, { travelPlans: updatedPlans })
            return { success: true, iso }
          } catch (error) {
            console.error(`Failed to save to ${iso}:`, error)
            return { success: false, iso, error }
          }
        }),
      )

      const successCount = results.filter((r) => r.success).length
      const failCount = results.length - successCount

      if (failCount > 0) {
        pushStatus({
          text: `Travel saved to ${successCount}/${dates.length} days (${failCount} failed)`,
          tone: 'error',
        })
      } else {
        pushStatus({
          text: `Travel saved to ${dates.length} day${
            dates.length === 1 ? '' : 's'
          }`,
          tone: 'success',
        })
      }
    } catch (err) {
      console.error('Failed to save travel:', err)
      pushStatus({ text: 'Failed to save travel', tone: 'error' })
    }
  }

  // Budget handlers
  const handleSaveBudget = async (budget: BudgetPlan) => {
    if (!user) return

    const success = await saveBudgetToFirebase(user.uid, goalId, budget)
    if (success) {
      setBudgets((prev) => {
        const existing = prev.findIndex((b) => b.id === budget.id)
        if (existing >= 0) {
          const updated = [...prev]
          updated[existing] = budget
          return updated
        }
        return [...prev, budget]
      })
    }
  }

  const handleDeleteBudget = async (budgetId: string) => {
    if (!user) return

    const success = await deleteBudgetFromFirebase(user.uid, goalId, budgetId)
    if (success) {
      setBudgets((prev) => prev.filter((b) => b.id !== budgetId))
    }
  }

  // SIP handlers
  const handleSaveSIP = async (sip: SIPPlan) => {
    if (!user) return

    const success = await saveSIPToFirebase(user.uid, goalId, sip)
    if (success) {
      setSips((prev) => {
        const existing = prev.findIndex((s) => s.id === sip.id)
        if (existing >= 0) {
          const updated = [...prev]
          updated[existing] = sip
          return updated
        }
        return [...prev, sip]
      })
    }
  }

  const handleDeleteSIP = async (sipId: string) => {
    if (!user) return

    const success = await deleteSIPFromFirebase(user.uid, goalId, sipId)
    if (success) {
      setSips((prev) => prev.filter((s) => s.id !== sipId))
    }
  }

  return {
    // Goal data
    goal,
    goalId,
    user,
    
    // Loading states
    isLoading: authLoading || goalsLoading || firebaseLoading || budgetingLoading,
    authLoading,
    goalsLoading,
    firebaseLoading,
    budgetingLoading,
    firebaseError,
    
    // Date state
    todayISO,
    
    // Data
    dayDetails,
    subjectConfigs,
    budgets,
    sips,
    
    // Subject handlers
    handleAddSubject: addSubjectConfig,
    handleRemoveSubject: removeSubjectConfig,
    handleUpdateSubject: updateSubjectConfig,
    handleToggleHasTopics: toggleSubjectHasTopics,
    handleAddTopic: addTopicToSubject,
    handleRemoveTopic: removeTopicFromSubject,
    handleUpdateTopic: updateTopicInSubject,
    isTopicInUse,
    
    // Day details handler
    handleUpdateDetails: updateDayDetails,
    
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
  }
}
