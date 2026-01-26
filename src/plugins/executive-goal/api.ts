// API layer for executive goal add-on operations

import type { ExecutiveGoalPlan } from './types'
import { getFirebaseDb } from '@/lib/firebase-service'
import { logger } from '@/lib/logger'
import { collection, doc, getDocs, setDoc, deleteDoc } from 'firebase/firestore'

/**
 * Load executive goal plans, optionally filtered by date range
 * Note: Date range filtering done in memory to avoid complex Firestore index requirements
 */
export async function loadExecutiveGoalPlans(
  userId: string,
  goalId: string,
  startDate?: string,
  endDate?: string
): Promise<ExecutiveGoalPlan[]> {
  try {
    const db = getFirebaseDb()

    const plansRef = collection(db, 'users', userId, 'goals', goalId, 'addons', 'executiveGoal', 'plans')
    const snapshot = await getDocs(plansRef)
    
    const plans: ExecutiveGoalPlan[] = []
    snapshot.forEach((docSnap) => {
      const plan = {
        id: docSnap.id,
        ...docSnap.data()
      } as ExecutiveGoalPlan
      
      // Filter by date range in memory if provided
      if (startDate && endDate) {
        // Include plan if it overlaps with the date range
        if (plan.endDate >= startDate && plan.startDate <= endDate) {
          plans.push(plan)
        }
      } else {
        plans.push(plan)
      }
    })

    return plans
  } catch (error) {
    logger.error('Failed to load executive goal plans', error)
    return []
  }
}

/**
 * Save an executive goal plan
 */
export async function saveExecutiveGoalPlan(
  userId: string,
  goalId: string,
  plan: ExecutiveGoalPlan
): Promise<boolean> {
  logger.progress('Saving executive goal...')

  try {
    const db = getFirebaseDb()

    const planRef = doc(db, 'users', userId, 'goals', goalId, 'addons', 'executiveGoal', 'plans', plan.id)

    // Filter out undefined values - Firestore doesn't allow them
    const cleanPlan: Record<string, any> = {
      updatedAt: new Date().toISOString()
    }
    
    Object.entries(plan).forEach(([key, value]) => {
      if (value !== undefined) {
        cleanPlan[key] = value
      }
    })

    await setDoc(planRef, cleanPlan)

    logger.success('Executive goal saved')
    return true
  } catch (error) {
    logger.error('Save failed', error)
    return false
  }
}

/**
 * Delete an executive goal plan
 */
export async function deleteExecutiveGoalPlan(
  userId: string,
  goalId: string,
  planId: string
): Promise<boolean> {
  logger.progress('Removing executive goal...')

  try {
    const db = getFirebaseDb()

    const planRef = doc(db, 'users', userId, 'goals', goalId, 'addons', 'executiveGoal', 'plans', planId)
    await deleteDoc(planRef)

    logger.success('Executive goal removed')
    return true
  } catch (error) {
    logger.error('Remove failed', error)
    return false
  }
}
