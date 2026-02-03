/**
 * Productivity Plugin Types
 */

import type { PluginDayData, PluginConfigData } from '@goal-chaser/sdk'

export type DayStatus = number | null

export type StreakType = 'daily' | 'weekly' | 'monthly'

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
  // Goal configuration
  streakType?: StreakType  // Default: 'daily'
  targetFrequency?: number // For weekly/monthly: how many times (e.g., 2 = 2x per week)
  trackStreaks?: boolean   // Default: true - whether to track streaks for this area
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
