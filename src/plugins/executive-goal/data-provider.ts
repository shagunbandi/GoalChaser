import type { PluginDataProvider, PluginContext, PluginDayData } from '@/sdk'
import { removeUndefinedFields } from '@/sdk'
import type { ExecutiveGoalDayData, ExecutiveGoalPlan } from './types'
import { saveExecutiveGoalPlan, deleteExecutiveGoalPlan } from './api'

/**
 * Executive Goal Data Provider
 * Uses day-based storage for compatibility with YearView
 * Each day stores references to executive goal plans that include that date
 */
export class ExecutiveGoalDataProvider implements PluginDataProvider<ExecutiveGoalDayData> {
  async loadDayData(
    context: PluginContext,
    date: string
  ): Promise<ExecutiveGoalDayData | null> {
    try {
      const docRef = context.firestore.doc(`days/${date}`)
      const docSnap = await context.firestore.getDoc(docRef)
      
      if (docSnap.exists()) {
        const data = docSnap.data()
        return {
          executiveGoalPlans: data.executiveGoalPlans || [],
          notes: data.notes || '',
        }
      }
      
      return null
    } catch (error) {
      context.logger.error('Failed to load executive goal day data', error)
      return null
    }
  }

  async loadDateRange(
    context: PluginContext,
    startDate: string,
    endDate: string
  ): Promise<Record<string, ExecutiveGoalDayData>> {
    try {
      const daysRef = context.firestore.collection('days')
      const q = context.firestore.query(
        daysRef,
        context.firestore.where('__name__', '>=', startDate),
        context.firestore.where('__name__', '<=', endDate)
      )

      const snapshot = await context.firestore.getDocs(q)
      const result: Record<string, ExecutiveGoalDayData> = {}

      snapshot.forEach((docSnap: any) => {
        const data = docSnap.data()
        result[docSnap.id] = {
          executiveGoalPlans: data.executiveGoalPlans || [],
          notes: data.notes || '',
        }
      })

      return result
    } catch (error) {
      context.logger.error('Failed to load executive goal plans', error)
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
      context.logger.error('Failed to save executive goal day data', error)
      return false
    }
  }

  /**
   * Save an executive goal plan (custom method, not from interface)
   */
  async savePlan(context: PluginContext, plan: ExecutiveGoalPlan): Promise<boolean> {
    try {
      return await saveExecutiveGoalPlan(context.userId, context.goalId, plan)
    } catch (error) {
      context.logger.error('Failed to save executive goal plan', error)
      return false
    }
  }

  /**
   * Delete an executive goal plan (custom method, not from interface)
   */
  async deletePlan(context: PluginContext, planId: string): Promise<boolean> {
    try {
      return await deleteExecutiveGoalPlan(context.userId, context.goalId, planId)
    } catch (error) {
      context.logger.error('Failed to delete executive goal plan', error)
      return false
    }
  }
}
