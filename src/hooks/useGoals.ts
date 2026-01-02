'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './useAuth'
import { getFirebaseDb, isUsingEmulator } from '@/lib/firebase-service'
import type { SuccessCriterion } from '@/types'
import { logger } from '@/utils/logger'

// ============ Types ============
export interface Goal {
  id: string
  name: string
  description?: string
  createdAt: string
  color?: string
  startDate?: string
  endDate?: string
  successCriterion?: SuccessCriterion
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
    logger.progress('Loading goals from Firebase...')
    
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
        successCriterion: data.successCriterion,
      })
    })

    logger.success(`Loaded ${goals.length} goals from Firebase${isUsingEmulator() ? ' (emulator)' : ''}`)
    return goals
  } catch (error) {
    logger.error('Firebase goals read failed', error)
    return null
  }
}

async function saveGoalToFirebase(userId: string, goal: Goal): Promise<boolean> {
  try {
    logger.progress(`Saving goal ${goal.name}`)
    
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
      successCriterion: goal.successCriterion || null,
      updatedAt: new Date().toISOString(),
    })
    logger.success(`Saved goal ${goal.name}${isUsingEmulator() ? ' (emulator)' : ''}`)
    return true
  } catch (error) {
    logger.error('Firebase goal save failed', error)
    return false
  }
}

async function deleteGoalFromFirebase(userId: string, goalId: string): Promise<boolean> {
  try {
    logger.progress(`Deleting goal`)
    
    const db = getFirebaseDb()
    const { doc, deleteDoc } = await import('firebase/firestore')
    
    const goalRef = doc(db, 'users', userId, 'goals', goalId)
    await deleteDoc(goalRef)
    logger.success(`Deleted goal from Firebase${isUsingEmulator() ? ' (emulator)' : ''}`)
    return true
  } catch (error) {
    logger.error('Firebase goal delete failed', error)
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
  successCriterion?: SuccessCriterion
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
      logger.info('Loading goals...')
      
      // Wait for auth to finish loading
      if (authLoading) return

      try {
        logger.progress('Starting goals load...')
        setIsLoading(true)
        setError(null)

        // If user is logged in, load from Firebase with their user ID
        if (user) {
          const loadedGoals = await loadGoalsFromFirebase(user.uid)

          if (loadedGoals !== null) {
            logger.success('Firebase goals loaded successfully')
            setIsUsingFirebase(true)
            setGoals(loadedGoals)
            saveToStorage(userStorageKey, loadedGoals)
          } else {
            logger.info('Firebase unavailable, using localStorage')
            setIsUsingFirebase(false)
            setGoals(loadFromStorage(userStorageKey, []))
          }
        } else {
          // Not logged in, use localStorage with default key
          logger.info('User not logged in, clearing goals')
          setIsUsingFirebase(false)
          setGoals([])
        }
      } catch (err) {
        logger.error('Error loading goals', err)
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
        successCriterion: options.successCriterion,
      }

      const newGoals = [newGoal, ...goals]
      setGoals(newGoals)
      saveToStorage(userStorageKey, newGoals)

      if (isUsingFirebase && user) {
        await saveGoalToFirebase(user.uid, newGoal)
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
