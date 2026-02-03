// API layer for language tutor plugin operations (uses PluginContext only)

import type { PluginContext } from '@goal-chaser/sdk'
import type { LanguageLearning, LanguageTutorDayData } from './types'
import { getDocs, getDoc, setDoc, deleteDoc, query, where } from 'firebase/firestore'

const LEARNINGS_COLL = 'learnings'
const DAYS_COLL = 'days'

/** Load all language learning objects (goal-level). */
export async function loadLearnings(
  context: PluginContext
): Promise<LanguageLearning[]> {
  const { firestore, logger } = context
  try {
    const ref = firestore.collection(LEARNINGS_COLL)
    const snapshot = await getDocs(ref)
    const learnings: LanguageLearning[] = []
    snapshot.forEach((docSnap) => {
      const data = docSnap.data()
      if (data) learnings.push({ id: docSnap.id, ...data } as LanguageLearning)
    })
    return learnings
  } catch (error) {
    logger.error('Failed to load language learnings', error)
    return []
  }
}

/** Save a language learning object (goal-level). */
export async function saveLearning(
  context: PluginContext,
  learning: LanguageLearning
): Promise<boolean> {
  const { firestore, logger } = context
  logger.progress('Saving language learning...')
  try {
    const ref = firestore.doc(`${LEARNINGS_COLL}/${learning.id}`)
    const clean: Record<string, unknown> = { updatedAt: new Date().toISOString() }
    Object.entries(learning).forEach(([k, v]) => {
      if (v !== undefined) clean[k] = v
    })
    await setDoc(ref, clean)
    logger.success('Language learning saved')
    return true
  } catch (error) {
    logger.error('Save language learning failed', error)
    return false
  }
}

/** Delete a language learning and all its day data (cascade). */
export async function deleteLearning(
  context: PluginContext,
  learningId: string
): Promise<boolean> {
  const { firestore, logger } = context
  logger.progress('Removing language learning...')
  try {
    // Delete the learning document
    await deleteDoc(firestore.doc(`${LEARNINGS_COLL}/${learningId}`))
    
    // Note: Day data is not tied to specific learnings, so we don't cascade delete
    // Users might have multiple learnings and we don't want to delete all day data
    
    logger.success('Language learning removed')
    return true
  } catch (error) {
    logger.error('Delete language learning failed', error)
    return false
  }
}

/** Load day data for a specific date. */
export async function loadDayData(
  context: PluginContext,
  date: string
): Promise<LanguageTutorDayData | null> {
  const { firestore } = context
  try {
    const ref = firestore.doc(`${DAYS_COLL}/${date}`)
    const snap = await getDoc(ref)
    if (!snap.exists()) return null
    return snap.data() as LanguageTutorDayData
  } catch {
    return null
  }
}

/** Save day data (teaching content + QnA + notes). */
export async function saveDayData(
  context: PluginContext,
  date: string,
  data: Partial<LanguageTutorDayData>
): Promise<boolean> {
  const { firestore, logger } = context
  try {
    const ref = firestore.doc(`${DAYS_COLL}/${date}`)
    
    // Filter out undefined values (Firestore doesn't accept them)
    const clean: Record<string, unknown> = { updatedAt: new Date().toISOString() }
    Object.entries(data).forEach(([k, v]) => {
      if (v !== undefined) clean[k] = v
    })
    
    await setDoc(ref, clean, { merge: true })
    return true
  } catch (error) {
    logger.error('Save day data failed', error)
    return false
  }
}

/** Load all day docs in a date range with a single query. */
export async function loadDaysRange(
  context: PluginContext,
  startDate: string,
  endDate: string
): Promise<Record<string, LanguageTutorDayData>> {
  const { firestore } = context
  try {
    const daysRef = firestore.collection(DAYS_COLL)
    const q = query(
      daysRef,
      where('__name__', '>=', startDate),
      where('__name__', '<=', endDate)
    )
    const snapshot = await getDocs(q)
    const result: Record<string, LanguageTutorDayData> = {}
    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as LanguageTutorDayData
      result[docSnap.id] = data
    })
    return result
  } catch {
    return {}
  }
}
