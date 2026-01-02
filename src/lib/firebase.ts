import { initializeApp, getApps } from 'firebase/app'
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  writeBatch,
  connectFirestoreEmulator,
} from 'firebase/firestore'

// Firebase configuration
// TODO: Replace with your Firebase project credentials
// Get these from: Firebase Console > Project Settings > Your Apps > Config
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Lazy initialization to avoid build-time errors
// Firebase is only initialized when actually needed at runtime
let app: ReturnType<typeof initializeApp> | null = null
let db: ReturnType<typeof getFirestore> | null = null
let isEmulatorConnected = false

function getApp() {
  if (!app) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
  }
  return app
}

function getDb() {
  if (!db) {
    db = getFirestore(getApp())
    
    // Connect to emulator if configured (must happen before any operations)
    if (
      !isEmulatorConnected &&
      process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true'
    ) {
      try {
        const emulatorHost = process.env.NEXT_PUBLIC_FIREBASE_FIRESTORE_EMULATOR_HOST || 'localhost:8080'
        const [host, port] = emulatorHost.split(':')
        
        connectFirestoreEmulator(db, host, parseInt(port, 10))
        isEmulatorConnected = true
        console.log(`✅ Connected to Firestore Emulator at ${host}:${port}`)
      } catch (error) {
        // Ignore if already connected (shouldn't happen with our flag, but just in case)
        if (error instanceof Error && !error.message.includes('already been called')) {
          console.error('❌ Error connecting to Firestore Emulator:', error)
        } else {
          isEmulatorConnected = true // Mark as connected even if error says already connected
        }
      }
    }
  }
  return db
}

// ============ Types ============
export type DayStatus = 'RED' | 'YELLOW' | 'GREEN' | null

export interface DayDetails {
  status: DayStatus
  subject: string
  topic: string
}

export interface SavedSuggestions {
  subjects: string[]
  topics: string[]
}

// ============ Firestore Collections ============
// For now, we use a single "user" - later you can add authentication
const USER_ID = 'default_user'

// ============ Day Details Operations ============

/**
 * Save day details to Firestore
 */
export async function saveDayDetails(
  date: string,
  details: DayDetails
): Promise<void> {
  try {
    const docRef = doc(getDb(), 'users', USER_ID, 'days', date)
    await setDoc(docRef, {
      ...details,
      updatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error saving day details:', error)
    throw error
  }
}

/**
 * Get day details from Firestore
 */
export async function getDayDetails(date: string): Promise<DayDetails | null> {
  try {
    const docRef = doc(getDb(), 'users', USER_ID, 'days', date)
    const docSnap = await getDoc(docRef)
    
    if (docSnap.exists()) {
      const data = docSnap.data()
      return {
        status: data.status || null,
        subject: data.subject || '',
        topic: data.topic || '',
      }
    }
    return null
  } catch (error) {
    console.error('Error getting day details:', error)
    throw error
  }
}

/**
 * Get all day details for a date range
 */
export async function getAllDayDetails(): Promise<Record<string, DayDetails>> {
  try {
    const colRef = collection(getDb(), 'users', USER_ID, 'days')
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
    console.error('Error getting all day details:', error)
    throw error
  }
}

/**
 * Save multiple day details at once (batch write)
 */
export async function saveBatchDayDetails(
  details: Record<string, DayDetails>
): Promise<void> {
  try {
    const batch = writeBatch(getDb())
    
    Object.entries(details).forEach(([date, dayDetails]) => {
      const docRef = doc(getDb(), 'users', USER_ID, 'days', date)
      batch.set(docRef, {
        ...dayDetails,
        updatedAt: new Date().toISOString(),
      })
    })
    
    await batch.commit()
  } catch (error) {
    console.error('Error batch saving day details:', error)
    throw error
  }
}

// ============ Suggestions Operations ============

/**
 * Save suggestions to Firestore
 */
export async function saveSuggestionsToFirestore(
  suggestions: SavedSuggestions
): Promise<void> {
  try {
    const docRef = doc(getDb(), 'users', USER_ID, 'settings', 'suggestions')
    await setDoc(docRef, {
      ...suggestions,
      updatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error saving suggestions:', error)
    throw error
  }
}

/**
 * Get suggestions from Firestore
 */
export async function getSuggestionsFromFirestore(): Promise<SavedSuggestions> {
  try {
    const docRef = doc(getDb(), 'users', USER_ID, 'settings', 'suggestions')
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
    console.error('Error getting suggestions:', error)
    return { subjects: [], topics: [] }
  }
}

// ============ Migration Helper ============

/**
 * Migrate data from localStorage to Firebase
 */
export async function migrateFromLocalStorage(): Promise<{
  dayDetails: Record<string, DayDetails>
  suggestions: SavedSuggestions
} | null> {
  if (typeof window === 'undefined') return null

  try {
    // Get localStorage data (if any)
    const suggestionsKey = 'nitya_suggestions'
    const storedSuggestions = localStorage.getItem(suggestionsKey)
    
    const suggestions: SavedSuggestions = storedSuggestions
      ? JSON.parse(storedSuggestions)
      : { subjects: [], topics: [] }

    // Note: Day details weren't stored in localStorage in the original app
    // They were only in React state. So we return empty for now.
    const dayDetails: Record<string, DayDetails> = {}

    return { dayDetails, suggestions }
  } catch (error) {
    console.error('Error migrating from localStorage:', error)
    return null
  }
}

export { getDb, getApp }

