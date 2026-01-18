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

// Transaction category
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
  { id: 'investment-return', name: 'Investment Return', type: 'income', icon: '📈', color: '#30D158' },
  { id: 'refund', name: 'Refund', type: 'income', icon: '💵', color: '#34C759' },
  { id: 'gift', name: 'Gift', type: 'income', icon: '🎁', color: '#64D2FF' },
  { id: 'other-income', name: 'Other', type: 'income', icon: '✨', color: '#5AC8FA' },
]

// Investment Group (managed in settings, like categories)
export interface InvestmentGroup {
  id: string
  name: string           // e.g., "HDFC Mid Cap", "Emergency Fund"
  icon?: string
  color?: string
}

// Default investment groups
export const DEFAULT_INVESTMENT_GROUPS: InvestmentGroup[] = [
  { id: 'mutual-fund', name: 'Mutual Fund', icon: '📊', color: '#5856D6' },
  { id: 'stocks', name: 'Stocks', icon: '📉', color: '#34C759' },
  { id: 'fd', name: 'Fixed Deposit', icon: '🏦', color: '#FF9500' },
  { id: 'gold', name: 'Gold', icon: '🥇', color: '#FFD700' },
  { id: 'ppf', name: 'PPF/Retirement', icon: '🏛️', color: '#30D158' },
  { id: 'crypto', name: 'Crypto', icon: '₿', color: '#F7931A' },
  { id: 'bonds', name: 'Bonds', icon: '📜', color: '#007AFF' },
  { id: 'real-estate', name: 'Real Estate', icon: '🏠', color: '#8E8E93' },
]

export interface Expense extends ActivityItem {
  categoryId: string
  categoryName: string
  amount: number
  currency?: Currency        // Currency symbol (defaults to config default)
  description: string
  date: string
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
  isRecurring?: boolean
  frequency?: 'daily' | 'weekly' | 'monthly'
  endDate?: string
  parentIncomeId?: string
  occurrenceIndex?: number
  // Series management (for "edit this and upcoming" support)
  seriesId?: string         // All occurrences in same series share this
  isSeriesParent?: boolean  // True for the first/defining occurrence in a series
}

// Day-level Investment (similar to Expense, shown as outflow)
export interface Investment extends ActivityItem {
  investmentGroupId: string
  investmentGroupName: string
  amount: number
  currency?: Currency
  description?: string
  date: string
  // Recurring support (same as Expense)
  isRecurring?: boolean
  frequency?: 'daily' | 'weekly' | 'monthly'
  endDate?: string
  seriesId?: string
  isSeriesParent?: boolean
  occurrenceIndex?: number
}

export interface FinanceTransactionData extends PluginDayData {
  expenses: Expense[]
  income: Income[]
  investments: Investment[]  // Day-level investments
  notes?: string
}

// Transaction settings for user preferences
export interface TransactionSettings {
  defaultCurrency: Currency
  expenseCategories: TransactionCategory[]
  incomeCategories: TransactionCategory[]
  investmentGroups: InvestmentGroup[]  // User-defined investment groups
}

export interface FinanceConfig extends PluginConfigData {
  transactionSettings?: TransactionSettings
}
