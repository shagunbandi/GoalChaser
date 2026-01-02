// API layer for subject configurations operations

import type { SubjectConfig } from '@/types'
import { getFirebaseDb, isFirebaseAvailable } from './firebase-client'
import { logger } from '@/lib/logger'

export async function loadSubjectConfigsFromFirebase(
  userId: string,
  goalId: string,
): Promise<SubjectConfig[] | null> {
  logger.progress('Loading subject configs from Firebase...')
  
  if (!isFirebaseAvailable() || !getFirebaseDb()) {
    logger.error('Cannot load subject configs - Firebase not available')
    return null
  }

  try {
    const { doc, getDoc } = await import('firebase/firestore')
    const db = getFirebaseDb()
    if (!db) {
      logger.error('Cannot load subject configs - Firebase DB became null')
      return null
    }

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
      logger.success(`Loaded ${(data.configs || []).length} subject configs`)
      return data.configs || []
    }
    logger.info('No subject configs found, returning empty array')
    return []
  } catch (error) {
    logger.error('Firebase subject configs read failed', error)
    return null
  }
}

export async function saveSubjectConfigsToFirebase(
  userId: string,
  goalId: string,
  configs: SubjectConfig[],
): Promise<boolean> {
  logger.progress(`Saving ${configs.length} subject configs`)
  
  if (!isFirebaseAvailable() || !getFirebaseDb()) {
    logger.error('Cannot save subject configs - Firebase not available')
    return false
  }

  try {
    const { doc, setDoc } = await import('firebase/firestore')
    const db = getFirebaseDb()
    if (!db) {
      logger.error('Cannot save subject configs - Firebase DB became null')
      return false
    }

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
    logger.success('Saved subject configs to Firebase')
    return true
  } catch (error) {
    logger.error('Firebase subject configs write failed', error)
    return false
  }
}

