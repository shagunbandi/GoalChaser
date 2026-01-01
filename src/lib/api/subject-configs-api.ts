// API layer for subject configurations operations

import type { SubjectConfig } from '@/types'
import { getFirebaseDb, isFirebaseAvailable } from './firebase-client'

export async function loadSubjectConfigsFromFirebase(
  userId: string,
  goalId: string,
): Promise<SubjectConfig[] | null> {
  if (!isFirebaseAvailable() || !getFirebaseDb()) return null

  try {
    const { doc, getDoc } = await import('firebase/firestore')
    const db = getFirebaseDb()
    if (!db) return null

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
      return data.configs || []
    }
    return []
  } catch (error) {
    console.warn('Firebase subject configs read failed:', error)
    return null
  }
}

export async function saveSubjectConfigsToFirebase(
  userId: string,
  goalId: string,
  configs: SubjectConfig[],
): Promise<boolean> {
  if (!isFirebaseAvailable() || !getFirebaseDb()) return false

  try {
    const { doc, setDoc } = await import('firebase/firestore')
    const db = getFirebaseDb()
    if (!db) return false

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
    return true
  } catch (error) {
    console.warn('Firebase subject configs write failed:', error)
    return false
  }
}

