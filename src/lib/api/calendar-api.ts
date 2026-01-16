// API layer for calendar add-on operations

import type { CalendarDayData } from '@/types'
import { getFirebaseDb, isFirebaseAvailable } from './firebase-client'
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
        note: data.note || '',
        agendaItems: data.agendaItems || []
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
    let existingData: CalendarDayData = { note: '', agendaItems: [] }
    
    existingDoc.forEach(d => {
      if (d.id === date) {
        existingData = d.data() as CalendarDayData
      }
    })

    const updatedData: CalendarDayData = {
      note: data.note !== undefined ? data.note : existingData.note,
      agendaItems: data.agendaItems !== undefined ? data.agendaItems : existingData.agendaItems
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
