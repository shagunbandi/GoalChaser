// Executive Goal Plugin Types
import type { PluginDayData, ActivityItem } from '@/sdk'

export interface ExecutiveGoalPlan extends ActivityItem {
  title: string
  startDate: string
  endDate: string
  description?: string
  note?: string
  color?: string
  parentExecutiveGoalId?: string
  // File attachments
  files?: ExecutiveGoalFile[]
  // Task-specific fields
  completed?: boolean
  completionNote?: string
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
  description?: string
  note?: string
  color?: string
  parentExecutiveGoalId?: string
}

export interface ExecutiveGoalDayData extends PluginDayData {
  executiveGoalPlans?: ExecutiveGoalPlan[]
  notes?: string
}
