// ============ Day & Status Types ============

// Productivity score: 1-10 scale (1-3: Low, 4-6: OK, 7-10: High)
export type DayStatus = number | null

// Subject entry with multiple topics and hours
export interface SubjectEntry {
  subject: string
  topics: string[]
  hours: number
}

export type RepeatType = 'none' | 'daily' | 'weekly'

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

// ============ SIP Types ============

export type SIPFrequency = 'daily' | 'weekly' | 'monthly'

export interface SIPPlan {
  id: string
  name: string
  amount: number
  frequency: SIPFrequency
  startDate: string // ISO date
  endDate: string // ISO date
  expectedReturn?: number // Annual return percentage
  note?: string
  color?: string
  // Track completed investments
  completedDates?: string[] // Array of ISO dates where investment was marked as done
}

// ============ Budget Types ============

export interface BudgetCategory {
  id: string
  name: string
  allocatedAmount: number // Budgeted/planned amount
  isFixed: boolean // Fixed expense (rent) vs variable budget (food, entertainment)
  color?: string
}

export interface BudgetPlan {
  id: string
  name: string
  income: number // Monthly income/salary
  categories: BudgetCategory[] // Budget categories with allocations
  startDate: string // ISO date
  endDate: string // ISO date
  note?: string
  
  // Recurring budget fields
  isRecurring?: boolean
  frequency?: 'monthly'
  startDay?: number // 1-31 for monthly
  parentBudgetId?: string // Links recurring instances
  periodIndex?: number // Which period (0 = first, 1 = second, etc.)
}

export interface Expense {
  id: string
  categoryId: string // Links to BudgetCategory
  categoryName: string // Stored for display even if category deleted
  amount: number
  description: string
  date: string // ISO date
  budgetId?: string // Optional link to budget plan
  
  // Recurring expense fields
  isRecurring?: boolean
  frequency?: 'daily' | 'weekly' | 'monthly'
  endDate?: string // ISO date - when to stop recurring
  parentExpenseId?: string // Links recurring instances
  occurrenceIndex?: number // Which occurrence (0 = first, 1 = second, etc.)
}

export interface Income {
  id: string
  categoryId: string // Links to BudgetCategory
  categoryName: string // Stored for display (e.g., "Freelance", "Bonus", "Refund")
  amount: number
  description: string
  date: string // ISO date
  budgetId?: string // Optional link to budget plan
  
  // Recurring income fields
  isRecurring?: boolean
  frequency?: 'daily' | 'weekly' | 'monthly'
  endDate?: string // ISO date - when to stop recurring
  parentIncomeId?: string // Links recurring instances
  occurrenceIndex?: number // Which occurrence (0 = first, 1 = second, etc.)
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
  // Daily expenses tracked against budgets
  expenses?: Expense[]
  // Daily income/credits (opposite of expenses)
  income?: Income[]
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

// ============ Activity Card Types ============

export type {
  ActivityCardType,
  ActivityItem,
  ActivityCardConfig,
} from './activity-card-config'
