/**
 * Hours Plugin Data Provider
 */

import type { PluginDataProvider, PluginContext } from '@/sdk'
import type { HoursDayData, HoursConfig, SubjectConfig } from './types'

export class HoursDataProvider implements PluginDataProvider<HoursDayData, HoursConfig> {
  /**
   * Load data for a specific date
   */
  async loadDayData(context: PluginContext, date: string): Promise<HoursDayData | null> {
    try {
      const docRef = context.firestore.doc(`days/${date}`)
      const docSnap = await context.firestore.getDoc(docRef)

      if (docSnap.exists()) {
        const data = docSnap.data()
        return {
          subjects: data.subjects || [],
          directHours: data.directHours || 0,
        }
      }

      return null
    } catch (error) {
      context.logger.error('Failed to load day data', error)
      return null
    }
  }

  /**
   * Load data for a date range
   */
  async loadDateRange(
    context: PluginContext,
    startDate: string,
    endDate: string
  ): Promise<Record<string, HoursDayData>> {
    try {
      const daysRef = context.firestore.collection('days')
      const q = context.firestore.query(
        daysRef,
        context.firestore.where('__name__', '>=', startDate),
        context.firestore.where('__name__', '<=', endDate)
      )

      const snapshot = await context.firestore.getDocs(q)

      const result: Record<string, HoursDayData> = {}
      snapshot.forEach((docSnap: any) => {
        const data = docSnap.data()
        result[docSnap.id] = {
          subjects: data.subjects || [],
          directHours: data.directHours || 0,
        }
      })

      return result
    } catch (error) {
      context.logger.error('Failed to load date range', error)
      return {}
    }
  }

  /**
   * Save data for a specific date
   */
  async saveDayData(
    context: PluginContext,
    date: string,
    data: Partial<HoursDayData>
  ): Promise<boolean> {
    context.logger.progress('Saving hours...')

    try {
      const docRef = context.firestore.doc(`days/${date}`)

      // Get existing data first
      const docSnap = await context.firestore.getDoc(docRef)
      let existingData: HoursDayData = { subjects: [], directHours: 0 }

      if (docSnap.exists()) {
        existingData = docSnap.data() as HoursDayData
      }

      const updatedData: HoursDayData = {
        subjects: data.subjects !== undefined ? data.subjects : existingData.subjects,
        directHours: data.directHours !== undefined ? data.directHours : existingData.directHours,
      }

      await context.firestore.setDoc(docRef, {
        ...updatedData,
        updatedAt: new Date().toISOString(),
      })

      context.logger.success('Hours saved')
      return true
    } catch (error) {
      context.logger.error('Save failed', error)
      return false
    }
  }

  /**
   * Load plugin configuration (subjects)
   */
  async loadConfig(context: PluginContext): Promise<HoursConfig | null> {
    try {
      // Path needs even segments for document: add 'settings' collection
      const configRef = context.firestore.doc('settings/config')
      const configSnap = await context.firestore.getDoc(configRef)

      if (configSnap.exists()) {
        const data = configSnap.data() as HoursConfig
        return {
          subjects: data.subjects || [],
        }
      }

      return null
    } catch (error) {
      context.logger.error('Failed to load config', error)
      return null
    }
  }

  /**
   * Save plugin configuration (subjects)
   */
  async saveConfig(context: PluginContext, config: HoursConfig): Promise<boolean> {
    context.logger.progress('Saving subjects...')

    try {
      const configRef = context.firestore.doc('settings/config')

      await context.firestore.setDoc(configRef, {
        subjects: config.subjects,
        updatedAt: new Date().toISOString(),
      })

      context.logger.success('Subjects saved')
      return true
    } catch (error) {
      context.logger.error('Save failed', error)
      return false
    }
  }
}
