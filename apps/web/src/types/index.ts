// ============ Core Day & Status Types ============

// Productivity score: 1-10 scale (1-3: Low, 4-6: OK, 7-10: High)
// This is a base primitive type that core understands for calendar visualization
export type DayStatus = number | null

// ============ Core Day Info Types ============

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
}

// ============ Year View Config Types ============

export type {
  ButtonConfig,
  DayIndicator,
  DayConfig,
  MonthFooterItem,
  ModalSection,
  LegendItem,
  HeaderConfig,
  MonthConfig,
  YearViewConfig,
} from './year-view-config'

// ============ Add-on Config Types ============

export type {
  AddonId,
  AddonCategory,
  AddonSubItem,
  GoalAddonsConfig,
  AddonDefinition,
} from './addon-config'
