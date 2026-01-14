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
        expenses: data.expenses || [],
        income: data.income || [],
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
  updates?: Partial<DayDetails>,
): Promise<boolean> {
  // Determine what's being saved from updates
  let action = 'Saving...'
  if (updates) {
    if ('status' in updates) action = 'Saving status...'
    else if ('note' in updates) action = 'Saving note...'
    else if ('subjects' in updates) action = 'Saving productivity...'
    else if ('directHours' in updates) action = 'Saving hours...'
    else if ('agendaItems' in updates) action = 'Saving agenda...'
    else if ('travelPlans' in updates) action = 'Saving travel...'
    else if ('expenses' in updates) action = 'Saving expense...'
    else if ('income' in updates) action = 'Saving income...'
  }
  logger.progress(action)
  
  if (!isFirebaseAvailable() || !getFirebaseDb()) {
    logger.error('Save failed')
    return false
  }

  try {
    const { doc, setDoc } = await import('firebase/firestore')
    const db = getFirebaseDb()
    if (!db) {
      logger.error('Save failed')
      return false
    }
    
    const docRef = doc(db, 'users', userId, 'goals', goalId, 'days', date)
    
    const cleanedDetails = removeUndefinedFields({
      ...details,
      updatedAt: new Date().toISOString(),
    })
    
    await setDoc(docRef, cleanedDetails)
    
    // Match the saved message to what was being saved
    if (updates) {
      if ('status' in updates) logger.success('Status saved')
      else if ('note' in updates) logger.success('Note saved')
      else if ('subjects' in updates) logger.success('Productivity saved')
      else if ('directHours' in updates) logger.success('Hours saved')
      else if ('agendaItems' in updates) logger.success('Agenda saved')
      else if ('travelPlans' in updates) logger.success('Travel saved')
      else if ('expenses' in updates) logger.success('Expense saved')
      else if ('income' in updates) logger.success('Income saved')
      else logger.success('Saved')
    } else {
      logger.success('Saved')
    }
    
    return true
  } catch (error) {
    logger.error('Save failed', error)
    return false
  }
}

