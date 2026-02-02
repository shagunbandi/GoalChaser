/**
 * Calendar Filters API
 * Handles saving and loading calendar filter preferences to Firestore
 */

import { doc, getDoc, setDoc } from 'firebase/firestore'
import type { Firestore } from 'firebase/firestore'

export interface CalendarFilterPreferences {
  visibleIndicators: string[]
  backgroundSource: string | null
}

/**
 * Load calendar filter preferences for a goal
 */
export async function loadCalendarFilters(
  db: Firestore,
  userId: string,
  goalId: string
): Promise<CalendarFilterPreferences | null> {
  try {
    const docRef = doc(db, `users/${userId}/goals/${goalId}/settings/calendarFilters`)
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) {
      return null
    }

    return docSnap.data() as CalendarFilterPreferences
  } catch (error) {
    console.error('Failed to load calendar filters:', error)
    return null
  }
}

/**
 * Save calendar filter preferences for a goal
 */
export async function saveCalendarFilters(
  db: Firestore,
  userId: string,
  goalId: string,
  preferences: CalendarFilterPreferences
): Promise<void> {
  try {
    const docRef = doc(db, `users/${userId}/goals/${goalId}/settings/calendarFilters`)
    await setDoc(docRef, preferences, { merge: true })
  } catch (error) {
    console.error('Failed to save calendar filters:', error)
    throw error
  }
}
