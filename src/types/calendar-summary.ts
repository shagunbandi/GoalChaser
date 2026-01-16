import type { AddonId, AgendaItem, AreaEntry, SubjectEntry, Expense, Income, TravelPlan } from './index'

// Base interface for all addon summary data
export interface AddonSummaryData {
  addon: AddonId
  hasData: boolean
}

// Productivity addon summary data
export interface ProductivitySummaryData extends AddonSummaryData {
  addon: 'productivity'
  score: number | null
  areas?: AreaEntry[]
}

// Hours addon summary data
export interface HoursSummaryData extends AddonSummaryData {
  addon: 'hours'
  totalHours: number
  subjects: SubjectEntry[]
  directHours?: number
}

// Finance addon summary data
export interface FinanceSummaryData extends AddonSummaryData {
  addon: 'finance'
  expenses: Expense[]
  income: Income[]
  totalExpenses: number
  totalIncome: number
  netAmount: number
}

// Travel addon summary data
export interface TravelSummaryData extends AddonSummaryData {
  addon: 'travel'
  travelPlans: TravelPlan[]
}

// Agenda addon summary data
export interface AgendaSummaryData extends AddonSummaryData {
  addon: 'calendar'
  agendaItems: AgendaItem[]
  completedCount: number
  totalCount: number
}

// Union type for all addon summary data
export type AnySummaryData =
  | ProductivitySummaryData
  | HoursSummaryData
  | FinanceSummaryData
  | TravelSummaryData
  | AgendaSummaryData
