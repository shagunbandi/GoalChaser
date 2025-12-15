// ============ Day & Status Types ============

// Productivity score: 1-10 scale (1-3: Low, 4-6: OK, 7-10: High)
export type DayStatus = number | null

// Subject entry with multiple topics and hours
export interface SubjectEntry {
  subject: string
  topics: string[]
  hours: number
}

export interface DayDetails {
  status: DayStatus
  // Legacy single subject/topic (for backward compatibility)
  subject: string
  topic: string
  // New multi-subject support
  subjects?: SubjectEntry[]
  note: string
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

// ============ Goal Types ============

export interface Goal {
  id: string
  name: string
  description?: string
  createdAt: string
  color?: string
}

