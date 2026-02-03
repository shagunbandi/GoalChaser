// Recurring Transaction Utilities
import type { Expense, Income, Investment, FinanceTransactionData } from '../types'
import { toISODateString } from '@goal-chaser/sdk'

export type Transaction = Expense | Income | Investment
export type TransactionType = 'expense' | 'income' | 'investment'

/**
 * Generate a unique series ID for a recurring transaction
 */
export function generateSeriesId(): string {
  return `series_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Generate a unique transaction ID
 */
export function generateTransactionId(type: TransactionType): string {
  return `${type}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Calculate the next occurrence date based on frequency
 */
export function getNextOccurrenceDate(
  currentDate: string,
  frequency: 'daily' | 'weekly' | 'monthly'
): string {
  const date = new Date(`${currentDate}T00:00:00`)

  switch (frequency) {
    case 'daily':
      date.setDate(date.getDate() + 1)
      break
    case 'weekly':
      date.setDate(date.getDate() + 7)
      break
    case 'monthly':
      date.setMonth(date.getMonth() + 1)
      break
  }

  return toISODateString(date)
}

/**
 * Generate all occurrence dates for a recurring transaction
 */
export function generateOccurrenceDates(
  startDate: string,
  endDate: string,
  frequency: 'daily' | 'weekly' | 'monthly'
): string[] {
  const dates: string[] = []
  let currentDate = startDate
  const endTime = new Date(`${endDate}T00:00:00`).getTime()

  while (new Date(`${currentDate}T00:00:00`).getTime() <= endTime) {
    dates.push(currentDate)
    currentDate = getNextOccurrenceDate(currentDate, frequency)
  }

  return dates
}

/**
 * Create occurrences for a recurring transaction
 */
export function createRecurringOccurrences<T extends Transaction>(
  baseTransaction: Omit<T, 'id' | 'seriesId' | 'isSeriesParent' | 'occurrenceIndex'>,
  startDate: string,
  endDate: string,
  frequency: 'daily' | 'weekly' | 'monthly',
  type: TransactionType
): T[] {
  const seriesId = generateSeriesId()
  const dates = generateOccurrenceDates(startDate, endDate, frequency)

  return dates.map((date, index) => ({
    ...baseTransaction,
    id: generateTransactionId(type),
    date,
    seriesId,
    isSeriesParent: index === 0,
    occurrenceIndex: index,
    isRecurring: true,
    frequency,
    endDate,
  } as T))
}

/**
 * Group transactions by date for batch updates
 */
export function groupTransactionsByDate<T extends Transaction>(
  transactions: T[]
): Record<string, T[]> {
  return transactions.reduce((acc, transaction) => {
    const date = transaction.date
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(transaction)
    return acc
  }, {} as Record<string, T[]>)
}

/**
 * Get transactions array from day data based on type
 */
function getTransactionsFromDayData(
  dayData: FinanceTransactionData,
  type: TransactionType
): Transaction[] {
  switch (type) {
    case 'expense':
      return dayData.expenses || []
    case 'income':
      return dayData.income || []
    case 'investment':
      return dayData.investments || []
  }
}

/**
 * Get the key for transactions array in day data
 */
function getTransactionKey(type: TransactionType): 'expenses' | 'income' | 'investments' {
  switch (type) {
    case 'expense':
      return 'expenses'
    case 'income':
      return 'income'
    case 'investment':
      return 'investments'
  }
}

/**
 * Get all occurrences of a series from day data
 */
export function getSeriesOccurrences<T extends Transaction>(
  seriesId: string,
  allDayData: Record<string, FinanceTransactionData>,
  type: TransactionType
): T[] {
  const occurrences: T[] = []

  Object.values(allDayData).forEach((dayData) => {
    const transactions = getTransactionsFromDayData(dayData, type)
    const seriesTransactions = transactions.filter((t) => t.seriesId === seriesId) as T[]
    occurrences.push(...seriesTransactions)
  })

  return occurrences.sort((a, b) => a.date.localeCompare(b.date))
}

/**
 * Get future occurrences of a series (including the current one)
 */
export function getFutureOccurrences<T extends Transaction>(
  seriesId: string,
  fromDate: string,
  allDayData: Record<string, FinanceTransactionData>,
  type: TransactionType
): T[] {
  const allOccurrences = getSeriesOccurrences<T>(seriesId, allDayData, type)
  return allOccurrences.filter((t) => t.date >= fromDate)
}

/**
 * Update a single occurrence (detaches it from series)
 * Returns the updated transaction
 */
export function updateSingleOccurrence<T extends Transaction>(
  transaction: T,
  updates: Partial<T>
): T {
  return {
    ...transaction,
    ...updates,
    // Remove series association when editing just this one
    seriesId: undefined,
    isSeriesParent: undefined,
    isRecurring: false,
  } as T
}

/**
 * Update this and all future occurrences
 * Creates a new series starting from this occurrence
 */
export function updateThisAndUpcoming<T extends Transaction>(
  transaction: T,
  updates: Partial<T>,
  allDayData: Record<string, FinanceTransactionData>,
  type: TransactionType
): { updatedTransactions: T[]; datesToUpdate: string[] } {
  if (!transaction.seriesId) {
    // Not part of a series, just update normally
    return {
      updatedTransactions: [{ ...transaction, ...updates } as T],
      datesToUpdate: [transaction.date],
    }
  }

  const futureOccurrences = getFutureOccurrences<T>(
    transaction.seriesId,
    transaction.date,
    allDayData,
    type
  )

  // Create a new series for the updated transactions
  const newSeriesId = generateSeriesId()

  const updatedTransactions = futureOccurrences.map((t, index) => ({
    ...t,
    ...updates,
    date: t.date, // Preserve original dates
    id: t.id, // Preserve original IDs
    seriesId: newSeriesId,
    isSeriesParent: index === 0,
    occurrenceIndex: index,
  } as T))

  const datesToUpdate = [...new Set(updatedTransactions.map((t) => t.date))]

  return { updatedTransactions, datesToUpdate }
}

/**
 * Delete a single occurrence
 */
export function deleteSingleOccurrence<T extends Transaction>(
  transaction: T,
  dayData: FinanceTransactionData,
  type: TransactionType
): FinanceTransactionData {
  const key = getTransactionKey(type)
  const transactions = getTransactionsFromDayData(dayData, type)
  const filtered = transactions.filter((t) => t.id !== transaction.id)

  return {
    ...dayData,
    [key]: filtered,
  }
}

/**
 * Delete this and all future occurrences
 * Returns dates that need to be updated and the transaction IDs to remove
 */
export function deleteThisAndUpcoming<T extends Transaction>(
  transaction: T,
  allDayData: Record<string, FinanceTransactionData>,
  type: TransactionType
): { transactionsToDelete: T[]; datesToUpdate: string[] } {
  if (!transaction.seriesId) {
    // Not part of a series, just delete this one
    return {
      transactionsToDelete: [transaction],
      datesToUpdate: [transaction.date],
    }
  }

  const futureOccurrences = getFutureOccurrences<T>(
    transaction.seriesId,
    transaction.date,
    allDayData,
    type
  )

  const datesToUpdate = [...new Set(futureOccurrences.map((t) => t.date))]

  return {
    transactionsToDelete: futureOccurrences,
    datesToUpdate,
  }
}

/**
 * Check if a transaction is part of a recurring series
 */
export function isRecurringTransaction(transaction: Transaction): boolean {
  return Boolean(transaction.seriesId && transaction.isRecurring)
}

/**
 * Calculate monthly totals for expenses, income, and investments
 */
export function calculateMonthlyTotals(
  dayData: Record<string, FinanceTransactionData>,
  year: number,
  month: number
): { totalExpenses: number; totalIncome: number; totalInvestments: number; net: number } {
  const monthStr = String(month).padStart(2, '0')
  const prefix = `${year}-${monthStr}`

  let totalExpenses = 0
  let totalIncome = 0
  let totalInvestments = 0

  Object.entries(dayData).forEach(([date, data]) => {
    if (date.startsWith(prefix)) {
      totalExpenses += data.expenses?.reduce((sum, e) => sum + e.amount, 0) || 0
      totalIncome += data.income?.reduce((sum, i) => sum + i.amount, 0) || 0
      totalInvestments += data.investments?.reduce((sum, inv) => sum + inv.amount, 0) || 0
    }
  })

  return {
    totalExpenses,
    totalIncome,
    totalInvestments,
    net: totalIncome - totalExpenses - totalInvestments,
  }
}

/**
 * Format currency amount
 */
export function formatCurrency(amount: number, currency: string = '₹'): string {
  return `${currency}${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
}

/**
 * Calculate running totals from start of month till a specific date (MTD - Month To Date)
 */
export function calculateRunningTotals(
  dayData: Record<string, FinanceTransactionData>,
  selectedDate: string
): { 
  totalExpenses: number
  totalIncome: number
  totalInvestments: number
  net: number
  transactionCount: number 
} {
  // Extract year and month from the selected date
  const [year, month] = selectedDate.split('-')
  const prefix = `${year}-${month}`

  let totalExpenses = 0
  let totalIncome = 0
  let totalInvestments = 0
  let transactionCount = 0

  // Get all dates from start of month up to and including selected date
  Object.entries(dayData).forEach(([date, data]) => {
    if (date.startsWith(prefix) && date <= selectedDate) {
      const expenses = data.expenses?.reduce((sum, e) => sum + e.amount, 0) || 0
      const income = data.income?.reduce((sum, i) => sum + i.amount, 0) || 0
      const investments = data.investments?.reduce((sum, inv) => sum + inv.amount, 0) || 0
      totalExpenses += expenses
      totalIncome += income
      totalInvestments += investments
      transactionCount += 
        (data.expenses?.length || 0) + 
        (data.income?.length || 0) + 
        (data.investments?.length || 0)
    }
  })

  return {
    totalExpenses,
    totalIncome,
    totalInvestments,
    net: totalIncome - totalExpenses - totalInvestments,
    transactionCount,
  }
}

/**
 * Calculate daily totals for a specific date
 */
export function calculateDailyTotals(
  data: FinanceTransactionData | null
): { 
  totalExpenses: number
  totalIncome: number
  totalInvestments: number
  net: number
  transactionCount: number 
} {
  if (!data) {
    return { totalExpenses: 0, totalIncome: 0, totalInvestments: 0, net: 0, transactionCount: 0 }
  }

  const totalExpenses = data.expenses?.reduce((sum, e) => sum + e.amount, 0) || 0
  const totalIncome = data.income?.reduce((sum, i) => sum + i.amount, 0) || 0
  const totalInvestments = data.investments?.reduce((sum, inv) => sum + inv.amount, 0) || 0
  const transactionCount = 
    (data.expenses?.length || 0) + 
    (data.income?.length || 0) + 
    (data.investments?.length || 0)

  return {
    totalExpenses,
    totalIncome,
    totalInvestments,
    net: totalIncome - totalExpenses - totalInvestments,
    transactionCount,
  }
}
