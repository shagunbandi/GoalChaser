import type { DayDetails, DayStatus, SubjectEntry, AgendaItem } from '@/types'
import { getTestFirestore } from '../helpers/firebase-setup'
import { doc, setDoc, getDoc } from 'firebase/firestore'

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
  }

  // If subjects with topics are provided, also create subject configs
  if (options.subjects && options.subjects.length > 0) {
    for (const subjectEntry of options.subjects) {
      if (subjectEntry.topics && subjectEntry.topics.length > 0) {
        const configDocRef = doc(
          db,
          'users',
          options.userId,
          'goals',
          options.goalId,
          'subjectConfigs',
          subjectEntry.subject
        )
        
        // Only create if it doesn't exist or merge with existing topics
        await setDoc(configDocRef, {
          subject: subjectEntry.subject,
          topics: subjectEntry.topics,
          updatedAt: new Date().toISOString(),
        }, { merge: true })
      }
    }
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
export async function seedMultipleDayDetails(options: {
  userId: string
  goalId: string
  startDate: string
  endDate: string
  details: Array<Partial<Omit<SeedDayDetailsOptions, 'userId' | 'goalId' | 'date'>>>
}): Promise<DayDetails[]> {
  const { userId, goalId, startDate, endDate, details } = options
  
  // Generate date range
  const start = new Date(startDate)
  const end = new Date(endDate)
  const dates: string[] = []
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dates.push(d.toISOString().split('T')[0])
  }
  
  // Seed each day with corresponding details
  const results = await Promise.all(
    dates.map((date, index) => {
      const dayDetails = details[index] || {}
      return seedDayDetails({ userId, goalId, date, ...dayDetails })
    })
  )
  
  return results
}

/**
 * Gets day details from the database for verification
 */
export async function getDayDetailsFromDb(
  userId: string,
  goalId: string,
  date: string
): Promise<DayDetails | null> {
  const db = getTestFirestore()
  const docRef = doc(db, 'users', userId, 'goals', goalId, 'days', date)
  const docSnap = await getDoc(docRef)
  
  if (!docSnap.exists()) {
    return null
  }
  
  const data = docSnap.data()
  return {
    status: data.status ?? null,
    subject: data.subject || '',
    topic: data.topic || '',
    subjects: data.subjects || [],
    note: data.note || '',
    directHours: data.directHours || 0,
    agendaItems: data.agendaItems || [],
  }
}

