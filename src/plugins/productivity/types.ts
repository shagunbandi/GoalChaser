/**
 * Productivity Plugin Types
 */

import type { PluginDayData, PluginConfigData } from '@/sdk'

export type DayStatus = number | null

export interface AreaEntry {
  area: string
  topics: string[]
}

export interface AreaConfig {
  id: string
  name: string
  topics: string[]
  hasTopics?: boolean
  color?: string
}

export interface ProductivityDayData extends PluginDayData {
  status: DayStatus
  areas?: AreaEntry[]
  notes?: string  // Productivity-specific notes, separate from calendar notes
}

export interface ProductivityConfig extends PluginConfigData {
  areas: AreaConfig[]
}
