'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './useAuth'

// ============ Types ============
export interface Goal {
  id: string
  name: string
  description?: string
  createdAt: string
  color?: string
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
    console.error('Error saving to localStorage:', error)
  }
}

// ============ Firebase Helpers ============
let firebaseAvailable = true
let db: ReturnType<typeof import('firebase/firestore').getFirestore> | null = null

async function initFirebase() {
  if (!firebaseAvailable) return null

  try {
    const { initializeApp, getApps } = await import('firebase/app')
    const { getFirestore } = await import('firebase/firestore')

    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    }

    if (!firebaseConfig.projectId) {
      console.warn('Firebase config missing, using localStorage only')
      firebaseAvailable = false
      return null
    }

    const app =
      getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
    db = getFirestore(app)
    return db
  } catch (error) {
    console.warn('Firebase initialization failed, using localStorage:', error)
    firebaseAvailable = false
    return null
  }
}

async function loadGoalsFromFirebase(userId: string): Promise<Goal[] | null> {
  if (!firebaseAvailable || !db) return null

  try {
    const { collection, getDocs, query, orderBy } = await import(
      'firebase/firestore'
    )
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
      })
    })

    return goals
  } catch (error) {
    console.warn('Firebase goals read failed:', error)
    return null
  }
}

async function saveGoalToFirebase(userId: string, goal: Goal): Promise<boolean> {
  if (!firebaseAvailable || !db) return false

  try {
    const { doc, setDoc } = await import('firebase/firestore')
    const goalRef = doc(db, 'users', userId, 'goals', goal.id)
    await setDoc(goalRef, {
      name: goal.name,
      description: goal.description || '',
      createdAt: goal.createdAt,
      color: goal.color || '',
      updatedAt: new Date().toISOString(),
    })
    return true
  } catch (error) {
    console.warn('Firebase goal save failed:', error)
    return false
  }
}

async function deleteGoalFromFirebase(userId: string, goalId: string): Promise<boolean> {
  if (!firebaseAvailable || !db) return false

  try {
    const { doc, deleteDoc } = await import('firebase/firestore')
    const goalRef = doc(db, 'users', userId, 'goals', goalId)
    await deleteDoc(goalRef)
    return true
  } catch (error) {
    console.warn('Firebase goal delete failed:', error)
    return false
  }
}

// ============ Main Hook ============
interface UseGoalsReturn {
  goals: Goal[]
  isLoading: boolean
  error: string | null
  createGoal: (name: string, description?: string, color?: string) => Promise<Goal>
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
      // Wait for auth to finish loading
      if (authLoading) return

      try {
        setIsLoading(true)
        setError(null)

        await initFirebase()

        // If user is logged in, load from Firebase with their user ID
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
          // Not logged in, use localStorage with default key
          setIsUsingFirebase(false)
          setGoals([])
        }
      } catch (err) {
        console.error('Error loading goals:', err)
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
    async (name: string, description?: string, color?: string): Promise<Goal> => {
      const newGoal: Goal = {
        id: `goal_${Date.now()}`,
        name: name.trim(),
        description: description?.trim(),
        createdAt: new Date().toISOString(),
        color,
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
