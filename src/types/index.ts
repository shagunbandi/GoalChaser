// ============ Day & Status Types ============

// Productivity score: 1-10 scale (1-3: Low, 4-6: OK, 7-10: High)
export type DayStatus = number | null

// Subject entry with multiple topics and hours
export interface SubjectEntry {
  subject: string
  topics: string[]
  hours: number
}

export type RepeatType = 'none' | 'daily' | 'weekly' | 'custom'

export interface RepeatRule {
  type: RepeatType
  days?: string[] // Weekday codes e.g. ['mon','wed','fri']
}

// Renamed from PlannedItem to AgendaItem to avoid confusion with TravelPlan
export interface AgendaItem {
  id: string
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

// For backward compatibility - will be removed in future
/** @deprecated Use AgendaItem instead */
export type PlannedItem = AgendaItem

// ============ Travel Types ============

export interface TravelPlan {
  id: string
  title: string
  startDate: string // ISO date
  endDate: string // ISO date
  note?: string
  color?: string
  destination?: string
}

export interface DayDetails {
  status: DayStatus
  // Legacy single subject/topic (for backward compatibility)
  subject: string
  topic: string
  // New multi-subject support
  subjects?: SubjectEntry[]
  note: string
  // Direct hours input (used when not tracking via subjects)
  directHours?: number
  // Agenda items for the day (renamed from plannedItems)
  agendaItems?: AgendaItem[]
  // For backward compatibility - will be removed in future
  /** @deprecated Use agendaItems instead */
  plannedItems?: AgendaItem[]
  // Travel plans (multiple allowed)
  travelPlans?: TravelPlan[]
}

export interface DayInfo {
  date: Date
  iso: string
  dayOfMonth: number
  weekdayIndex: number // 0 = Monday, 6 = Sunday
}

export interface MonthInfo {
  year: number
  month: number // 1–12
  days: DayInfo[]
}

// ============ Time Range Types ============

export type TimeRangeType = 'week' | 'month' | 'year' | 'custom'

export interface TimeRange {
  type: TimeRangeType
  startDate: string
  endDate: string
  label: string
}

// ============ Subject & Topic Types ============

export interface SubjectConfig {
  id: string
  name: string
  topics: string[]
  hasTopics?: boolean // If false, subject doesn't need topics (default: true)
  color?: string
}

// ============ Success Criterion Types ============

// Extensible success criterion type - add new types here as needed
export type SuccessCriterionType = 'productivity' | 'hours'

// Base interface for all success criteria
export interface BaseSuccessCriterion {
  type: SuccessCriterionType
}

// Productivity-based criterion (1-10 scale)
export interface ProductivityCriterion extends BaseSuccessCriterion {
  type: 'productivity'
}

// Hours-based criterion (track hours spent per day)
export interface HoursCriterion extends BaseSuccessCriterion {
  type: 'hours'
  maxHours: 8 | 14 | 18 // Maximum hours per day
}

// Union type for all success criteria
export type SuccessCriterion = ProductivityCriterion | HoursCriterion

// ============ Goal Types ============

export interface Goal {
  id: string
  name: string
  description?: string
  createdAt: string
  color?: string
  // Optional date range for the goal
  startDate?: string // ISO date string
  endDate?: string // ISO date string
  // Success criterion - defaults to productivity if not set
  successCriterion?: SuccessCriterion
}

