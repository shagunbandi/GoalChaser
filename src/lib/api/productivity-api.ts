// API layer for productivity add-on operations

import type { ProductivityDayData, ProductivityConfig, AreaConfig, AreaEntry, DayStatus } from '@/types'
import { getFirebaseDb, isFirebaseAvailable } from './firebase-client'
import { logger } from '@/lib/logger'
import { collection, doc, getDocs, getDoc, setDoc, query, where } from 'firebase/firestore'

/**
 * Load productivity data for a date range
 */
export async function loadProductivityDays(
  userId: string,
  goalId: string,
  startDate: string,
  endDate: string
): Promise<Record<string, ProductivityDayData>> {
  if (!isFirebaseAvailable() || !getFirebaseDb()) {
    return {}
  }

  try {
    const db = getFirebaseDb()
    if (!db) return {}

    const daysRef = collection(db, 'users', userId, 'goals', goalId, 'addons', 'productivity', 'days')
    const q = query(
      daysRef,
      where('__name__', '>=', startDate),
      where('__name__', '<=', endDate)
    )
    
    const snapshot = await getDocs(q)
    
    const result: Record<string, ProductivityDayData> = {}
    snapshot.forEach((docSnap) => {
      const data = docSnap.data()
      result[docSnap.id] = {
        status: data.status ?? null
      }
    })

    return result
  } catch (error) {
    logger.error('Failed to load productivity days', error)
    return {}
  }
}

/**
 * Save productivity data for a specific day
 */
export async function saveProductivityDay(
  userId: string,
  goalId: string,
  date: string,
  data: ProductivityDayData
): Promise<boolean> {
  logger.progress('Saving productivity data...')

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

    const docRef = doc(db, 'users', userId, 'goals', goalId, 'addons', 'productivity', 'days', date)

    await setDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString()
    })

    logger.success('Productivity data saved')
    return true
  } catch (error) {
    logger.error('Save failed', error)
    return false
  }
}

/**
 * Load productivity configuration (areas)
 */
export async function loadProductivityConfig(
  userId: string,
  goalId: string
): Promise<AreaConfig[]> {
  if (!isFirebaseAvailable() || !getFirebaseDb()) {
    return []
  }

  try {
    const db = getFirebaseDb()
    if (!db) return []

    // Path needs even segments for document: add 'settings' collection
    const configRef = doc(db, 'users', userId, 'goals', goalId, 'addons', 'productivity', 'settings', 'config')
    const configSnap = await getDoc(configRef)

    if (configSnap.exists()) {
      const data = configSnap.data() as ProductivityConfig
      return data.areas || []
    }

    return []
  } catch (error) {
    logger.error('Failed to load productivity config', error)
    return []
  }
}

/**
 * Save productivity configuration (areas)
 */
export async function saveProductivityConfig(
  userId: string,
  goalId: string,
  areas: AreaConfig[]
): Promise<boolean> {
  logger.progress('Saving areas...')

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
    const configRef = doc(db, 'users', userId, 'goals', goalId, 'addons', 'productivity', 'settings', 'config')

    await setDoc(configRef, {
      areas,
      updatedAt: new Date().toISOString()
    })

    logger.success('Areas saved')
    return true
  } catch (error) {
    logger.error('Save failed', error)
    return false
  }
}
