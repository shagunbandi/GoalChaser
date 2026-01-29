// Executive Goal Plugin Types
import type { PluginDayData, ActivityItem } from '@/sdk'

/** One 20-day-period summary for progressSoFar */
export interface ProgressSoFarEntry {
  periodLabel: string
  periodStart: string
  periodEnd: string
  summary: string
}

export interface ExecutiveGoalPlan extends ActivityItem {
  title: string
  startDate: string
  endDate: string
  plan?: string
  note?: string
  color?: string
  parentExecutiveGoalId?: string
  // File attachments
  files?: ExecutiveGoalFile[]
  // Task-specific fields
  completed?: boolean
  completionNote?: string
  // Rolling 20-day-period summaries (only on parent goals)
  progressSoFar?: ProgressSoFarEntry[]
  // Cumulative AI token usage and estimated cost (only on parent goals)
  aiUsage?: {
    totalPromptTokens: number
    totalCompletionTokens: number
    totalTokens: number
    estimatedCostUsd: number
    lastUpdated: string
  }
}

export interface ExecutiveGoalFile {
  id: string
  name: string
  size: number
  type: string
  url: string
  uploadedAt: string
  storagePath: string
}

export interface ExecutiveGoalPlanInput {
  title: string
  startDate: string
  endDate: string
  plan?: string
  note?: string
  color?: string
  parentExecutiveGoalId?: string
}

export interface ExecutiveGoalDayData extends PluginDayData {
  executiveGoalPlans?: ExecutiveGoalPlan[]
  notes?: string
}
