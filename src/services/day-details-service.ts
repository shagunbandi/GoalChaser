import type { DayDetails, AgendaItem } from '@/types'
import { getFirebaseDb, isFirebaseAvailable } from './firebase-service'
import { logger } from '@/utils/logger'

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
  logger.progress('Loading day details from Firebase...')
  
  if (!isFirebaseAvailable()) {
    logger.error('Cannot load day details - Firebase not available')
    return null
  }
  
  if (!getFirebaseDb()) {
    logger.error('Cannot load day details - Firebase DB is null')
    return null
  }

  try {
    const { collection, getDocs } = await import('firebase/firestore')
    const db = getFirebaseDb()
    if (!db) {
      logger.error('Cannot load day details - Firebase DB became null')
      return null
    }
    
    const colRef = collection(db, 'users', userId, 'goals', goalId, 'days')
    const querySnapshot = await getDocs(colRef)
    logger.success(`Loaded ${querySnapshot.size} day details from Firebase`)

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
  logger.progress(`Saving day details for ${date}`)
  
  if (!isFirebaseAvailable() || !getFirebaseDb()) {
    logger.error('Cannot save day details - Firebase not available')
    return false
  }

  try {
    const { doc, setDoc } = await import('firebase/firestore')
    const db = getFirebaseDb()
    if (!db) {
      logger.error('Cannot save day details - Firebase DB became null')
      return false
    }
    
    const docRef = doc(db, 'users', userId, 'goals', goalId, 'days', date)
    
    const cleanedDetails = removeUndefinedFields({
      ...details,
      updatedAt: new Date().toISOString(),
    })
    
    await setDoc(docRef, cleanedDetails)
    logger.success(`Saved day details for ${date}`)
    
    return true
  } catch (error) {
    logger.error(`Firebase write failed for ${date}`, error)
    return false
  }
}

