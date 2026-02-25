'use client'

import { useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from './useAuth'
import { getFirebaseDb } from '@/lib/firebase-service'
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
  /** Set when goal is soft-deleted; excluded from list */
  deletedAt?: string | null
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

// ============ Query Keys ============
const goalsKeys = {
  all: ['goals'] as const,
  list: (userId: string) => [...goalsKeys.all, 'list', userId] as const,
}

// ============ Firebase Helpers ============
async function loadGoalsFromFirebase(userId: string): Promise<Goal[]> {
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
      if (data.deletedAt) return // soft-deleted: exclude from list
      goals.push({
        id: doc.id,
        name: data.name,
        description: data.description,
        createdAt: data.createdAt,
        color: data.color,
        startDate: data.startDate,
        endDate: data.endDate,
        deletedAt: data.deletedAt || null,
      })
    })

    logger.success(`Loaded ${goals.length} goals`)
    
    // Cache to localStorage
    const userStorageKey = `${STORAGE_KEY}_${userId}`
    saveToStorage(userStorageKey, goals)
    
    return goals
  } catch (error) {
    logger.error('Load failed', error)
    // Fallback to localStorage
    const userStorageKey = `${STORAGE_KEY}_${userId}`
    return loadFromStorage(userStorageKey, [])
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
      deletedAt: goal.deletedAt ?? null,
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
    const { doc, setDoc } = await import('firebase/firestore')
    const goalRef = doc(db, 'users', userId, 'goals', goalId)
    const deletedAt = new Date().toISOString()
    await setDoc(goalRef, { deletedAt, updatedAt: deletedAt }, { merge: true })
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

interface UpdateGoalOptions {
  name?: string
  description?: string
  color?: string
  startDate?: string
  endDate?: string
}

interface UseGoalsReturn {
  goals: Goal[]
  isLoading: boolean
  error: string | null
  createGoal: (options: CreateGoalOptions) => Promise<Goal>
  updateGoal: (id: string, updates: UpdateGoalOptions) => Promise<void>
  deleteGoal: (id: string) => Promise<void>
  getGoal: (id: string) => Goal | undefined
}

export function useGoals(): UseGoalsReturn {
  const { user, isLoading: authLoading } = useAuth()
  const queryClient = useQueryClient()
  const userId = user?.uid || ''

  // Query for goals - cached by React Query
  const {
    data: goals = [],
    isLoading: queryLoading,
    error: queryError,
  } = useQuery({
    queryKey: goalsKeys.list(userId),
    queryFn: () => loadGoalsFromFirebase(userId),
    enabled: !!userId && !authLoading,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    placeholderData: (previousData) => previousData, // Keep previous data during refetch
  })

  // Create goal mutation
  const createGoalMutation = useMutation({
    mutationFn: async (options: CreateGoalOptions): Promise<Goal> => {
      const newGoal: Goal = {
        id: `goal_${Date.now()}`,
        name: options.name.trim(),
        description: options.description?.trim(),
        createdAt: new Date().toISOString(),
        color: options.color,
        startDate: options.startDate,
        endDate: options.endDate,
      }

      if (userId) {
        await saveGoalToFirebase(userId, newGoal)
        
        // Save addon configuration if provided
        if (options.enabledPlugins && options.enabledPlugins.length > 0) {
          try {
            const { saveGoalAddonsConfig } = await import('@/lib/api/addon-config-api')
            await saveGoalAddonsConfig(userId, newGoal.id, {
              enabled: options.enabledPlugins as any[],
            })
          } catch (error) {
            logger.error('Failed to save addon config', error)
          }
        }
      }

      return newGoal
    },
    onSuccess: (newGoal) => {
      // Optimistically update cache
      queryClient.setQueryData(goalsKeys.list(userId), (old: Goal[] | undefined) => {
        const updated = [newGoal, ...(old || [])]
        // Also update localStorage
        const userStorageKey = `${STORAGE_KEY}_${userId}`
        saveToStorage(userStorageKey, updated)
        return updated
      })
    },
  })

  // Update goal mutation
  const updateGoalMutation = useMutation({
    mutationFn: async ({ goalId, updates }: { goalId: string; updates: UpdateGoalOptions }) => {
      const existingGoal = goals.find((g) => g.id === goalId)
      if (!existingGoal) throw new Error('Goal not found')
      
      const updatedGoal: Goal = {
        ...existingGoal,
        ...updates,
      }
      
      if (userId) {
        await saveGoalToFirebase(userId, updatedGoal)
      }
      
      return updatedGoal
    },
    onSuccess: (updatedGoal) => {
      // Optimistically update cache
      queryClient.setQueryData(goalsKeys.list(userId), (old: Goal[] | undefined) => {
        const updated = (old || []).map((g) => g.id === updatedGoal.id ? updatedGoal : g)
        // Also update localStorage
        const userStorageKey = `${STORAGE_KEY}_${userId}`
        saveToStorage(userStorageKey, updated)
        return updated
      })
    },
  })

  // Delete goal mutation
  const deleteGoalMutation = useMutation({
    mutationFn: async (goalId: string) => {
      if (userId) {
        await deleteGoalFromFirebase(userId, goalId)
      }
      return goalId
    },
    onSuccess: (goalId) => {
      // Optimistically update cache
      queryClient.setQueryData(goalsKeys.list(userId), (old: Goal[] | undefined) => {
        const updated = (old || []).filter((g) => g.id !== goalId)
        // Also update localStorage
        const userStorageKey = `${STORAGE_KEY}_${userId}`
        saveToStorage(userStorageKey, updated)
        return updated
      })
    },
  })

  const createGoal = useCallback(
    async (options: CreateGoalOptions): Promise<Goal> => {
      return createGoalMutation.mutateAsync(options)
    },
    [createGoalMutation]
  )

  const updateGoal = useCallback(
    async (id: string, updates: UpdateGoalOptions): Promise<void> => {
      await updateGoalMutation.mutateAsync({ goalId: id, updates })
    },
    [updateGoalMutation]
  )

  const deleteGoal = useCallback(
    async (id: string): Promise<void> => {
      await deleteGoalMutation.mutateAsync(id)
    },
    [deleteGoalMutation]
  )

  const getGoal = useCallback(
    (id: string): Goal | undefined => {
      return goals.find((g) => g.id === id)
    },
    [goals]
  )

  return {
    goals,
    isLoading: authLoading || (queryLoading && goals.length === 0),
    error: queryError ? 'Failed to load goals' : null,
    createGoal,
    updateGoal,
    deleteGoal,
    getGoal,
  }
}
