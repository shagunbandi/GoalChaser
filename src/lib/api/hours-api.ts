// API layer for hours add-on operations

import type { HoursDayData, HoursConfig, SubjectConfig } from '@/types'
import { getFirebaseDb, isFirebaseAvailable } from './firebase-client'
import { logger } from '@/lib/logger'
import { collection, doc, getDocs, getDoc, setDoc, query, where } from 'firebase/firestore'

/**
 * Load hours configuration (subjects)
 */
export async function loadHoursConfig(
  userId: string,
  goalId: string
): Promise<SubjectConfig[]> {
  if (!isFirebaseAvailable() || !getFirebaseDb()) {
    return []
  }

  try {
    const db = getFirebaseDb()
    if (!db) return []

    // Path needs even segments for document: add 'settings' collection
    const configRef = doc(db, 'users', userId, 'goals', goalId, 'addons', 'hours', 'settings', 'config')
    const configSnap = await getDoc(configRef)

    if (configSnap.exists()) {
      const data = configSnap.data() as HoursConfig
      return data.subjects || []
    }

    return []
  } catch (error) {
    logger.error('Failed to load hours config', error)
    return []
  }
}

/**
 * Save hours configuration (subjects)
 */
export async function saveHoursConfig(
  userId: string,
  goalId: string,
  subjects: SubjectConfig[]
): Promise<boolean> {
  logger.progress('Saving subjects...')

  if (!isFirebaseAvailable() || !getFirebaseDb()) {
    logger.error('Save failed')
    return false
  }

  try {
    const db = getFirebaseDb()
    if (!db) {
      logger.error('Save failed')
      return false
    }

    // Path needs even segments for document: add 'settings' collection
    const configRef = doc(db, 'users', userId, 'goals', goalId, 'addons', 'hours', 'settings', 'config')

    await setDoc(configRef, {
      subjects,
      updatedAt: new Date().toISOString()
    })

    logger.success('Subjects saved')
    return true
  } catch (error) {
    logger.error('Save failed', error)
    return false
  }
}

/**
 * Load hours data for a date range
 */
export async function loadHoursDays(
  userId: string,
  goalId: string,
  startDate: string,
  endDate: string
): Promise<Record<string, HoursDayData>> {
  if (!isFirebaseAvailable() || !getFirebaseDb()) {
    return {}
  }

  try {
    const db = getFirebaseDb()
    if (!db) return {}

    const daysRef = collection(db, 'users', userId, 'goals', goalId, 'addons', 'hours', 'days')
    const q = query(
      daysRef,
      where('__name__', '>=', startDate),
      where('__name__', '<=', endDate)
    )
    
    const snapshot = await getDocs(q)
    
    const result: Record<string, HoursDayData> = {}
    snapshot.forEach((docSnap) => {
      const data = docSnap.data()
      result[docSnap.id] = {
        subjects: data.subjects || [],
        directHours: data.directHours || 0
      }
    })

    return result
  } catch (error) {
    logger.error('Failed to load hours days', error)
    return {}
  }
}

/**
 * Save hours data for a specific day
 */
export async function saveHoursDay(
  userId: string,
  goalId: string,
  date: string,
  data: Partial<HoursDayData>
): Promise<boolean> {
  logger.progress('Saving hours...')

  if (!isFirebaseAvailable() || !getFirebaseDb()) {
    logger.error('Save failed')
    return false
  }

  try {
    const db = getFirebaseDb()
    if (!db) {
      logger.error('Save failed')
      return false
    }

    const docRef = doc(db, 'users', userId, 'goals', goalId, 'addons', 'hours', 'days', date)
    
    // Get existing data
    const docSnap = await getDoc(docRef)
    let existingData: HoursDayData = { subjects: [], directHours: 0 }
    
    if (docSnap.exists()) {
      existingData = docSnap.data() as HoursDayData
    }

    const updatedData: HoursDayData = {
      subjects: data.subjects !== undefined ? data.subjects : existingData.subjects,
      directHours: data.directHours !== undefined ? data.directHours : existingData.directHours
    }

    await setDoc(docRef, {
      ...updatedData,
      updatedAt: new Date().toISOString()
    })

    logger.success('Hours saved')
    return true
  } catch (error) {
    logger.error('Save failed', error)
    return false
  }
}
