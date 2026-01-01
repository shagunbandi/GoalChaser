// API layer for day details operations

import type { DayDetails, PlannedItem } from '@/types'
import { getFirebaseDb, isFirebaseAvailable } from './firebase-client'

export async function loadDayDetailsFromFirebase(
  userId: string,
  goalId: string,
): Promise<Record<string, DayDetails> | null> {
  if (!isFirebaseAvailable() || !getFirebaseDb()) return null

  try {
    const { collection, getDocs } = await import('firebase/firestore')
    const db = getFirebaseDb()
    if (!db) return null

    const colRef = collection(db, 'users', userId, 'goals', goalId, 'days')
    const querySnapshot = await getDocs(colRef)

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

      result[doc.id] = {
        status: data.status || null,
        subject: data.subject || '',
        topic: data.topic || '',
        subjects: data.subjects || [],
        note: data.note || '',
        directHours: data.directHours || 0,
        plannedItems: (data.plannedItems || []).map((item: PlannedItem) => ({
          ...item,
          subjects: item.subjects || [],
          completed: item.completed || false,
        })),
        travelPlans,
      }
    })

    return result
  } catch (error) {
    console.warn('Firebase read failed, using localStorage:', error)
    return null
  }
}

export async function saveDayDetailsToFirebase(
  userId: string,
  goalId: string,
  date: string,
  details: DayDetails,
): Promise<boolean> {
  if (!isFirebaseAvailable() || !getFirebaseDb()) return false

  try {
    const { doc, setDoc } = await import('firebase/firestore')
    const db = getFirebaseDb()
    if (!db) return false

    const docRef = doc(db, 'users', userId, 'goals', goalId, 'days', date)
    await setDoc(docRef, {
      ...details,
      updatedAt: new Date().toISOString(),
    })
    return true
  } catch (error) {
    console.warn('Firebase write failed:', error)
    return false
  }
}

