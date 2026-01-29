import type { PluginDataProvider, PluginContext, PluginDayData } from '@/sdk'
import { removeUndefinedFields } from '@/sdk'
import { generateDateRange } from '@/sdk'
import type { ExecutiveGoalDayData, ExecutiveGoalPlan } from './types'
import {
  loadExecutiveGoalPlans,
  saveExecutiveGoalPlan,
  deleteExecutiveGoalPlan,
} from './api'

/**
 * Executive Goal Data Provider
 *
 * DB structure:
 * - Executive goals at main level: users/{userId}/goals/{goalId}/addons/executiveGoal/plans/{planId}
 * - Each plan is either a goal (no parentExecutiveGoalId) or a task (parentExecutiveGoalId set).
 * - Tasks are attached to a day via startDate/endDate (same day for single-day tasks).
 *
 * Calendar day data is derived from plans: for each date we include plans that overlap that date.
 * Optional per-day notes are stored in days/{date} and merged when present.
 */
export class ExecutiveGoalDataProvider implements PluginDataProvider<ExecutiveGoalDayData> {
  async loadDayData(
    context: PluginContext,
    date: string
  ): Promise<ExecutiveGoalDayData | null> {
    try {
      const plans = await loadExecutiveGoalPlans(
        context.userId,
        context.goalId,
        date,
        date
      )
      const dayData: ExecutiveGoalDayData = {
        executiveGoalPlans: plans,
        notes: '',
      }
      // Merge notes from days collection if present
      const dayRef = context.firestore.doc(`days/${date}`)
      const daySnap = await context.firestore.getDoc(dayRef)
      if (daySnap.exists()) {
        const d = daySnap.data()
        if (d?.notes) dayData.notes = d.notes
      }
      return dayData
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
      const plans = await loadExecutiveGoalPlans(
        context.userId,
        context.goalId,
        startDate,
        endDate
      )
      const dates = generateDateRange(startDate, endDate)
      const result: Record<string, ExecutiveGoalDayData> = {}

      for (const date of dates) {
        const plansForDay = plans.filter(
          (p) => date >= p.startDate && date <= p.endDate
        )
        result[date] = {
          executiveGoalPlans: plansForDay,
          notes: '',
        }
      }

      // Optionally merge notes from days collection for this range
      try {
        const daysRef = context.firestore.collection('days')
        const q = context.firestore.query(
          daysRef,
          context.firestore.where('__name__', '>=', startDate),
          context.firestore.where('__name__', '<=', endDate)
        )
        const snapshot = await context.firestore.getDocs(q)
        snapshot.forEach((docSnap: { id: string; data: () => { notes?: string } }) => {
          const data = docSnap.data()
          if (result[docSnap.id] && data?.notes) {
            result[docSnap.id].notes = data.notes
          }
        })
      } catch {
        // Non-fatal: notes are optional
      }

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
      const dayData = data as Partial<ExecutiveGoalDayData>

      // Persist each plan to the plans collection (single source of truth)
      if (dayData.executiveGoalPlans?.length) {
        for (const plan of dayData.executiveGoalPlans) {
          if (plan?.id) {
            await saveExecutiveGoalPlan(context.userId, context.goalId, plan as ExecutiveGoalPlan)
          }
        }
      }

      // Persist notes to days/{date}
      if (dayData.notes !== undefined) {
        const docRef = context.firestore.doc(`days/${date}`)
        const cleaned = removeUndefinedFields({
          notes: dayData.notes,
          updatedAt: new Date().toISOString(),
        })
        await context.firestore.setDoc(docRef, cleaned, { merge: true })
      }

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
