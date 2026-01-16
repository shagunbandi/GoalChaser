/**
 * Agenda Plugin Types
 */

import type { PluginDayData, ActivityItem } from '@/sdk'
import type { RepeatType as CoreRepeatType } from '@/utils'

// Re-export for convenience
export type RepeatType = CoreRepeatType

export interface RepeatRule {
  type: RepeatType
  days?: string[] // Weekday codes e.g. ['mon','wed','fri']
}

export interface AgendaItem extends ActivityItem {
  title: string
  startTime?: string
  endTime?: string
  note?: string
  recurrenceId?: string | null
  sequenceId?: string
  repeat?: RepeatRule | null
  subjects?: string[]
  completed?: boolean
  recurrenceStart?: string
  recurrenceEnd?: string
}

export interface AgendaDayData extends PluginDayData {
  agendaItems?: AgendaItem[]
}
