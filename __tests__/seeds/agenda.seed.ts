import { getTestFirestore } from '../helpers/firebase-setup'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import type { AgendaItem, RepeatRule } from '@/types'

export interface SeedAgendaOptions {
  userId: string
  goalId: string
  date: string // ISO date string for the day
  title: string
  startTime?: string
  endTime?: string
  note?: string
  subjects?: string[]
  repeat?: RepeatRule | null
  recurrenceId?: string
  sequenceId?: string
  recurrenceStart?: string
  recurrenceEnd?: string
}

/**
 * Seeds a single agenda item directly in Firestore for a specific date.
 */
export async function seedAgendaItem(options: SeedAgendaOptions): Promise<AgendaItem> {
  const db = getTestFirestore()
  
  const agendaItem: AgendaItem = {
    id: `agenda_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    title: options.title,
    startTime: options.startTime,
    endTime: options.endTime,
    note: options.note,
    recurrenceId: options.recurrenceId || null,
    sequenceId: options.sequenceId || `seq_${Date.now()}`,
    repeat: options.repeat || null,
    subjects: options.subjects || [],
    completed: false,
    recurrenceStart: options.recurrenceStart,
    recurrenceEnd: options.recurrenceEnd,
  }

  // Get existing day details
  const dayRef = doc(db, 'users', options.userId, 'goals', options.goalId, 'days', options.date)
  const daySnap = await getDoc(dayRef)
  
  const existingAgendaItems = daySnap.exists() ? daySnap.data().agendaItems || [] : []
  
  // Add new agenda item to the array
  await updateDoc(dayRef, {
    agendaItems: [...existingAgendaItems, agendaItem],
    updatedAt: new Date().toISOString(),
  })

  return agendaItem
}

/**
 * Seeds multiple agenda items for recurring pattern
 */
export async function seedRecurringAgenda(
  options: Omit<SeedAgendaOptions, 'date'> & { dates: string[] }
): Promise<AgendaItem[]> {
  const recurrenceId = `recur_${Date.now()}_${Math.random().toString(36).substring(7)}`
  const sequenceId = `seq_${Date.now()}`
  
  const items: AgendaItem[] = []
  
  for (const date of options.dates) {
    const item = await seedAgendaItem({
      ...options,
      date,
      recurrenceId,
      sequenceId,
    })
    items.push(item)
  }
  
  return items
}

/**
 * Verifies an agenda item exists in the database for a specific date
 */
export async function verifyAgendaInDb(
  userId: string,
  goalId: string,
  date: string,
  title: string
): Promise<boolean> {
  const db = getTestFirestore()
  const dayRef = doc(db, 'users', userId, 'goals', goalId, 'days', date)
  const daySnap = await getDoc(dayRef)
  
  if (!daySnap.exists()) return false
  
  const agendaItems = daySnap.data().agendaItems || []
  return agendaItems.some((item: AgendaItem) => item.title === title)
}

/**
 * Verifies that an agenda series exists across multiple dates
 */
export async function verifyAgendaSeriesInDb(
  userId: string,
  goalId: string,
  dates: string[],
  recurrenceId: string
): Promise<boolean> {
  const db = getTestFirestore()
  
  for (const date of dates) {
    const dayRef = doc(db, 'users', userId, 'goals', goalId, 'days', date)
    const daySnap = await getDoc(dayRef)
    
    if (!daySnap.exists()) return false
    
    const agendaItems = daySnap.data().agendaItems || []
    const hasRecurrence = agendaItems.some(
      (item: AgendaItem) => item.recurrenceId === recurrenceId
    )
    
    if (!hasRecurrence) return false
  }
  
  return true
}

/**
 * Verifies that an agenda item does NOT exist in the database
 */
export async function verifyAgendaNotInDb(
  userId: string,
  goalId: string,
  date: string,
  title: string
): Promise<boolean> {
  return !(await verifyAgendaInDb(userId, goalId, date, title))
}

/**
 * Get all agenda items for a specific date
 */
export async function getAgendaItems(
  userId: string,
  goalId: string,
  date: string
): Promise<AgendaItem[]> {
  const db = getTestFirestore()
  const dayRef = doc(db, 'users', userId, 'goals', goalId, 'days', date)
  const daySnap = await getDoc(dayRef)
  
  if (!daySnap.exists()) return []
  
  return daySnap.data().agendaItems || []
}

