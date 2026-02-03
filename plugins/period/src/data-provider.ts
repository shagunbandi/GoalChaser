/**
 * Period Plugin Data Provider
 */

import type { PluginDataProvider, PluginContext } from '@goal-chaser/sdk'
import type { PeriodDayData, PeriodConfig } from './types'

export class PeriodDataProvider implements PluginDataProvider<PeriodDayData, PeriodConfig> {
  async loadDayData(context: PluginContext, date: string): Promise<PeriodDayData | null> {
    try {
      const docRef = context.firestore.doc(`days/${date}`)
      const docSnap = await context.firestore.getDoc(docRef)

      if (docSnap.exists()) {
        const data = docSnap.data()
        return {
          isPeriod: data.isPeriod ?? false,
          notes: data.notes || '',
        }
      }

      return null
    } catch (error) {
      context.logger.error('Failed to load day data', error)
      return null
    }
  }

  async loadDateRange(
    context: PluginContext,
    startDate: string,
    endDate: string
  ): Promise<Record<string, PeriodDayData>> {
    try {
      const daysRef = context.firestore.collection('days')
      const q = context.firestore.query(
        daysRef,
        context.firestore.where('__name__', '>=', startDate),
        context.firestore.where('__name__', '<=', endDate)
      )

      const snapshot = await context.firestore.getDocs(q)

      const result: Record<string, PeriodDayData> = {}
      snapshot.forEach((docSnap: any) => {
        const data = docSnap.data()
        result[docSnap.id] = {
          isPeriod: data.isPeriod ?? false,
          notes: data.notes || '',
        }
      })

      return result
    } catch (error) {
      context.logger.error('Failed to load date range', error)
      return {}
    }
  }

  async saveDayData(
    context: PluginContext,
    date: string,
    data: Partial<PeriodDayData>
  ): Promise<boolean> {
    context.logger.progress('Saving period data...')

    try {
      const docRef = context.firestore.doc(`days/${date}`)

      // Filter out undefined values - Firestore doesn't accept them
      const cleanData: Record<string, any> = {}
      if (data.isPeriod !== undefined) {
        cleanData.isPeriod = data.isPeriod
      }
      if (data.notes !== undefined) {
        cleanData.notes = data.notes
      }

      await context.firestore.setDoc(docRef, {
        ...cleanData,
        updatedAt: new Date().toISOString(),
      })

      context.logger.success('Period data saved')
      return true
    } catch (error) {
      context.logger.error('Save failed', error)
      return false
    }
  }

  async loadConfig(context: PluginContext): Promise<PeriodConfig | null> {
    try {
      const configRef = context.firestore.doc('settings/config')
      const configSnap = await context.firestore.getDoc(configRef)

      if (configSnap.exists()) {
        return configSnap.data() as PeriodConfig
      }

      return null
    } catch (error) {
      context.logger.error('Failed to load config', error)
      return null
    }
  }

  async saveConfig(context: PluginContext, config: PeriodConfig): Promise<boolean> {
    context.logger.progress('Saving period config...')

    try {
      const configRef = context.firestore.doc('settings/config')

      await context.firestore.setDoc(configRef, {
        ...config,
        updatedAt: new Date().toISOString(),
      })

      context.logger.success('Period config saved')
      return true
    } catch (error) {
      context.logger.error('Save failed', error)
      return false
    }
  }
}
