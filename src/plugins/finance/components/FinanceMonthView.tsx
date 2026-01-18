'use client'

import { useMemo } from 'react'
import { PluginMonthView } from '@/sdk'
import type { DayCustomization } from '@/sdk'
import type {
  FinanceTransactionData,
  Expense,
  Income,
  BudgetCategory,
  BudgetPlan,
  TransactionCategory,
  TransactionSettings,
} from '../types'
import { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from '../types'
import type { FinanceDetailContext, TransactionFormData } from '../detail-provider'
import type { EditAction, EditedTransactionData } from './EditTransactionModal'
import { calculateMonthlyTotals, formatCurrency } from '../utils/recurring-utils'

interface FinanceMonthViewProps {
  plugin: any
  month: number
  year: number
  goalId: string
  todayISO: string
  dayData: Record<string, FinanceTransactionData>
  initialSelectedDate: string | null
  onUpdateDay: (
    iso: string,
    updates: Partial<FinanceTransactionData>
  ) => Promise<void>
  onBackToYear: () => void
  // Category and budget props
  categories: BudgetCategory[]
  budgets: BudgetPlan[]
  activeBudgetId?: string
  // Transaction settings
  transactionSettings?: TransactionSettings
  // Transaction handlers
  onAddExpense: (date: string, expense: TransactionFormData) => Promise<void>
  onAddIncome: (date: string, income: TransactionFormData) => Promise<void>
  onEditTransaction: (
    date: string,
    transaction: Expense | Income,
    type: 'expense' | 'income',
    action: EditAction,
    editedData?: EditedTransactionData
  ) => Promise<void>
  onDeleteTransaction: (
    date: string,
    transaction: Expense | Income,
    type: 'expense' | 'income',
    action: EditAction
  ) => Promise<void>
  onUpdateSettings?: (settings: TransactionSettings) => Promise<void>
}

export function FinanceMonthView({
  plugin,
  month,
  year,
  goalId,
  todayISO,
  dayData,
  initialSelectedDate,
  onUpdateDay,
  onBackToYear,
  categories,
  budgets,
  activeBudgetId,
  transactionSettings,
  onAddExpense,
  onAddIncome,
  onEditTransaction,
  onDeleteTransaction,
  onUpdateSettings,
}: FinanceMonthViewProps) {
  // Get settings with defaults
  const settings = transactionSettings || {
    defaultCurrency: '₹' as const,
    expenseCategories: DEFAULT_EXPENSE_CATEGORIES,
    incomeCategories: DEFAULT_INCOME_CATEGORIES,
  }

  // Calculate monthly totals
  const monthlyTotals = useMemo(() => {
    return calculateMonthlyTotals(dayData, year, month)
  }, [dayData, year, month])

  // Build day customizations based on financial activity
  const buildDayCustomization = (
    date: string,
    data: FinanceTransactionData | null
  ): DayCustomization | null => {
    if (!data) return null

    const hasExpenses = data.expenses && data.expenses.length > 0
    const hasIncome = data.income && data.income.length > 0

    if (!hasExpenses && !hasIncome) return null

    // Calculate totals
    const totalExpenses =
      data.expenses?.reduce((sum: number, e) => sum + (e.amount || 0), 0) || 0
    const totalIncome =
      data.income?.reduce((sum: number, i) => sum + (i.amount || 0), 0) || 0

    const netAmount = totalIncome - totalExpenses

    // Color based on net: positive (green), negative (red), neutral (orange)
    const getFinanceColor = () => {
      if (netAmount > 0) return { bg: 'bg-green-500/20', color: '#00FF00' }
      if (netAmount < 0) return { bg: 'bg-red-500/20', color: '#FF6B6B' }
      return { bg: 'bg-orange-500/20', color: '#FFA500' }
    }

    const { bg } = getFinanceColor()
    const currency = settings.defaultCurrency

    const indicators = []
    if (hasExpenses) {
      indicators.push({
        id: 'expense',
        label: `${currency}${totalExpenses.toFixed(0)} expense`,
        color: '#FF6B6B',
      })
    }
    if (hasIncome) {
      indicators.push({
        id: 'income',
        label: `${currency}${totalIncome.toFixed(0)} income`,
        color: '#00FF00',
      })
    }

    return {
      backgroundColor: bg,
      content: (
        <div className="text-[10px] text-white/60 mt-1">
          {netAmount >= 0 ? '+' : ''}{currency}{netAmount.toFixed(0)}
        </div>
      ),
      indicators,
    }
  }

  // Build detail context with all necessary handlers
  const detailContext: FinanceDetailContext = useMemo(
    () => ({
      categories,
      expenseCategories: settings.expenseCategories,
      incomeCategories: settings.incomeCategories,
      budgets,
      activeBudgetId,
      transactionSettings: settings,
      allDayData: dayData,
      onAddExpense: async (expense) => {
        const dateFromUrl = new URLSearchParams(window.location.search).get('date')
        const date = dateFromUrl || todayISO
        await onAddExpense(date, expense)
      },
      onAddIncome: async (income) => {
        const dateFromUrl = new URLSearchParams(window.location.search).get('date')
        const date = dateFromUrl || todayISO
        await onAddIncome(date, income)
      },
      onEditTransaction: async (transaction, type, action, editedData) => {
        const dateFromUrl = new URLSearchParams(window.location.search).get('date')
        const date = dateFromUrl || transaction.date
        await onEditTransaction(date, transaction, type, action, editedData)
      },
      onDeleteTransaction: async (transaction, type, action) => {
        const dateFromUrl = new URLSearchParams(window.location.search).get('date')
        const date = dateFromUrl || transaction.date
        await onDeleteTransaction(date, transaction, type, action)
      },
      onUpdateSettings,
    }),
    [
      categories,
      settings,
      budgets,
      activeBudgetId,
      dayData,
      todayISO,
      onAddExpense,
      onAddIncome,
      onEditTransaction,
      onDeleteTransaction,
      onUpdateSettings,
    ]
  )

  // Monthly summary chips for footer
  const monthlySummaryChips = (
    <div className="flex flex-wrap items-center gap-3">
      {/* Income Chip */}
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
        <span className="w-2 h-2 rounded-full bg-emerald-400" />
        <span className="text-xs text-white/60">Monthly Income</span>
        <span className="text-sm font-semibold text-emerald-400">
          +{formatCurrency(monthlyTotals.totalIncome, settings.defaultCurrency)}
        </span>
      </div>

      {/* Expenses Chip */}
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/30">
        <span className="w-2 h-2 rounded-full bg-red-400" />
        <span className="text-xs text-white/60">Monthly Expenses</span>
        <span className="text-sm font-semibold text-red-400">
          -{formatCurrency(monthlyTotals.totalExpenses, settings.defaultCurrency)}
        </span>
      </div>

      {/* Net Flow Chip */}
      <div
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${
          monthlyTotals.net >= 0
            ? 'bg-emerald-500/10 border-emerald-500/30'
            : 'bg-red-500/10 border-red-500/30'
        }`}
      >
        <span className="text-base">💰</span>
        <span className="text-xs text-white/60">Net Flow</span>
        <span
          className={`text-sm font-semibold ${
            monthlyTotals.net >= 0 ? 'text-emerald-400' : 'text-red-400'
          }`}
        >
          {monthlyTotals.net >= 0 ? '+' : ''}
          {formatCurrency(monthlyTotals.net, settings.defaultCurrency)}
        </span>
      </div>
    </div>
  )

  return (
    <PluginMonthView
      plugin={plugin}
      year={year}
      month={month}
      goalId={goalId}
      todayISO={todayISO}
      dayData={dayData}
      initialSelectedDate={initialSelectedDate}
      onUpdateDay={onUpdateDay}
      onBackToYear={onBackToYear}
      buildDayCustomization={buildDayCustomization}
      detailContext={detailContext}
      footerContent={monthlySummaryChips}
    />
  )
}
