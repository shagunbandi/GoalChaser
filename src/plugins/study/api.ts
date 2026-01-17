// API layer for study add-on operations

import type { StudyDayData, StudyConfig, SubjectConfig } from './types'
import { getFirebaseDb, isFirebaseAvailable } from '@/lib/api/firebase-client'
import { logger } from '@/lib/logger'
import { collection, doc, getDocs, getDoc, setDoc, query, where } from 'firebase/firestore'

/**
 * Load study configuration (subjects)
 */
export async function loadStudyConfig(
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
    const configRef = doc(db, 'users', userId, 'goals', goalId, 'addons', 'study', 'settings', 'config')
    const configSnap = await getDoc(configRef)

    if (configSnap.exists()) {
      const data = configSnap.data() as StudyConfig
      return data.subjects || []
    }

    return []
  } catch (error) {
    logger.error('Failed to load study config', error)
    return []
  }
}

/**
 * Save study configuration (subjects)
 */
export async function saveStudyConfig(
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
    const configRef = doc(db, 'users', userId, 'goals', goalId, 'addons', 'study', 'settings', 'config')

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
 * Load study data for a date range
 */
export async function loadStudyDays(
  userId: string,
  goalId: string,
  startDate: string,
  endDate: string
): Promise<Record<string, StudyDayData>> {
  if (!isFirebaseAvailable() || !getFirebaseDb()) {
    return {}
  }

  try {
    const db = getFirebaseDb()
    if (!db) return {}

    const daysRef = collection(db, 'users', userId, 'goals', goalId, 'addons', 'study', 'days')
    const q = query(
      daysRef,
      where('__name__', '>=', startDate),
      where('__name__', '<=', endDate)
    )
    
    const snapshot = await getDocs(q)
    
    const result: Record<string, StudyDayData> = {}
    snapshot.forEach((docSnap) => {
      const data = docSnap.data()
      result[docSnap.id] = {
        subjects: data.subjects || [],
        directHours: data.directHours || 0
      }
    })

    return result
  } catch (error) {
    logger.error('Failed to load study days', error)
    return {}
  }
}

/**
 * Save study data for a specific day
 */
export async function saveStudyDay(
  userId: string,
  goalId: string,
  date: string,
  data: Partial<StudyDayData>
): Promise<boolean> {
  logger.progress('Saving study hours...')

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

    const docRef = doc(db, 'users', userId, 'goals', goalId, 'addons', 'study', 'days', date)
    
    // Get existing data
    const docSnap = await getDoc(docRef)
    let existingData: StudyDayData = { subjects: [], directHours: 0 }
    
    if (docSnap.exists()) {
      existingData = docSnap.data() as StudyDayData
    }

    const updatedData: StudyDayData = {
      subjects: data.subjects !== undefined ? data.subjects : existingData.subjects,
      directHours: data.directHours !== undefined ? data.directHours : existingData.directHours
    }

    await setDoc(docRef, {
      ...updatedData,
      updatedAt: new Date().toISOString()
    })

    logger.success('Study hours saved')
    return true
  } catch (error) {
    logger.error('Save failed', error)
    return false
  }
}
