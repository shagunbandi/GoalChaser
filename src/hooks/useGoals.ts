'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './useAuth'
import { getFirebaseDb, isUsingEmulator } from '@/lib/firebase-service'
import { logger } from '@/lib/logger'

// ============ Types ============
export interface Goal {
  id: string
  name: string
  description?: string
  createdAt: string
  color?: string
  startDate?: string
  endDate?: string
}

// ============ LocalStorage Keys ============
const STORAGE_KEY = 'nitya_goals'

// ============ LocalStorage Helpers ============
function loadFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue
  try {
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : defaultValue
  } catch {
    return defaultValue
  }
}

function saveToStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    logger.error('Error saving to localStorage', error)
  }
}

// ============ Firebase Helpers ============
async function loadGoalsFromFirebase(userId: string): Promise<Goal[] | null> {
  try {
    logger.progress('Loading goals...')
    
    const db = getFirebaseDb()
    const { collection, getDocs, query, orderBy } = await import('firebase/firestore')
    
    const goalsRef = collection(db, 'users', userId, 'goals')
    const q = query(goalsRef, orderBy('createdAt', 'desc'))
    const querySnapshot = await getDocs(q)

    const goals: Goal[] = []
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      goals.push({
        id: doc.id,
        name: data.name,
        description: data.description,
        createdAt: data.createdAt,
        color: data.color,
        startDate: data.startDate,
        endDate: data.endDate,
      })
    })

    logger.success(`Loaded ${goals.length} goals`)
    return goals
  } catch (error) {
    logger.error('Load failed', error)
    return null
  }
}

async function saveGoalToFirebase(userId: string, goal: Goal): Promise<boolean> {
  try {
    logger.progress('Saving goal...')
    
    const db = getFirebaseDb()
    const { doc, setDoc } = await import('firebase/firestore')
    
    const goalRef = doc(db, 'users', userId, 'goals', goal.id)
    await setDoc(goalRef, {
      name: goal.name,
      description: goal.description || '',
      createdAt: goal.createdAt,
      color: goal.color || '',
      startDate: goal.startDate || null,
      endDate: goal.endDate || null,
      updatedAt: new Date().toISOString(),
    })
    logger.success('Goal saved')
    return true
  } catch (error) {
    logger.error('Save failed', error)
    return false
  }
}

async function deleteGoalFromFirebase(userId: string, goalId: string): Promise<boolean> {
  try {
    logger.progress('Deleting goal...')
    
    const db = getFirebaseDb()
    const { doc, deleteDoc } = await import('firebase/firestore')
    
    const goalRef = doc(db, 'users', userId, 'goals', goalId)
    await deleteDoc(goalRef)
    logger.success('Goal deleted')
    return true
  } catch (error) {
    logger.error('Delete failed', error)
    return false
  }
}

// ============ Main Hook ============
interface CreateGoalOptions {
  name: string
  description?: string
  color?: string
  startDate?: string
  endDate?: string
  enabledPlugins?: string[]
}

interface UseGoalsReturn {
  goals: Goal[]
  isLoading: boolean
  error: string | null
  createGoal: (options: CreateGoalOptions) => Promise<Goal>
  deleteGoal: (id: string) => Promise<void>
  getGoal: (id: string) => Goal | undefined
}

export function useGoals(): UseGoalsReturn {
  const { user, isLoading: authLoading } = useAuth()
  const [goals, setGoals] = useState<Goal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isUsingFirebase, setIsUsingFirebase] = useState(false)

  // Get user ID for storage
  const userId = user?.uid || 'default_user'
  const userStorageKey = `${STORAGE_KEY}_${userId}`

  // Load initial data
  useEffect(() => {
    async function loadData() {
      if (authLoading) return

      try {
        setIsLoading(true)
        setError(null)

        if (user) {
          const loadedGoals = await loadGoalsFromFirebase(user.uid)

          if (loadedGoals !== null) {
            setIsUsingFirebase(true)
            setGoals(loadedGoals)
            saveToStorage(userStorageKey, loadedGoals)
          } else {
            setIsUsingFirebase(false)
            setGoals(loadFromStorage(userStorageKey, []))
          }
        } else {
          setIsUsingFirebase(false)
          setGoals([])
        }
      } catch (err) {
        logger.error('Load failed', err)
        setError('Failed to load goals')
        setIsUsingFirebase(false)
        setGoals(loadFromStorage(userStorageKey, []))
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [user, authLoading, userStorageKey])

  const createGoal = useCallback(
    async (options: CreateGoalOptions): Promise<Goal> => {
      const newGoal: Goal = {
        id: `goal_${Date.now()}`,
        name: options.name.trim(),
        description: options.description?.trim(),
        createdAt: new Date().toISOString(),
        color: options.color,
        startDate: options.startDate,
        endDate: options.endDate,
      }

      const newGoals = [newGoal, ...goals]
      setGoals(newGoals)
      saveToStorage(userStorageKey, newGoals)

      if (isUsingFirebase && user) {
        await saveGoalToFirebase(user.uid, newGoal)
        
        // Save addon configuration if provided
        if (options.enabledPlugins && options.enabledPlugins.length > 0) {
          try {
            const { saveGoalAddonsConfig } = await import('@/lib/api/addon-config-api')
            await saveGoalAddonsConfig(user.uid, newGoal.id, {
              enabled: options.enabledPlugins as any[],
            })
          } catch (error) {
            logger.error('Failed to save addon config', error)
          }
        }
      }

      return newGoal
    },
    [goals, isUsingFirebase, user, userStorageKey],
  )

  const deleteGoal = useCallback(
    async (id: string) => {
      const newGoals = goals.filter((g) => g.id !== id)
      setGoals(newGoals)
      saveToStorage(userStorageKey, newGoals)

      if (isUsingFirebase && user) {
        await deleteGoalFromFirebase(user.uid, id)
      }
    },
    [goals, isUsingFirebase, user, userStorageKey],
  )

  const getGoal = useCallback(
    (id: string) => {
      return goals.find((g) => g.id === id)
    },
    [goals],
  )

  return {
    goals,
    isLoading: isLoading || authLoading,
    error,
    createGoal,
    deleteGoal,
    getGoal,
  }
}
