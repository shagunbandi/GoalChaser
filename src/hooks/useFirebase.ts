'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './useAuth'

// ============ Types ============
// Productivity score: 1-10 scale (1-3: Low, 4-6: OK, 7-10: High)
type DayStatus = number | null

interface SubjectEntry {
  subject: string
  topics: string[]
  hours: number
}

interface DayDetails {
  status: DayStatus
  subject: string
  topic: string
  subjects?: SubjectEntry[]
  note: string
  directHours?: number
}

// Subject configuration with topics
interface SubjectConfig {
  id: string
  name: string
  topics: string[]
  hasTopics?: boolean // If false, subject doesn't need topics (default: true)
  color?: string
}

// ============ LocalStorage Helpers ============
function getStorageKey(userId: string, goalId: string, key: string): string {
  return `nitya_${userId}_${goalId}_${key}`
}

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

// ============ Firebase Helpers (with fallback) ============
let firebaseAvailable = true
let db: ReturnType<typeof import('firebase/firestore').getFirestore> | null =
  null

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

// Goal-scoped Firebase helpers
async function loadDayDetailsFromFirebase(
  userId: string,
  goalId: string,
): Promise<Record<string, DayDetails> | null> {
  if (!firebaseAvailable || !db) return null

  try {
    const { collection, getDocs } = await import('firebase/firestore')
    const colRef = collection(db, 'users', userId, 'goals', goalId, 'days')
    const querySnapshot = await getDocs(colRef)

    const result: Record<string, DayDetails> = {}
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      result[doc.id] = {
        status: data.status || null,
        subject: data.subject || '',
        topic: data.topic || '',
        subjects: data.subjects || [],
        note: data.note || '',
        directHours: data.directHours || 0,
      }
    })

    return result
  } catch (error) {
    console.warn('Firebase read failed, using localStorage:', error)
    return null
  }
}

async function saveDayDetailsToFirebase(
  userId: string,
  goalId: string,
  date: string,
  details: DayDetails,
): Promise<boolean> {
  if (!firebaseAvailable || !db) return false

  try {
    const { doc, setDoc } = await import('firebase/firestore')
    const docRef = doc(db, 'users', userId, 'goals', goalId, 'days', date)
    await setDoc(docRef, {
      ...details,
      updatedAt: new Date().toISOString(),
    })
    return true
  } catch (error) {
    console.warn('Firebase write failed:', error)
    return false
  }
}

async function loadSubjectConfigsFromFirebase(
  userId: string,
  goalId: string,
): Promise<SubjectConfig[] | null> {
  if (!firebaseAvailable || !db) return null

  try {
    const { doc, getDoc } = await import('firebase/firestore')
    const docRef = doc(
      db,
      'users',
      userId,
      'goals',
      goalId,
      'settings',
      'subjectConfigs',
    )
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      const data = docSnap.data()
      return data.configs || []
    }
    return []
  } catch (error) {
    console.warn('Firebase subject configs read failed:', error)
    return null
  }
}

async function saveSubjectConfigsToFirebase(
  userId: string,
  goalId: string,
  configs: SubjectConfig[],
): Promise<boolean> {
  if (!firebaseAvailable || !db) return false

  try {
    const { doc, setDoc } = await import('firebase/firestore')
    const docRef = doc(
      db,
      'users',
      userId,
      'goals',
      goalId,
      'settings',
      'subjectConfigs',
    )
    await setDoc(docRef, {
      configs,
      updatedAt: new Date().toISOString(),
    })
    return true
  } catch (error) {
    console.warn('Firebase subject configs write failed:', error)
    return false
  }
}

// ============ Main Hook ============
interface UseFirebaseReturn {
  dayDetails: Record<string, DayDetails>
  subjectConfigs: SubjectConfig[]
  isLoading: boolean
  error: string | null
  isUsingFirebase: boolean
  updateDayDetails: (
    date: string,
    details: Partial<DayDetails>,
  ) => Promise<void>
  addSubjectConfig: (name: string) => Promise<void>
  removeSubjectConfig: (id: string) => Promise<void>
  updateSubjectConfig: (id: string, name: string) => Promise<void>
  toggleSubjectHasTopics: (id: string) => Promise<void>
  addTopicToSubject: (subjectId: string, topic: string) => Promise<void>
  removeTopicFromSubject: (subjectId: string, topic: string) => Promise<void>
  updateTopicInSubject: (subjectId: string, oldTopic: string, newTopic: string) => Promise<void>
  isTopicInUse: (subjectId: string, topic: string) => boolean
}

export function useFirebase(goalId: string): UseFirebaseReturn {
  const { user, isLoading: authLoading } = useAuth()
  const [dayDetails, setDayDetails] = useState<Record<string, DayDetails>>({})
  const [subjectConfigs, setSubjectConfigs] = useState<SubjectConfig[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isUsingFirebase, setIsUsingFirebase] = useState(false)

  // Get user ID for storage
  const userId = user?.uid || 'default_user'

  // Storage keys scoped to user and goal
  const dayDetailsKey = getStorageKey(userId, goalId, 'dayDetails')
  const subjectConfigsKey = getStorageKey(userId, goalId, 'subjectConfigs')

  // Load initial data
  useEffect(() => {
    async function loadData() {
      if (!goalId || authLoading) {
        if (!authLoading && !goalId) {
          setIsLoading(false)
        }
        return
      }

      // If not logged in, don't load any data
      if (!user) {
        setIsLoading(false)
        setDayDetails({})
        setSubjectConfigs([])
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        await initFirebase()

        const loadedDayDetails = await loadDayDetailsFromFirebase(userId, goalId)
        const loadedSubjectConfigs = await loadSubjectConfigsFromFirebase(userId, goalId)

        if (loadedDayDetails !== null && loadedSubjectConfigs !== null) {
          setIsUsingFirebase(true)
          setDayDetails(loadedDayDetails)
          setSubjectConfigs(loadedSubjectConfigs)

          saveToStorage(dayDetailsKey, loadedDayDetails)
          saveToStorage(subjectConfigsKey, loadedSubjectConfigs)
        } else {
          setIsUsingFirebase(false)
          setDayDetails(loadFromStorage(dayDetailsKey, {}))
          setSubjectConfigs(loadFromStorage(subjectConfigsKey, []))
        }
      } catch (err) {
        console.error('Error loading data:', err)
        setError('Using offline mode')
        setIsUsingFirebase(false)

        setDayDetails(loadFromStorage(dayDetailsKey, {}))
        setSubjectConfigs(loadFromStorage(subjectConfigsKey, []))
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [goalId, userId, authLoading, user, dayDetailsKey, subjectConfigsKey])

  // Update day details
  const updateDayDetails = useCallback(
    async (date: string, updates: Partial<DayDetails>) => {
      const currentDetails = dayDetails[date] || {
        status: null,
        subject: '',
        topic: '',
        subjects: [],
        note: '',
        directHours: 0,
      }

      const newDetails: DayDetails = {
        ...currentDetails,
        ...updates,
      }

      const newDayDetails = {
        ...dayDetails,
        [date]: newDetails,
      }
      setDayDetails(newDayDetails)

      saveToStorage(dayDetailsKey, newDayDetails)

      if (isUsingFirebase && user) {
        await saveDayDetailsToFirebase(user.uid, goalId, date, newDetails)
      }
    },
    [dayDetails, isUsingFirebase, user, goalId, dayDetailsKey],
  )

  // Add subject config
  const addSubjectConfig = useCallback(
    async (name: string) => {
      if (!name.trim()) return
      if (
        subjectConfigs.some(
          (s) => s.name.toLowerCase() === name.trim().toLowerCase(),
        )
      )
        return

      const newConfig: SubjectConfig = {
        id: `subject_${Date.now()}`,
        name: name.trim(),
        topics: [],
      }

      const newConfigs = [...subjectConfigs, newConfig]
      setSubjectConfigs(newConfigs)
      saveToStorage(subjectConfigsKey, newConfigs)

      if (isUsingFirebase && user) {
        await saveSubjectConfigsToFirebase(user.uid, goalId, newConfigs)
      }
    },
    [subjectConfigs, isUsingFirebase, user, goalId, subjectConfigsKey],
  )

  // Remove subject config
  const removeSubjectConfig = useCallback(
    async (id: string) => {
      const newConfigs = subjectConfigs.filter((s) => s.id !== id)
      setSubjectConfigs(newConfigs)
      saveToStorage(subjectConfigsKey, newConfigs)

      if (isUsingFirebase && user) {
        await saveSubjectConfigsToFirebase(user.uid, goalId, newConfigs)
      }
    },
    [subjectConfigs, isUsingFirebase, user, goalId, subjectConfigsKey],
  )

  // Update subject config name
  const updateSubjectConfig = useCallback(
    async (id: string, name: string) => {
      if (!name.trim()) return

      const newConfigs = subjectConfigs.map((s) =>
        s.id === id ? { ...s, name: name.trim() } : s,
      )
      setSubjectConfigs(newConfigs)
      saveToStorage(subjectConfigsKey, newConfigs)

      if (isUsingFirebase && user) {
        await saveSubjectConfigsToFirebase(user.uid, goalId, newConfigs)
      }
    },
    [subjectConfigs, isUsingFirebase, user, goalId, subjectConfigsKey],
  )

  // Toggle subject hasTopics setting
  const toggleSubjectHasTopics = useCallback(
    async (id: string) => {
      const newConfigs = subjectConfigs.map((s) =>
        s.id === id ? { ...s, hasTopics: !(s.hasTopics ?? true) } : s,
      )
      setSubjectConfigs(newConfigs)
      saveToStorage(subjectConfigsKey, newConfigs)

      if (isUsingFirebase && user) {
        await saveSubjectConfigsToFirebase(user.uid, goalId, newConfigs)
      }
    },
    [subjectConfigs, isUsingFirebase, user, goalId, subjectConfigsKey],
  )

  // Add topic to subject
  const addTopicToSubject = useCallback(
    async (subjectId: string, topic: string) => {
      if (!topic.trim()) return

      const subject = subjectConfigs.find((s) => s.id === subjectId)
      if (!subject) return
      if (subject.topics.includes(topic.trim())) return

      const newConfigs = subjectConfigs.map((s) =>
        s.id === subjectId ? { ...s, topics: [...s.topics, topic.trim()] } : s,
      )
      setSubjectConfigs(newConfigs)
      saveToStorage(subjectConfigsKey, newConfigs)

      if (isUsingFirebase && user) {
        await saveSubjectConfigsToFirebase(user.uid, goalId, newConfigs)
      }
    },
    [subjectConfigs, isUsingFirebase, user, goalId, subjectConfigsKey],
  )

  // Remove topic from subject
  const removeTopicFromSubject = useCallback(
    async (subjectId: string, topic: string) => {
      const newConfigs = subjectConfigs.map((s) =>
        s.id === subjectId
          ? { ...s, topics: s.topics.filter((t) => t !== topic) }
          : s,
      )
      setSubjectConfigs(newConfigs)
      saveToStorage(subjectConfigsKey, newConfigs)

      if (isUsingFirebase && user) {
        await saveSubjectConfigsToFirebase(user.uid, goalId, newConfigs)
      }
    },
    [subjectConfigs, isUsingFirebase, user, goalId, subjectConfigsKey],
  )

  // Update topic name in subject (also updates all day entries that reference it)
  const updateTopicInSubject = useCallback(
    async (subjectId: string, oldTopic: string, newTopic: string) => {
      if (!newTopic.trim() || oldTopic === newTopic.trim()) return

      const trimmedNewTopic = newTopic.trim()

      // Get subject name for updating day entries
      const subject = subjectConfigs.find((s) => s.id === subjectId)
      if (!subject) return

      // Check if new topic name already exists in this subject
      if (subject.topics.includes(trimmedNewTopic)) return

      // Update topic in subject config
      const newConfigs = subjectConfigs.map((s) =>
        s.id === subjectId
          ? { ...s, topics: s.topics.map((t) => (t === oldTopic ? trimmedNewTopic : t)) }
          : s,
      )
      setSubjectConfigs(newConfigs)
      saveToStorage(subjectConfigsKey, newConfigs)

      // Update all day entries that reference this topic for this subject
      const updatedDayDetails = { ...dayDetails }
      let hasChanges = false

      Object.entries(updatedDayDetails).forEach(([date, details]) => {
        if (details.subjects) {
          const updatedSubjects = details.subjects.map((entry) => {
            if (entry.subject === subject.name && entry.topics.includes(oldTopic)) {
              hasChanges = true
              return {
                ...entry,
                topics: entry.topics.map((t) => (t === oldTopic ? trimmedNewTopic : t)),
              }
            }
            return entry
          })
          if (hasChanges) {
            updatedDayDetails[date] = { ...details, subjects: updatedSubjects }
          }
        }
      })

      if (hasChanges) {
        setDayDetails(updatedDayDetails)
        saveToStorage(dayDetailsKey, updatedDayDetails)

        // Save updated day entries to Firebase
        if (isUsingFirebase && user) {
          Object.entries(updatedDayDetails).forEach(async ([date, details]) => {
            await saveDayDetailsToFirebase(user.uid, goalId, date, details)
          })
        }
      }

      if (isUsingFirebase && user) {
        await saveSubjectConfigsToFirebase(user.uid, goalId, newConfigs)
      }
    },
    [subjectConfigs, dayDetails, isUsingFirebase, user, goalId, subjectConfigsKey, dayDetailsKey],
  )

  // Check if a topic is in use in any day entry
  const isTopicInUse = useCallback(
    (subjectId: string, topic: string): boolean => {
      const subject = subjectConfigs.find((s) => s.id === subjectId)
      if (!subject) return false

      // Check all day entries for this topic
      return Object.values(dayDetails).some((details) => {
        if (!details.subjects) return false
        return details.subjects.some(
          (entry) => entry.subject === subject.name && entry.topics.includes(topic),
        )
      })
    },
    [subjectConfigs, dayDetails],
  )

  return {
    dayDetails,
    subjectConfigs,
    isLoading: isLoading || authLoading,
    error,
    isUsingFirebase,
    updateDayDetails,
    addSubjectConfig,
    removeSubjectConfig,
    updateSubjectConfig,
    toggleSubjectHasTopics,
    addTopicToSubject,
    removeTopicFromSubject,
    updateTopicInSubject,
    isTopicInUse,
  }
}
