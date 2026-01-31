// API layer for executive goal add-on operations

import type { ExecutiveGoal, ExecutiveGoalTask } from './types'
import { getFirebaseDb } from '@/lib/firebase-service'
import { logger } from '@/lib/logger'
import { collection, doc, getDoc, getDocs, setDoc, deleteDoc, query, where } from 'firebase/firestore'

const GOALS_COLL = 'goals'
const TASKS_COLL = 'tasks'
const DAYS_COLL = 'days'
const PLANS_COLL = 'plans' // legacy

function goalsPath(userId: string, goalId: string): [string, string, string, string, string, string, string] {
  return ['users', userId, 'goals', goalId, 'addons', 'executiveGoal', GOALS_COLL]
}

function tasksPath(userId: string, goalId: string): [string, string, string, string, string, string, string] {
  return ['users', userId, 'goals', goalId, 'addons', 'executiveGoal', TASKS_COLL]
}

function daysPath(userId: string, goalId: string): [string, string, string, string, string, string, string] {
  return ['users', userId, 'goals', goalId, 'addons', 'executiveGoal', DAYS_COLL]
}

function plansPath(userId: string, goalId: string): [string, string, string, string, string, string, string] {
  return ['users', userId, 'goals', goalId, 'addons', 'executiveGoal', PLANS_COLL]
}

/** Load all executive goals (goal-level). */
export async function loadExecutiveGoals(
  userId: string,
  goalId: string
): Promise<ExecutiveGoal[]> {
  try {
    const db = getFirebaseDb()
    const ref = collection(db, ...goalsPath(userId, goalId))
    const snapshot = await getDocs(ref)
    const goals: ExecutiveGoal[] = []
    snapshot.forEach((docSnap) => {
      goals.push({ id: docSnap.id, ...docSnap.data() } as ExecutiveGoal)
    })
    if (goals.length === 0) {
      const migrated = await migratePlansToGoalsAndTasks(userId, goalId)
      if (migrated.goals.length > 0) return migrated.goals
    }
    return goals
  } catch (error) {
    logger.error('Failed to load executive goals', error)
    return []
  }
}

/** Save an executive goal (goal-level). */
export async function saveExecutiveGoal(
  userId: string,
  goalId: string,
  goal: ExecutiveGoal
): Promise<boolean> {
  logger.progress('Saving executive goal...')
  try {
    const db = getFirebaseDb()
    const ref = doc(db, ...goalsPath(userId, goalId), goal.id)
    const clean: Record<string, unknown> = { updatedAt: new Date().toISOString() }
    Object.entries(goal).forEach(([k, v]) => {
      if (v !== undefined) clean[k] = v
    })
    await setDoc(ref, clean)
    logger.success('Executive goal saved')
    return true
  } catch (error) {
    logger.error('Save executive goal failed', error)
    return false
  }
}

/** Delete an executive goal and all its tasks (cascade). */
export async function deleteExecutiveGoal(
  userId: string,
  goalId: string,
  executiveGoalId: string
): Promise<boolean> {
  logger.progress('Removing executive goal...')
  try {
    const db = getFirebaseDb()
    const tasksRef = collection(db, ...tasksPath(userId, goalId))
    const q = query(tasksRef, where('parentExecutiveGoalId', '==', executiveGoalId))
    const snapshot = await getDocs(q)
    for (const docSnap of snapshot.docs) {
      await deleteDoc(doc(db, ...tasksPath(userId, goalId), docSnap.id))
    }
    await deleteDoc(doc(db, ...goalsPath(userId, goalId), executiveGoalId))
    logger.success('Executive goal removed')
    return true
  } catch (error) {
    logger.error('Delete executive goal failed', error)
    return false
  }
}

/** Load tasks whose endDate (due date) falls in [startDate, endDate]. */
export async function loadExecutiveTasks(
  userId: string,
  goalId: string,
  startDate: string,
  endDate: string
): Promise<ExecutiveGoalTask[]> {
  try {
    const db = getFirebaseDb()
    const ref = collection(db, ...tasksPath(userId, goalId))
    const snapshot = await getDocs(ref)
    const tasks: ExecutiveGoalTask[] = []
    snapshot.forEach((docSnap) => {
      const t = { id: docSnap.id, ...docSnap.data() } as ExecutiveGoalTask
      if (t.endDate && t.endDate >= startDate && t.endDate <= endDate) tasks.push(t)
    })
    return tasks
  } catch (error) {
    logger.error('Failed to load executive tasks', error)
    return []
  }
}

/** Save an executive task (day-level). */
export async function saveExecutiveTask(
  userId: string,
  goalId: string,
  task: ExecutiveGoalTask
): Promise<boolean> {
  try {
    const db = getFirebaseDb()
    const ref = doc(db, ...tasksPath(userId, goalId), task.id)
    const clean: Record<string, unknown> = { updatedAt: new Date().toISOString() }
    Object.entries(task).forEach(([k, v]) => {
      if (v !== undefined) clean[k] = v
    })
    await setDoc(ref, clean)
    return true
  } catch (error) {
    logger.error('Save executive task failed', error)
    return false
  }
}

/** Delete an executive task. */
export async function deleteExecutiveTask(
  userId: string,
  goalId: string,
  taskId: string
): Promise<boolean> {
  try {
    const db = getFirebaseDb()
    await deleteDoc(doc(db, ...tasksPath(userId, goalId), taskId))
    return true
  } catch (error) {
    logger.error('Delete executive task failed', error)
    return false
  }
}

/** Load day notes from days/{date}. */
export async function loadExecutiveDayNotes(
  userId: string,
  goalId: string,
  date: string
): Promise<string> {
  const day = await loadExecutiveDay(userId, goalId, date)
  return day?.notes ?? ''
}

/** Load a single day doc (notes). Firestore doc path is days/{date}. */
export async function loadExecutiveDay(
  userId: string,
  goalId: string,
  date: string
): Promise<{ notes?: string } | null> {
  try {
    const db = getFirebaseDb()
    const ref = doc(db, ...daysPath(userId, goalId), date)
    const snap = await getDoc(ref)
    if (!snap.exists()) return null
    return snap.data() as { notes?: string }
  } catch {
    return null
  }
}

/** Load all day docs (notes) in a date range with a single query. Use this instead of calling loadExecutiveDay per date. */
export async function loadExecutiveDaysRange(
  userId: string,
  goalId: string,
  startDate: string,
  endDate: string
): Promise<Record<string, { notes?: string }>> {
  try {
    const db = getFirebaseDb()
    const daysRef = collection(db, ...daysPath(userId, goalId))
    const q = query(
      daysRef,
      where('__name__', '>=', startDate),
      where('__name__', '<=', endDate)
    )
    const snapshot = await getDocs(q)
    const result: Record<string, { notes?: string }> = {}
    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as { notes?: string }
      result[docSnap.id] = { notes: data?.notes ?? '' }
    })
    return result
  } catch {
    return {}
  }
}

/** Save day notes to days/{date}. */
export async function saveExecutiveDayNotes(
  userId: string,
  goalId: string,
  date: string,
  notes: string
): Promise<boolean> {
  try {
    const db = getFirebaseDb()
    const ref = doc(db, ...daysPath(userId, goalId), date)
    await setDoc(ref, { notes, updatedAt: new Date().toISOString() }, { merge: true })
    return true
  } catch (error) {
    logger.error('Save day notes failed', error)
    return false
  }
}

/** One-time migration: read legacy plans, write goals + tasks, then remove plans. */
async function migratePlansToGoalsAndTasks(
  userId: string,
  goalId: string
): Promise<{ goals: ExecutiveGoal[]; tasks: ExecutiveGoalTask[] }> {
  const db = getFirebaseDb()
  const plansRef = collection(db, ...plansPath(userId, goalId))
  const snapshot = await getDocs(plansRef)
  const goals: ExecutiveGoal[] = []
  const tasks: ExecutiveGoalTask[] = []
  interface LegacyPlan {
    id: string
    title?: string
    startDate?: string
    endDate?: string
    plan?: string
    note?: string
    color?: string
    files?: unknown[]
    completed?: boolean
    completionNote?: string
    parentExecutiveGoalId?: string
    progressSoFar?: unknown[]
    aiUsage?: unknown
  }
  for (const docSnap of snapshot.docs) {
    const data = docSnap.data() as LegacyPlan
    const id = docSnap.id
    if (data.parentExecutiveGoalId) {
      tasks.push({
        id,
        title: data.title ?? 'Task',
        parentExecutiveGoalId: data.parentExecutiveGoalId,
        endDate: data.endDate ?? data.startDate ?? new Date().toISOString().split('T')[0],
        completed: data.completed,
        completionNote: data.completionNote,
        color: data.color,
      } as ExecutiveGoalTask)
    } else {
      goals.push({
        id,
        title: data.title ?? 'Goal',
        startDate: data.startDate ?? new Date().toISOString().split('T')[0],
        endDate: data.endDate ?? data.startDate ?? new Date().toISOString().split('T')[0],
        plan: data.plan,
        note: data.note,
        color: data.color,
        files: data.files,
        progressSoFar: data.progressSoFar as ExecutiveGoal['progressSoFar'],
        aiUsage: data.aiUsage as ExecutiveGoal['aiUsage'],
      } as ExecutiveGoal)
    }
  }
  for (const g of goals) {
    await setDoc(doc(db, ...goalsPath(userId, goalId), g.id), {
      ...g,
      updatedAt: new Date().toISOString(),
    })
  }
  for (const t of tasks) {
    await setDoc(doc(db, ...tasksPath(userId, goalId), t.id), {
      ...t,
      updatedAt: new Date().toISOString(),
    })
  }
  for (const docSnap of snapshot.docs) {
    await deleteDoc(doc(db, ...plansPath(userId, goalId), docSnap.id))
  }
  logger.info('Migrated executive goal plans to goals + tasks')
  return { goals, tasks }
}
