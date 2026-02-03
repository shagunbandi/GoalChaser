// API layer for executive goal add-on operations (uses PluginContext only)

import type { PluginContext } from '@goal-chaser/sdk'
import type { ExecutiveGoal, ExecutiveGoalTask } from './types'
import { getDocs, getDoc, setDoc, deleteDoc, query, where } from 'firebase/firestore'

const GOALS_COLL = 'goals'
const TASKS_COLL = 'tasks'
const DAYS_COLL = 'days'
const PLANS_COLL = 'plans' // legacy

/** Load all executive goals (goal-level). */
export async function loadExecutiveGoals(
  context: PluginContext
): Promise<ExecutiveGoal[]> {
  const { firestore, logger } = context
  try {
    const ref = firestore.collection(GOALS_COLL)
    const snapshot = await getDocs(ref)
    const goals: ExecutiveGoal[] = []
    snapshot.forEach((docSnap) => {
      const data = docSnap.data()
      if (data) goals.push({ id: docSnap.id, ...data } as ExecutiveGoal)
    })
    if (goals.length === 0) {
      const migrated = await migratePlansToGoalsAndTasks(context)
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
  context: PluginContext,
  goal: ExecutiveGoal
): Promise<boolean> {
  const { firestore, logger } = context
  logger.progress('Saving executive goal...')
  try {
    const ref = firestore.doc(`${GOALS_COLL}/${goal.id}`)
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
  context: PluginContext,
  executiveGoalId: string
): Promise<boolean> {
  const { firestore, logger } = context
  logger.progress('Removing executive goal...')
  try {
    const tasksRef = firestore.collection(TASKS_COLL)
    const q = query(tasksRef, where('parentExecutiveGoalId', '==', executiveGoalId))
    const snapshot = await getDocs(q)
    for (const docSnap of snapshot.docs) {
      await deleteDoc(firestore.doc(`${TASKS_COLL}/${docSnap.id}`))
    }
    await deleteDoc(firestore.doc(`${GOALS_COLL}/${executiveGoalId}`))
    logger.success('Executive goal removed')
    return true
  } catch (error) {
    logger.error('Delete executive goal failed', error)
    return false
  }
}

/** Load tasks whose endDate (due date) falls in [startDate, endDate]. */
export async function loadExecutiveTasks(
  context: PluginContext,
  startDate: string,
  endDate: string
): Promise<ExecutiveGoalTask[]> {
  const { firestore, logger } = context
  try {
    const ref = firestore.collection(TASKS_COLL)
    const snapshot = await getDocs(ref)
    const tasks: ExecutiveGoalTask[] = []
    snapshot.forEach((docSnap) => {
      const data = docSnap.data()
      if (!data) return
      const t = { id: docSnap.id, ...data } as ExecutiveGoalTask
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
  context: PluginContext,
  task: ExecutiveGoalTask
): Promise<boolean> {
  const { firestore, logger } = context
  try {
    const ref = firestore.doc(`${TASKS_COLL}/${task.id}`)
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
  context: PluginContext,
  taskId: string
): Promise<boolean> {
  const { firestore, logger } = context
  try {
    await deleteDoc(firestore.doc(`${TASKS_COLL}/${taskId}`))
    return true
  } catch (error) {
    logger.error('Delete executive task failed', error)
    return false
  }
}

/** Load day notes from days/{date}. */
export async function loadExecutiveDayNotes(
  context: PluginContext,
  date: string
): Promise<string> {
  const day = await loadExecutiveDay(context, date)
  return day?.notes ?? ''
}

/** Load a single day doc (notes). Firestore doc path is days/{date}. */
export async function loadExecutiveDay(
  context: PluginContext,
  date: string
): Promise<{ notes?: string } | null> {
  const { firestore } = context
  try {
    const ref = firestore.doc(`${DAYS_COLL}/${date}`)
    const snap = await getDoc(ref)
    if (!snap.exists()) return null
    return snap.data() as { notes?: string }
  } catch {
    return null
  }
}

/** Load all day docs (notes) in a date range with a single query. */
export async function loadExecutiveDaysRange(
  context: PluginContext,
  startDate: string,
  endDate: string
): Promise<Record<string, { notes?: string }>> {
  const { firestore } = context
  try {
    const daysRef = firestore.collection(DAYS_COLL)
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
  context: PluginContext,
  date: string,
  notes: string
): Promise<boolean> {
  const { firestore, logger } = context
  try {
    const ref = firestore.doc(`${DAYS_COLL}/${date}`)
    await setDoc(ref, { notes, updatedAt: new Date().toISOString() }, { merge: true })
    return true
  } catch (error) {
    logger.error('Save day notes failed', error)
    return false
  }
}

/** One-time migration: read legacy plans, write goals + tasks, then remove plans. */
async function migratePlansToGoalsAndTasks(
  context: PluginContext
): Promise<{ goals: ExecutiveGoal[]; tasks: ExecutiveGoalTask[] }> {
  const { firestore, logger } = context
  const plansRef = firestore.collection(PLANS_COLL)
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
    await setDoc(firestore.doc(`${GOALS_COLL}/${g.id}`), {
      ...g,
      updatedAt: new Date().toISOString(),
    })
  }
  for (const t of tasks) {
    await setDoc(firestore.doc(`${TASKS_COLL}/${t.id}`), {
      ...t,
      updatedAt: new Date().toISOString(),
    })
  }
  for (const docSnap of snapshot.docs) {
    await deleteDoc(firestore.doc(`${PLANS_COLL}/${docSnap.id}`))
  }
  logger.info('Migrated executive goal plans to goals + tasks')
  return { goals, tasks }
}
