/**
 * Hours Plugin Types
 */

import type { PluginDayData, PluginConfigData } from '@/sdk'

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
}

export interface HoursDayData extends PluginDayData {
  subjects: SubjectEntry[]
  directHours: number
}

export interface HoursConfig extends PluginConfigData {
  subjects: SubjectConfig[]
}
