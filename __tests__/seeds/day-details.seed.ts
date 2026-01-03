import type { DayDetails, DayStatus, SubjectEntry, AgendaItem } from '@/types'
import { getTestFirestore } from '../helpers/firebase-setup'
import { doc, setDoc } from 'firebase/firestore'

export interface SeedDayDetailsOptions {
  userId: string
  goalId: string
  date: string
  status?: DayStatus
  subject?: string
  topic?: string
  subjects?: SubjectEntry[]
  note?: string
  directHours?: number
  agendaItems?: AgendaItem[]
}

/**
 * Seeds day details directly in Firestore database.
 * This bypasses the UI and creates day details via Firestore SDK.
 */
export async function seedDayDetails(options: SeedDayDetailsOptions): Promise<DayDetails> {
  const db = getTestFirestore()

  const dayDetails: DayDetails = {
    status: options.status ?? null,
    subject: options.subject || '',
    topic: options.topic || '',
    subjects: options.subjects || [],
    note: options.note || '',
    directHours: options.directHours || 0,
    agendaItems: options.agendaItems || [],
    plannedItems: options.agendaItems || [], // For backward compatibility
  }

  const docRef = doc(db, 'users', options.userId, 'goals', options.goalId, 'days', options.date)
  
  await setDoc(docRef, {
    ...dayDetails,
    updatedAt: new Date().toISOString(),
  })

  return dayDetails
}

/**
 * Seeds multiple day details at once.
 */
export async function seedMultipleDayDetails(
  userId: string,
  goalId: string,
  daysData: Array<Omit<SeedDayDetailsOptions, 'userId' | 'goalId'>>
): Promise<DayDetails[]> {
  const results = await Promise.all(
    daysData.map(dayData => 
      seedDayDetails({ userId, goalId, ...dayData })
    )
  )
  return results
}

