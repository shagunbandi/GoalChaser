/**
 * Productivity Plugin Data Provider
 */

import type { PluginDataProvider, PluginContext } from '@/sdk'
import type { ProductivityDayData, ProductivityConfig } from './types'

export class ProductivityDataProvider implements PluginDataProvider<ProductivityDayData, ProductivityConfig> {
  async loadDayData(context: PluginContext, date: string): Promise<ProductivityDayData | null> {
    try {
      const docRef = context.firestore.doc(`days/${date}`)
      const docSnap = await context.firestore.getDoc(docRef)

      if (docSnap.exists()) {
        const data = docSnap.data()
        return {
          status: data.status ?? null,
          areas: data.areas || [],
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
  ): Promise<Record<string, ProductivityDayData>> {
    try {
      const daysRef = context.firestore.collection('days')
      const q = context.firestore.query(
        daysRef,
        context.firestore.where('__name__', '>=', startDate),
        context.firestore.where('__name__', '<=', endDate)
      )

      const snapshot = await context.firestore.getDocs(q)

      const result: Record<string, ProductivityDayData> = {}
      snapshot.forEach((docSnap: any) => {
        const data = docSnap.data()
        result[docSnap.id] = {
          status: data.status ?? null,
          areas: data.areas || [],
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
    data: Partial<ProductivityDayData>
  ): Promise<boolean> {
    context.logger.progress('Saving productivity data...')

    try {
      const docRef = context.firestore.doc(`days/${date}`)

      // Filter out undefined values - Firestore doesn't accept them
      const cleanData: Record<string, any> = {}
      if (data.status !== undefined) {
        cleanData.status = data.status
      }
      if (data.areas !== undefined) {
        cleanData.areas = data.areas
      }
      if (data.notes !== undefined) {
        cleanData.notes = data.notes
      }

      await context.firestore.setDoc(docRef, {
        ...cleanData,
        updatedAt: new Date().toISOString(),
      })

      context.logger.success('Productivity data saved')
      return true
    } catch (error) {
      context.logger.error('Save failed', error)
      return false
    }
  }

  async loadConfig(context: PluginContext): Promise<ProductivityConfig | null> {
    try {
      const configRef = context.firestore.doc('settings/config')
      const configSnap = await context.firestore.getDoc(configRef)

      if (configSnap.exists()) {
        const data = configSnap.data() as ProductivityConfig
        return {
          areas: data.areas || [],
        }
      }

      return null
    } catch (error) {
      context.logger.error('Failed to load config', error)
      return null
    }
  }

  async saveConfig(context: PluginContext, config: ProductivityConfig): Promise<boolean> {
    context.logger.progress('Saving areas...')

    try {
      const configRef = context.firestore.doc('settings/config')

      await context.firestore.setDoc(configRef, {
        areas: config.areas,
        updatedAt: new Date().toISOString(),
      })

      context.logger.success('Areas saved')
      return true
    } catch (error) {
      context.logger.error('Save failed', error)
      return false
    }
  }
}
