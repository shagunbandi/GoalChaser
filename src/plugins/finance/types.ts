// Finance Plugin Types
import type { PluginDayData, PluginConfigData, ActivityItem } from '@/sdk'

// Supported currencies
export type Currency = '₹' | '$' | '€' | '£' | '¥' | '₩' | 'A$' | 'C$'

export const CURRENCIES: { value: Currency; label: string; name: string }[] = [
  { value: '₹', label: '₹ INR', name: 'Indian Rupee' },
  { value: '$', label: '$ USD', name: 'US Dollar' },
  { value: '€', label: '€ EUR', name: 'Euro' },
  { value: '£', label: '£ GBP', name: 'British Pound' },
  { value: '¥', label: '¥ JPY', name: 'Japanese Yen' },
  { value: '₩', label: '₩ KRW', name: 'Korean Won' },
  { value: 'A$', label: 'A$ AUD', name: 'Australian Dollar' },
  { value: 'C$', label: 'C$ CAD', name: 'Canadian Dollar' },
]

// Transaction category (for standalone categories not tied to budgets)
export interface TransactionCategory {
  id: string
  name: string
  type: 'expense' | 'income' | 'both'
  icon?: string
  color?: string
}

// Default categories
export const DEFAULT_EXPENSE_CATEGORIES: TransactionCategory[] = [
  { id: 'food', name: 'Food & Dining', type: 'expense', icon: '🍔', color: '#FF6B6B' },
  { id: 'transport', name: 'Transport', type: 'expense', icon: '🚗', color: '#4ECDC4' },
  { id: 'shopping', name: 'Shopping', type: 'expense', icon: '🛍️', color: '#FFE66D' },
  { id: 'entertainment', name: 'Entertainment', type: 'expense', icon: '🎬', color: '#95E1D3' },
  { id: 'utilities', name: 'Utilities', type: 'expense', icon: '💡', color: '#F38181' },
  { id: 'health', name: 'Health', type: 'expense', icon: '🏥', color: '#AA96DA' },
  { id: 'other-expense', name: 'Other', type: 'expense', icon: '📦', color: '#FCBAD3' },
]

export const DEFAULT_INCOME_CATEGORIES: TransactionCategory[] = [
  { id: 'salary', name: 'Salary', type: 'income', icon: '💼', color: '#32D74B' },
  { id: 'freelance', name: 'Freelance', type: 'income', icon: '💻', color: '#00C7BE' },
  { id: 'investment', name: 'Investment', type: 'income', icon: '📈', color: '#30D158' },
  { id: 'refund', name: 'Refund', type: 'income', icon: '💵', color: '#34C759' },
  { id: 'gift', name: 'Gift', type: 'income', icon: '🎁', color: '#64D2FF' },
  { id: 'other-income', name: 'Other', type: 'income', icon: '✨', color: '#5AC8FA' },
]

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
  currency?: Currency        // Currency symbol (defaults to config default)
  description: string
  date: string
  budgetId?: string
  isRecurring?: boolean
  frequency?: 'daily' | 'weekly' | 'monthly'
  endDate?: string
  parentExpenseId?: string
  occurrenceIndex?: number
  // Series management (for "edit this and upcoming" support)
  seriesId?: string         // All occurrences in same series share this
  isSeriesParent?: boolean  // True for the first/defining occurrence in a series
}

export interface Income extends ActivityItem {
  categoryId: string
  categoryName: string
  amount: number
  currency?: Currency        // Currency symbol (defaults to config default)
  description: string
  date: string
  budgetId?: string
  isRecurring?: boolean
  frequency?: 'daily' | 'weekly' | 'monthly'
  endDate?: string
  parentIncomeId?: string
  occurrenceIndex?: number
  // Series management (for "edit this and upcoming" support)
  seriesId?: string         // All occurrences in same series share this
  isSeriesParent?: boolean  // True for the first/defining occurrence in a series
}

export interface FinanceTransactionData extends PluginDayData {
  expenses: Expense[]
  income: Income[]
  notes?: string
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

// Transaction settings for user preferences
export interface TransactionSettings {
  defaultCurrency: Currency
  expenseCategories: TransactionCategory[]
  incomeCategories: TransactionCategory[]
}

export interface FinanceConfig extends PluginConfigData {
  budgets: BudgetPlan[]
  sips: SIPPlan[]
  transactionSettings?: TransactionSettings
}
