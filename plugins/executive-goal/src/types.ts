// Executive Goal Plugin Types
import type { PluginDayData, ActivityItem } from '@goal-chaser/sdk'

/** One 20-day-period summary for progressSoFar (goal-level only) */
export interface ProgressSoFarEntry {
  periodLabel: string
  periodStart: string
  periodEnd: string
  summary: string
}

/** Executive goal: goal/plugin-level entity with date range, plan, progress. */
export interface ExecutiveGoal extends ActivityItem {
  title: string
  startDate: string
  endDate: string
  plan?: string
  note?: string
  color?: string
  files?: ExecutiveGoalFile[]
  progressSoFar?: ProgressSoFarEntry[]
  aiUsage?: {
    totalPromptTokens: number
    totalCompletionTokens: number
    totalTokens: number
    estimatedCostUsd: number
    lastUpdated: string
  }
}

/** Task: day-level entity under a parent executive goal. */
export interface ExecutiveGoalTask extends ActivityItem {
  title: string
  parentExecutiveGoalId: string
  /** Due date (ISO date string); task appears on this day. */
  endDate: string
  completed?: boolean
  completionNote?: string
  /** Short “how to achieve” direction (from AI or manual). */
  howToAchieve?: string
  color?: string
}

export interface ExecutiveGoalFile {
  id: string
  name: string
  size: number
  type: string
  url?: string
  uploadedAt: string
  storagePath: string
}

export interface ExecutiveGoalInput {
  title: string
  startDate: string
  endDate: string
  plan?: string
  note?: string
  color?: string
}

export interface ExecutiveGoalTaskInput {
  title: string
  parentExecutiveGoalId: string
  endDate: string
  completed?: boolean
  completionNote?: string
  color?: string
}

/** Day-level plugin data: tasks for this day + optional notes. */
export interface ExecutiveGoalDayData extends PluginDayData {
  tasks?: ExecutiveGoalTask[]
  notes?: string
  /** AI extraction only: goals parsed from chat, not persisted in day data. */
  _extractedGoals?: ExecutiveGoal[]
}
