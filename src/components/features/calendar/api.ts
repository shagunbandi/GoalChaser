/**
 * Core Calendar API - Notes Only
 * 
 * This is the calendar API for the core calendar feature.
 * It handles calendar notes storage.
 */

import type { CalendarDayData } from './types'
import { getFirebaseDb, isFirebaseAvailable } from '@/lib/api/firebase-client'
import { logger } from '@/lib/logger'
import { collection, doc, getDocs, setDoc, query, where } from 'firebase/firestore'

/**
 * Load calendar data for a date range
 */
export async function loadCalendarDays(
  userId: string,
  goalId: string,
  startDate: string,
  endDate: string
): Promise<Record<string, CalendarDayData>> {
  if (!isFirebaseAvailable() || !getFirebaseDb()) {
    return {}
  }

  try {
    const db = getFirebaseDb()
    if (!db) return {}

    const daysRef = collection(db, 'users', userId, 'goals', goalId, 'addons', 'calendar', 'days')
    const q = query(
      daysRef,
      where('__name__', '>=', startDate),
      where('__name__', '<=', endDate)
    )
    
    const snapshot = await getDocs(q)
    
    const result: Record<string, CalendarDayData> = {}
    snapshot.forEach((docSnap) => {
      const data = docSnap.data()
      result[docSnap.id] = {
        date: docSnap.id,
        notes: data.notes || data.note || ''
      }
    })

    return result
  } catch (error) {
    logger.error('Failed to load calendar days', error)
    return {}
  }
}

/**
 * Save calendar data for a specific day
 */
export async function saveCalendarDay(
  userId: string,
  goalId: string,
  date: string,
  data: Partial<CalendarDayData>
): Promise<boolean> {
  logger.progress('Saving calendar...')

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

    const docRef = doc(db, 'users', userId, 'goals', goalId, 'addons', 'calendar', 'days', date)
    
    // Get existing data first
    const existingDoc = await getDocs(collection(db, 'users', userId, 'goals', goalId, 'addons', 'calendar', 'days'))
    let existingData: CalendarDayData = { date, notes: '' }
    
    existingDoc.forEach(d => {
      if (d.id === date) {
        const docData = d.data()
        existingData = { date, notes: docData.notes || docData.note || '' }
      }
    })

    const updatedData: CalendarDayData = {
      date,
      notes: data.notes !== undefined ? data.notes : existingData.notes
    }

    await setDoc(docRef, {
      ...updatedData,
      updatedAt: new Date().toISOString()
    })

    logger.success('Calendar saved')
    return true
  } catch (error) {
    logger.error('Save failed', error)
    return false
  }
}
