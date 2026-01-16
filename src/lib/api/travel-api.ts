// API layer for travel add-on operations

import type { TravelPlan } from '@/types'
import { getFirebaseDb, isFirebaseAvailable } from './firebase-client'
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
  if (!isFirebaseAvailable() || !getFirebaseDb()) {
    return []
  }

  try {
    const db = getFirebaseDb()
    if (!db) return []

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

    const planRef = doc(db, 'users', userId, 'goals', goalId, 'addons', 'travel', 'plans', plan.id)

    await setDoc(planRef, {
      ...plan,
      updatedAt: new Date().toISOString()
    })

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

  if (!isFirebaseAvailable() || !getFirebaseDb()) {
    logger.error('Remove failed')
    return false
  }

  try {
    const db = getFirebaseDb()
    if (!db) {
      logger.error('Remove failed')
      return false
    }

    const planRef = doc(db, 'users', userId, 'goals', goalId, 'addons', 'travel', 'plans', planId)
    await deleteDoc(planRef)

    logger.success('Travel removed')
    return true
  } catch (error) {
    logger.error('Remove failed', error)
    return false
  }
}
