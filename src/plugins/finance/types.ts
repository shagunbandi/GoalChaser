// Finance Plugin Types
import type { PluginDayData, PluginConfigData, ActivityItem } from '@/sdk'

export interface BudgetCategory {
  id: string
  name: string
  allocatedAmount: number
  isFixed: boolean
  color?: string
}

export interface BudgetPlan extends ActivityItem {
  name: string
  income: number
  categories: BudgetCategory[]
  startDate: string
  endDate: string
  note?: string
  isRecurring?: boolean
  frequency?: 'monthly'
  startDay?: number
  parentBudgetId?: string
  periodIndex?: number
}

export interface Expense extends ActivityItem {
  categoryId: string
  categoryName: string
  amount: number
  description: string
  date: string
  budgetId?: string
  isRecurring?: boolean
  frequency?: 'daily' | 'weekly' | 'monthly'
  endDate?: string
  parentExpenseId?: string
  occurrenceIndex?: number
}

export interface Income extends ActivityItem {
  categoryId: string
  categoryName: string
  amount: number
  description: string
  date: string
  budgetId?: string
  isRecurring?: boolean
  frequency?: 'daily' | 'weekly' | 'monthly'
  endDate?: string
  parentIncomeId?: string
  occurrenceIndex?: number
}

export interface FinanceTransactionData extends PluginDayData {
  expenses: Expense[]
  income: Income[]
}

export type SIPFrequency = 'daily' | 'weekly' | 'monthly'

export interface SIPPlan extends ActivityItem {
  name: string
  amount: number
  frequency: SIPFrequency
  startDate: string
  endDate: string
  expectedReturn?: number
  note?: string
  color?: string
  completedDates?: string[]
}

export interface FinanceConfig extends PluginConfigData {
  budgets: BudgetPlan[]
  sips: SIPPlan[]
}
