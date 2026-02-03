import type { PluginDataProvider, PluginContext, PluginDayData } from '@goal-chaser/sdk'
import { generateDateRange } from '@goal-chaser/sdk'
import type { LanguageTutorDayData } from './types'
import {
  loadDayData,
  saveDayData,
  loadDaysRange,
} from './api'

/**
 * Language Tutor Data Provider
 *
 * Learnings live at goal/plugin level (API: loadLearnings, saveLearning).
 * Day data = teaching content + QnA + notes.
 * - Day data: .../languageTutor/days/{date}
 */
export class LanguageTutorDataProvider implements PluginDataProvider<LanguageTutorDayData> {
  async loadDayData(
    context: PluginContext,
    date: string
  ): Promise<LanguageTutorDayData | null> {
    try {
      const dayDoc = await loadDayData(context, date)
      if (!dayDoc) return null
      
      return {
        teachingContent: dayDoc.teachingContent ?? '',
        qna: dayDoc.qna,
        notes: dayDoc.notes ?? '',
        learningId: dayDoc.learningId,
      }
    } catch (error) {
      context.logger.error('Failed to load language tutor day data', error)
      return null
    }
  }

  async loadDateRange(
    context: PluginContext,
    startDate: string,
    endDate: string
  ): Promise<Record<string, LanguageTutorDayData>> {
    try {
      const daysMap = await loadDaysRange(context, startDate, endDate)
      const dates = generateDateRange(startDate, endDate)
      const result: Record<string, LanguageTutorDayData> = {}

      for (const date of dates) {
        const dayDoc = daysMap[date]
        if (dayDoc) {
          result[date] = {
            teachingContent: dayDoc.teachingContent ?? '',
            qna: dayDoc.qna,
            notes: dayDoc.notes ?? '',
            learningId: dayDoc.learningId,
          }
        }
      }

      return result
    } catch (error) {
      context.logger.error('Failed to load language tutor date range', error)
      return {}
    }
  }

  async saveDayData(
    context: PluginContext,
    date: string,
    data: PluginDayData
  ): Promise<boolean> {
    try {
      const dayData = data as Partial<LanguageTutorDayData>
      await saveDayData(context, date, dayData)
      return true
    } catch (error) {
      context.logger.error('Failed to save language tutor day data', error)
      return false
    }
  }
}
