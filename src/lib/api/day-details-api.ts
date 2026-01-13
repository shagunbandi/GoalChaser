// API layer for day details operations

import type { DayDetails, AgendaItem } from '@/types'
import { getFirebaseDb, isFirebaseAvailable } from './firebase-client'
import { logger } from '@/lib/logger'

/**
 * Recursively removes undefined values from an object
 * Firebase doesn't support undefined values, so we need to clean them
 */
function removeUndefinedFields<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map(item => removeUndefinedFields(item)) as T
  }

  if (typeof obj === 'object') {
    const cleaned: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = removeUndefinedFields(value)
      }
    }
    return cleaned as T
  }

  return obj
}

export async function loadDayDetailsFromFirebase(
  userId: string,
  goalId: string,
): Promise<Record<string, DayDetails> | null> {
  logger.progress('Loading...')
  
  if (!isFirebaseAvailable()) {
    logger.error('Load failed - Firebase unavailable')
    return null
  }
  
  if (!getFirebaseDb()) {
    logger.error('Load failed - Firebase unavailable')
    return null
  }

  try {
    const { collection, getDocs } = await import('firebase/firestore')
    const db = getFirebaseDb()
    if (!db) {
      logger.error('Load failed - Firebase unavailable')
      return null
    }
    
    const colRef = collection(db, 'users', userId, 'goals', goalId, 'days')
    const querySnapshot = await getDocs(colRef)
    logger.success(`Loaded ${querySnapshot.size} days`)

    const result: Record<string, DayDetails> = {}
    
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      const legacyTravel = data.travel
      const travelPlans = data.travelPlans
        ? data.travelPlans
        : legacyTravel
        ? Array.isArray(legacyTravel)
          ? legacyTravel
          : [legacyTravel]
        : []

      // Support both old (plannedItems) and new (agendaItems) field names
      const agendaItems = data.agendaItems || data.plannedItems || []
      
      result[doc.id] = {
        status: data.status || null,
        subject: data.subject || '',
        topic: data.topic || '',
        subjects: data.subjects || [],
        note: data.note || '',
        directHours: data.directHours || 0,
        agendaItems: agendaItems.map((item: AgendaItem) => ({
          ...item,
          subjects: item.subjects || [],
          completed: item.completed || false,
        })),
        // Keep plannedItems for backward compatibility
        plannedItems: agendaItems.map((item: AgendaItem) => ({
          ...item,
          subjects: item.subjects || [],
          completed: item.completed || false,
        })),
        travelPlans,
      }
    })

    return result
  } catch (error) {
    logger.error('Firebase day details read failed', error)
    return null
  }
}

export async function saveDayDetailsToFirebase(
  userId: string,
  goalId: string,
  date: string,
  details: DayDetails,
): Promise<boolean> {
  logger.progress('Saving...')
  
  if (!isFirebaseAvailable() || !getFirebaseDb()) {
    logger.error('Save failed - Firebase unavailable')
    return false
  }

  try {
    const { doc, setDoc } = await import('firebase/firestore')
    const db = getFirebaseDb()
    if (!db) {
      logger.error('Save failed - Firebase unavailable')
      return false
    }
    
    const docRef = doc(db, 'users', userId, 'goals', goalId, 'days', date)
    
    const cleanedDetails = removeUndefinedFields({
      ...details,
      updatedAt: new Date().toISOString(),
    })
    
    await setDoc(docRef, cleanedDetails)
    logger.success('Saved')
    
    return true
  } catch (error) {
    logger.error('Save failed', error)
    return false
  }
}

