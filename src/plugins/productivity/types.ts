/**
 * Productivity Plugin Types
 */

import type { PluginDayData, PluginConfigData } from '@/sdk'

export type DayStatus = number | null

export interface AreaEntry {
  area: string
  topics: string[]
  hours?: number  // Time spent on this area (optional)
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
  directHours?: number  // Direct hours worked (not tied to specific areas)
  notes?: string  // Productivity-specific notes, separate from calendar notes
}

export interface ProductivityConfig extends PluginConfigData {
  areas: AreaConfig[]
}
