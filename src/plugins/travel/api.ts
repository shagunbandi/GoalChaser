// API layer for travel add-on operations

import type { TravelPlan } from './types'
import { getFirebaseDb } from '@/lib/firebase-service'
import { logger } from '@/lib/logger'
import { collection, doc, getDocs, setDoc, deleteDoc } from 'firebase/firestore'

/**
 * Load travel plans, optionally filtered by date range
 * Note: Date range filtering done in memory to avoid complex Firestore index requirements
 */
export async function loadTravelPlans(
  userId: string,
  goalId: string,
  startDate?: string,
  endDate?: string
): Promise<TravelPlan[]> {
  try {
    const db = getFirebaseDb()

    const plansRef = collection(db, 'users', userId, 'goals', goalId, 'addons', 'travel', 'plans')
    const snapshot = await getDocs(plansRef)
    
    const plans: TravelPlan[] = []
    snapshot.forEach((docSnap) => {
      const plan = {
        id: docSnap.id,
        ...docSnap.data()
      } as TravelPlan
      
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
    logger.error('Failed to load travel plans', error)
    return []
  }
}

/**
 * Save a travel plan
 */
export async function saveTravelPlan(
  userId: string,
  goalId: string,
  plan: TravelPlan
): Promise<boolean> {
  logger.progress('Saving travel...')

  try {
    const db = getFirebaseDb()

    const planRef = doc(db, 'users', userId, 'goals', goalId, 'addons', 'travel', 'plans', plan.id)

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

    logger.success('Travel saved')
    return true
  } catch (error) {
    logger.error('Save failed', error)
    return false
  }
}

/**
 * Delete a travel plan
 */
export async function deleteTravelPlan(
  userId: string,
  goalId: string,
  planId: string
): Promise<boolean> {
  logger.progress('Removing travel...')

  try {
    const db = getFirebaseDb()

    const planRef = doc(db, 'users', userId, 'goals', goalId, 'addons', 'travel', 'plans', planId)
    await deleteDoc(planRef)

    logger.success('Travel removed')
    return true
  } catch (error) {
    logger.error('Remove failed', error)
    return false
  }
}
