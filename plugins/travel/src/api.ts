// API layer for travel add-on operations (uses PluginContext only)

import type { PluginContext } from '@goal-chaser/sdk'
import type { TravelPlan } from './types'
import { getDocs, setDoc, deleteDoc } from 'firebase/firestore'

const PLANS_COLL = 'plans'

/**
 * Load travel plans, optionally filtered by date range
 */
export async function loadTravelPlans(
  context: PluginContext,
  startDate?: string,
  endDate?: string
): Promise<TravelPlan[]> {
  const { firestore, logger } = context
  try {
    const plansRef = firestore.collection(PLANS_COLL)
    const snapshot = await getDocs(plansRef)

    const plans: TravelPlan[] = []
    snapshot.forEach((docSnap) => {
      const data = docSnap.data()
      if (!data) return
      const plan = { id: docSnap.id, ...data } as TravelPlan

      if (startDate && endDate) {
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
  context: PluginContext,
  plan: TravelPlan
): Promise<boolean> {
  const { firestore, logger } = context
  logger.progress('Saving travel...')

  try {
    const planRef = firestore.doc(`${PLANS_COLL}/${plan.id}`)

    const cleanPlan: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
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
  context: PluginContext,
  planId: string
): Promise<boolean> {
  const { firestore, logger } = context
  logger.progress('Removing travel...')

  try {
    const planRef = firestore.doc(`${PLANS_COLL}/${planId}`)
    await deleteDoc(planRef)

    logger.success('Travel removed')
    return true
  } catch (error) {
    logger.error('Remove failed', error)
    return false
  }
}
