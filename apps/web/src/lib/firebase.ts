import {
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  writeBatch,
} from 'firebase/firestore'
import { getFirebaseDb } from './firebase-service'

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
    const db = getFirebaseDb()
    const docRef = doc(db, 'users', USER_ID, 'days', date)
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
    const db = getFirebaseDb()
    const docRef = doc(db, 'users', USER_ID, 'days', date)
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
    const db = getFirebaseDb()
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
    const db = getFirebaseDb()
    const batch = writeBatch(db)
    
    Object.entries(details).forEach(([date, dayDetails]) => {
      const docRef = doc(db, 'users', USER_ID, 'days', date)
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
    const db = getFirebaseDb()
    const docRef = doc(db, 'users', USER_ID, 'settings', 'suggestions')
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
    const db = getFirebaseDb()
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
    console.error('Error getting suggestions:', error)
    return { subjects: [], topics: [] }
  }
}

export { getFirebaseDb as getDb, getFirebaseApp as getApp } from './firebase-service'

