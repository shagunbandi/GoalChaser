import type { PluginDataProvider, PluginContext, PluginDayData } from '@goal-chaser/sdk'
import { removeUndefinedFields } from '@goal-chaser/sdk'
import type { TravelDayData, TravelPlan, TravelConfig } from './types'
import { saveTravelPlan, deleteTravelPlan } from './api'

/**
 * Travel Data Provider
 * Uses day-based storage for compatibility with YearView
 * Each day stores references to travel plans that include that date
 */
export class TravelDataProvider implements PluginDataProvider<TravelDayData, TravelConfig> {
  async loadDayData(
    context: PluginContext,
    date: string
  ): Promise<TravelDayData | null> {
    try {
      const docRef = context.firestore.doc(`days/${date}`)
      const docSnap = await context.firestore.getDoc(docRef)
      
      if (docSnap.exists()) {
        const data = docSnap.data()
        return {
          travelPlans: data.travelPlans || [],
          notes: data.notes || '',
        }
      }
      
      return null
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
      const daysRef = context.firestore.collection('days')
      const q = context.firestore.query(
        daysRef,
        context.firestore.where('__name__', '>=', startDate),
        context.firestore.where('__name__', '<=', endDate)
      )

      const snapshot = await context.firestore.getDocs(q)
      const result: Record<string, TravelDayData> = {}

      snapshot.forEach((docSnap: any) => {
        const data = docSnap.data()
        result[docSnap.id] = {
          travelPlans: data.travelPlans || [],
          notes: data.notes || '',
        }
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
      const docRef = context.firestore.doc(`days/${date}`)
      
      // Remove undefined values before saving to Firestore
      const cleanedData = removeUndefinedFields({
        ...data,
        updatedAt: new Date().toISOString(),
      })
      
      await context.firestore.setDoc(docRef, cleanedData, { merge: true })
      return true
    } catch (error) {
      context.logger.error('Failed to save travel day data', error)
      return false
    }
  }

  /** Save many days in one Firestore batch (one round-trip instead of N). */
  async saveDayDataBatch(
    context: PluginContext,
    updates: Array<{ date: string; data: Partial<TravelDayData> }>
  ): Promise<void> {
    if (updates.length === 0) return
    if (!context.firestore.writeBatch) {
      // Fallback: sequential saveDayData
      for (const { date, data } of updates) {
        await this.saveDayData(context, date, data as PluginDayData)
      }
      return
    }
    try {
      const batch = context.firestore.writeBatch()
      const updatedAt = new Date().toISOString()
      for (const { date, data } of updates) {
        const docRef = context.firestore.doc(`days/${date}`)
        const cleanedData = removeUndefinedFields({
          ...data,
          updatedAt,
        })
        batch.set(docRef, cleanedData, { merge: true })
      }
      await batch.commit()
    } catch (error) {
      context.logger.error('Failed to save travel day data batch', error)
      throw error
    }
  }

  /**
   * Save a travel plan (custom method, not from interface)
   */
  async savePlan(context: PluginContext, plan: TravelPlan): Promise<boolean> {
    try {
      return await saveTravelPlan(context, plan)
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
      return await deleteTravelPlan(context, planId)
    } catch (error) {
      context.logger.error('Failed to delete travel plan', error)
      return false
    }
  }

  async loadConfig(context: PluginContext): Promise<TravelConfig | null> {
    try {
      const configRef = context.firestore.doc('settings/config')
      const configSnap = await context.firestore.getDoc(configRef)
      if (configSnap.exists()) {
        return configSnap.data() as TravelConfig
      }
      return null
    } catch (error) {
      context.logger.error('Failed to load travel config', error)
      return null
    }
  }

  async saveConfig(context: PluginContext, config: TravelConfig): Promise<boolean> {
    try {
      const configRef = context.firestore.doc('settings/config')
      await context.firestore.setDoc(configRef, {
        ...config,
        updatedAt: new Date().toISOString(),
      })
      return true
    } catch (error) {
      context.logger.error('Failed to save travel config', error)
      return false
    }
  }
}
