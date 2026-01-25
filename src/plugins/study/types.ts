/**
 * Study Plugin Types
 */

import type { PluginDayData, PluginConfigData } from '@/sdk'

export type StreakType = 'daily' | 'weekly' | 'monthly'

export interface SubjectEntry {
  subject: string
  topics: string[]
  hours: number
}

export interface SubjectConfig {
  id: string
  name: string
  topics: string[]
  hasTopics?: boolean // If false, subject doesn't need topics (default: true)
  color?: string
  // Goal configuration
  streakType?: StreakType  // Default: 'daily'
  targetFrequency?: number // For weekly/monthly: how many times (e.g., 2 = 2x per week)
  trackStreaks?: boolean   // Default: false - whether to track streaks for this subject
}

export interface StudyDayData extends PluginDayData {
  subjects: SubjectEntry[]
  directHours: number
  notes?: string
}

export interface StudyConfig extends PluginConfigData {
  subjects: SubjectConfig[]
}
