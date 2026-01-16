import type { PluginDataProvider, PluginContext, PluginDayData } from '@/sdk'
import type { TravelDayData, TravelPlan } from './types'
import { saveTravelPlan, deleteTravelPlan } from './api'
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore'
import { getFirebaseDb } from '@/lib/firebase-service'

/**
 * Helper function to remove undefined values from an object
 * Firestore doesn't accept undefined values
 */
function removeUndefinedValues<T extends Record<string, unknown>>(obj: T): T {
  const cleaned: Record<string, unknown> = {}
  Object.entries(obj).forEach(([key, value]) => {
    if (value !== undefined) {
      if (Array.isArray(value)) {
        cleaned[key] = value.map((item) =>
          typeof item === 'object' && item !== null
            ? removeUndefinedValues(item as Record<string, unknown>)
            : item
        )
      } else if (typeof value === 'object' && value !== null) {
        cleaned[key] = removeUndefinedValues(value as Record<string, unknown>)
      } else {
        cleaned[key] = value
      }
    }
  })
  return cleaned as T
}

/**
 * Travel Data Provider
 * Uses day-based storage for compatibility with YearView
 * Each day stores references to travel plans that include that date
 */
export class TravelDataProvider implements PluginDataProvider<TravelDayData> {
  async loadDayData(
    context: PluginContext,
    date: string
  ): Promise<TravelDayData | null> {
    try {
      const db = getFirebaseDb()
      const docRef = doc(
        db,
        'users',
        context.userId,
        'goals',
        context.goalId,
        'plugins',
        'travel',
        'days',
        date
      )
      const docSnap = await getDoc(docRef)
      return docSnap.exists() ? (docSnap.data() as TravelDayData) : null
    } catch (error) {
      context.logger.error('Failed to load travel day data', error)
      return null
    }
  }

  async loadDateRange(
    context: PluginContext,
    startDate: string,
    endDate: string
  ): Promise<Record<string, TravelDayData>> {
    try {
      const db = getFirebaseDb()
      const result: Record<string, TravelDayData> = {}

      // Query the collection for documents within the date range
      const daysRef = collection(
        db,
        'users',
        context.userId,
        'goals',
        context.goalId,
        'plugins',
        'travel',
        'days'
      )

      // Use Firestore queries to filter by date range (document IDs are dates)
      const q = query(
        daysRef,
        where('__name__', '>=', startDate),
        where('__name__', '<=', endDate)
      )

      const snapshot = await getDocs(q)

      snapshot.forEach((doc) => {
        result[doc.id] = doc.data() as TravelDayData
      })

      return result
    } catch (error) {
      context.logger.error('Failed to load travel plans', error)
      return {}
    }
  }

  async saveDayData(
    context: PluginContext,
    date: string,
    data: PluginDayData
  ): Promise<boolean> {
    try {
      const db = getFirebaseDb()
      const docRef = doc(
        db,
        'users',
        context.userId,
        'goals',
        context.goalId,
        'plugins',
        'travel',
        'days',
        date
      )
      // Remove undefined values before saving to Firestore
      const cleanedData = removeUndefinedValues(data as Record<string, unknown>)
      await setDoc(docRef, cleanedData, { merge: true })
      return true
    } catch (error) {
      context.logger.error('Failed to save travel day data', error)
      return false
    }
  }

  /**
   * Save a travel plan (custom method, not from interface)
   */
  async savePlan(context: PluginContext, plan: TravelPlan): Promise<boolean> {
    try {
      return await saveTravelPlan(context.userId, context.goalId, plan)
    } catch (error) {
      context.logger.error('Failed to save travel plan', error)
      return false
    }
  }

  /**
   * Delete a travel plan (custom method, not from interface)
   */
  async deletePlan(context: PluginContext, planId: string): Promise<boolean> {
    try {
      return await deleteTravelPlan(context.userId, context.goalId, planId)
    } catch (error) {
      context.logger.error('Failed to delete travel plan', error)
      return false
    }
  }
}
