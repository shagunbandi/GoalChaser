import type { PluginDataProvider, PluginContext, PluginDayData } from '@/sdk'
import { generateDateRange } from '@/sdk'
import type { ExecutiveGoalDayData, ExecutiveGoalTask } from './types'
import {
  loadExecutiveTasks,
  saveExecutiveTask,
  loadExecutiveDaysRange,
  saveExecutiveDayNotes,
} from './api'

/**
 * Executive Goal Data Provider
 *
 * Goals live at goal/plugin level (API: loadExecutiveGoals, saveExecutiveGoal).
 * Day data = tasks for this day + notes.
 * - Tasks: .../executiveGoal/tasks/{taskId} (task.endDate = due day).
 * - Notes: .../executiveGoal/days/{date}.
 */
export class ExecutiveGoalDataProvider implements PluginDataProvider<ExecutiveGoalDayData> {
  async loadDayData(
    context: PluginContext,
    date: string
  ): Promise<ExecutiveGoalDayData | null> {
    try {
      const [tasks, dayDoc] = await Promise.all([
        loadExecutiveTasks(context.userId, context.goalId, date, date),
        loadExecutiveDay(context.userId, context.goalId, date),
      ])
      return {
        tasks,
        notes: dayDoc?.notes ?? '',
      }
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
      const [tasks, daysMap] = await Promise.all([
        loadExecutiveTasks(
          context.userId,
          context.goalId,
          startDate,
          endDate
        ),
        loadExecutiveDaysRange(
          context.userId,
          context.goalId,
          startDate,
          endDate
        ),
      ])
      const dates = generateDateRange(startDate, endDate)
      const result: Record<string, ExecutiveGoalDayData> = {}

      for (const date of dates) {
        const tasksForDay = tasks.filter((t) => t.endDate === date)
        const dayDoc = daysMap[date]
        result[date] = {
          tasks: tasksForDay,
          notes: dayDoc?.notes ?? '',
        }
      }

      return result
    } catch (error) {
      context.logger.error('Failed to load executive goal date range', error)
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

      if (dayData.tasks?.length) {
        for (const task of dayData.tasks) {
          if (task?.id) {
            await saveExecutiveTask(
              context.userId,
              context.goalId,
              task as ExecutiveGoalTask
            )
          }
        }
      }

      if (dayData.notes !== undefined) {
        await saveExecutiveDayNotes(
          context.userId,
          context.goalId,
          date,
          dayData.notes
        )
      }

      return true
    } catch (error) {
      context.logger.error('Failed to save executive goal day data', error)
      return false
    }
  }
}
