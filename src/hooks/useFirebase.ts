'use client'

import { useState, useEffect, useCallback } from 'react'

// ============ Types ============
type DayStatus = 'RED' | 'YELLOW' | 'GREEN' | null

interface DayDetails {
  status: DayStatus
  subject: string
  topic: string
}

interface SavedSuggestions {
  subjects: string[]
  topics: string[]
}

// ============ LocalStorage Keys ============
const STORAGE_KEYS = {
  dayDetails: 'goalchaser_dayDetails',
  suggestions: 'goalchaser_suggestions',
}

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

// ============ Firebase Helpers (with fallback) ============
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
    
    // Check if config is valid
    if (!firebaseConfig.projectId) {
      console.warn('Firebase config missing, using localStorage only')
      firebaseAvailable = false
      return null
    }
    
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
    db = getFirestore(app)
    return db
  } catch (error) {
    console.warn('Firebase initialization failed, using localStorage:', error)
    firebaseAvailable = false
    return null
  }
}

const USER_ID = 'default_user'

async function loadDayDetailsFromFirebase(): Promise<Record<string, DayDetails> | null> {
  if (!firebaseAvailable || !db) return null
  
  try {
    const { collection, getDocs } = await import('firebase/firestore')
    const colRef = collection(db, 'users', USER_ID, 'days')
    const querySnapshot = await getDocs(colRef)
    
    const result: Record<string, DayDetails> = {}
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      result[doc.id] = {
        status: data.status || null,
        subject: data.subject || '',
        topic: data.topic || '',
      }
    })
    
    return result
  } catch (error) {
    console.warn('Firebase read failed, using localStorage:', error)
    firebaseAvailable = false
    return null
  }
}

async function saveDayDetailsToFirebase(date: string, details: DayDetails): Promise<boolean> {
  if (!firebaseAvailable || !db) return false
  
  try {
    const { doc, setDoc } = await import('firebase/firestore')
    const docRef = doc(db, 'users', USER_ID, 'days', date)
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

async function loadSuggestionsFromFirebase(): Promise<SavedSuggestions | null> {
  if (!firebaseAvailable || !db) return null
  
  try {
    const { doc, getDoc } = await import('firebase/firestore')
    const docRef = doc(db, 'users', USER_ID, 'settings', 'suggestions')
    const docSnap = await getDoc(docRef)
    
    if (docSnap.exists()) {
      const data = docSnap.data()
      return {
        subjects: data.subjects || [],
        topics: data.topics || [],
      }
    }
    return { subjects: [], topics: [] }
  } catch (error) {
    console.warn('Firebase suggestions read failed:', error)
    return null
  }
}

async function saveSuggestionsToFirebase(suggestions: SavedSuggestions): Promise<boolean> {
  if (!firebaseAvailable || !db) return false
  
  try {
    const { doc, setDoc } = await import('firebase/firestore')
    const docRef = doc(db, 'users', USER_ID, 'settings', 'suggestions')
    await setDoc(docRef, {
      ...suggestions,
      updatedAt: new Date().toISOString(),
    })
    return true
  } catch (error) {
    console.warn('Firebase suggestions write failed:', error)
    return false
  }
}

// ============ Main Hook ============
interface UseFirebaseReturn {
  dayDetails: Record<string, DayDetails>
  suggestions: SavedSuggestions
  isLoading: boolean
  error: string | null
  isUsingFirebase: boolean
  updateDayDetails: (date: string, details: Partial<DayDetails>) => Promise<void>
  addSuggestion: (type: 'subjects' | 'topics', value: string) => Promise<void>
}

export function useFirebase(): UseFirebaseReturn {
  const [dayDetails, setDayDetails] = useState<Record<string, DayDetails>>({})
  const [suggestions, setSuggestions] = useState<SavedSuggestions>({
    subjects: [],
    topics: [],
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isUsingFirebase, setIsUsingFirebase] = useState(false)

  // Load initial data
  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true)
        setError(null)

        // Try to initialize Firebase
        await initFirebase()

        // Try loading from Firebase first
        let loadedDayDetails = await loadDayDetailsFromFirebase()
        let loadedSuggestions = await loadSuggestionsFromFirebase()

        if (loadedDayDetails !== null && loadedSuggestions !== null) {
          // Firebase worked!
          setIsUsingFirebase(true)
          setDayDetails(loadedDayDetails)
          setSuggestions(loadedSuggestions)
          
          // Also save to localStorage as backup
          saveToStorage(STORAGE_KEYS.dayDetails, loadedDayDetails)
          saveToStorage(STORAGE_KEYS.suggestions, loadedSuggestions)
        } else {
          // Firebase failed, use localStorage
          setIsUsingFirebase(false)
          setDayDetails(loadFromStorage(STORAGE_KEYS.dayDetails, {}))
          setSuggestions(loadFromStorage(STORAGE_KEYS.suggestions, { subjects: [], topics: [] }))
        }
      } catch (err) {
        console.error('Error loading data:', err)
        setError('Using offline mode')
        setIsUsingFirebase(false)
        
        // Fall back to localStorage
        setDayDetails(loadFromStorage(STORAGE_KEYS.dayDetails, {}))
        setSuggestions(loadFromStorage(STORAGE_KEYS.suggestions, { subjects: [], topics: [] }))
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  // Update day details
  const updateDayDetails = useCallback(
    async (date: string, updates: Partial<DayDetails>) => {
      // Get current details for this date
      const currentDetails = dayDetails[date] || {
        status: null,
        subject: '',
        topic: '',
      }

      // Merge with updates
      const newDetails: DayDetails = {
        ...currentDetails,
        ...updates,
      }

      // Optimistic update
      const newDayDetails = {
        ...dayDetails,
        [date]: newDetails,
      }
      setDayDetails(newDayDetails)

      // Always save to localStorage (backup)
      saveToStorage(STORAGE_KEYS.dayDetails, newDayDetails)

      // Try to save to Firebase
      if (isUsingFirebase) {
        await saveDayDetailsToFirebase(date, newDetails)
      }
    },
    [dayDetails, isUsingFirebase]
  )

  // Add suggestion
  const addSuggestion = useCallback(
    async (type: 'subjects' | 'topics', value: string) => {
      if (!value.trim()) return
      if (suggestions[type].includes(value.trim())) return

      const newSuggestions: SavedSuggestions = {
        ...suggestions,
        [type]: [...suggestions[type], value.trim()],
      }

      // Optimistic update
      setSuggestions(newSuggestions)

      // Always save to localStorage (backup)
      saveToStorage(STORAGE_KEYS.suggestions, newSuggestions)

      // Try to save to Firebase
      if (isUsingFirebase) {
        await saveSuggestionsToFirebase(newSuggestions)
      }
    },
    [suggestions, isUsingFirebase]
  )

  return {
    dayDetails,
    suggestions,
    isLoading,
    error,
    isUsingFirebase,
    updateDayDetails,
    addSuggestion,
  }
}
