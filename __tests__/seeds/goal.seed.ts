import { getTestFirestore } from '../helpers/firebase-setup'
import { doc, setDoc } from 'firebase/firestore'
import type { Goal, SuccessCriterion } from '@/types'

export interface SeedGoalOptions {
  userId: string
  name?: string
  description?: string
  color?: string
  startDate?: string
  endDate?: string
  successCriterion?: SuccessCriterion
}

/**
 * Seeds a goal directly in Firestore database.
 * This bypasses the UI and creates the goal via Firestore SDK.
 */
export async function seedGoal(options: SeedGoalOptions): Promise<Goal> {
  const db = getTestFirestore()

  const goalId = `goal_${Date.now()}_${Math.random().toString(36).substring(7)}`
  const goal: Goal = {
    id: goalId,
    name: options.name || 'Test Goal',
    description: options.description || 'Test goal description',
    createdAt: new Date().toISOString(),
    color: options.color || '#AF52DE',
    startDate: options.startDate,
    endDate: options.endDate,
    successCriterion: options.successCriterion,
  }

  const goalRef = doc(db, 'users', options.userId, 'goals', goalId)
  await setDoc(goalRef, {
    name: goal.name,
    description: goal.description,
    createdAt: goal.createdAt,
    color: goal.color,
    startDate: goal.startDate || null,
    endDate: goal.endDate || null,
    successCriterion: goal.successCriterion || null,
    updatedAt: new Date().toISOString(),
  })

  return goal
}

