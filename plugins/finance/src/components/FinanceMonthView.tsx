'use client'

import { useMemo } from 'react'
import { PluginMonthView } from '@goal-chaser/sdk'
import type { DayCustomization } from '@goal-chaser/sdk'
import type {
  FinanceTransactionData,
  Expense,
  Income,
  Investment,
  TransactionSettings,
} from '../types'
import { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES, DEFAULT_INVESTMENT_GROUPS } from '../types'
import type { FinanceDetailContext, TransactionFormData, InvestmentFormData } from '../detail-provider'
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
  // Transaction settings
  transactionSettings?: TransactionSettings
  // Transaction handlers
  onAddExpense: (date: string, expense: TransactionFormData) => Promise<void>
  onAddIncome: (date: string, income: TransactionFormData) => Promise<void>
  onAddInvestment: (date: string, investment: InvestmentFormData) => Promise<void>
  onEditTransaction: (
    date: string,
    transaction: Expense | Income | Investment,
    type: 'expense' | 'income' | 'investment',
    action: EditAction,
    editedData?: EditedTransactionData
  ) => Promise<void>
  onDeleteTransaction: (
    date: string,
    transaction: Expense | Income | Investment,
    type: 'expense' | 'income' | 'investment',
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
  transactionSettings,
  onAddExpense,
  onAddIncome,
  onAddInvestment,
  onEditTransaction,
  onDeleteTransaction,
  onUpdateSettings,
}: FinanceMonthViewProps) {
  // Get settings with defaults
  const settings = transactionSettings || {
    defaultCurrency: '₹' as const,
    expenseCategories: DEFAULT_EXPENSE_CATEGORIES,
    incomeCategories: DEFAULT_INCOME_CATEGORIES,
    investmentGroups: DEFAULT_INVESTMENT_GROUPS,
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
    const hasInvestments = data.investments && data.investments.length > 0

    if (!hasExpenses && !hasIncome && !hasInvestments) return null

    // Calculate totals
    const totalExpenses =
      data.expenses?.reduce((sum: number, e) => sum + (e.amount || 0), 0) || 0
    const totalIncome =
      data.income?.reduce((sum: number, i) => sum + (i.amount || 0), 0) || 0
    const totalInvestments =
      data.investments?.reduce((sum: number, inv) => sum + (inv.amount || 0), 0) || 0

    const netAmount = totalIncome - totalExpenses - totalInvestments

    // Color based on net: positive (green), negative (red), neutral (orange)
    const getFinanceColor = () => {
      if (netAmount > 0) return { bg: 'bg-green-500/20', color: '#00FF00' }
      if (netAmount < 0) return { bg: 'bg-red-500/20', color: '#FF6B6B' }
      return { bg: 'bg-orange-500/20', color: '#FFA500' }
    }

    const { bg } = getFinanceColor()
    const currency = settings.defaultCurrency

    const indicators = []
    if (hasIncome) {
      indicators.push({
        id: 'income',
        label: `${currency}${totalIncome.toFixed(0)} income`,
        color: '#34D399',
      })
    }
    if (hasExpenses) {
      indicators.push({
        id: 'expense',
        label: `${currency}${totalExpenses.toFixed(0)} expense`,
        color: '#F87171',
      })
    }
    if (hasInvestments) {
      indicators.push({
        id: 'investment',
        label: `${currency}${totalInvestments.toFixed(0)} invested`,
        color: '#6366F1',
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
      expenseCategories: settings.expenseCategories,
      incomeCategories: settings.incomeCategories,
      investmentGroups: settings.investmentGroups || DEFAULT_INVESTMENT_GROUPS,
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
      onAddInvestment: async (investment) => {
        const dateFromUrl = new URLSearchParams(window.location.search).get('date')
        const date = dateFromUrl || todayISO
        await onAddInvestment(date, investment)
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
      settings,
      dayData,
      todayISO,
      onAddExpense,
      onAddIncome,
      onAddInvestment,
      onEditTransaction,
      onDeleteTransaction,
      onUpdateSettings,
    ]
  )

  // Monthly summary chips for footer
  const monthlySummaryChips = (
    <div className="flex flex-wrap items-center gap-2">
      {/* Income Chip */}
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30">
        <span className="w-2 h-2 rounded-full bg-emerald-400" />
        <span className="text-[10px] text-white/60">Income</span>
        <span className="text-xs font-semibold text-emerald-400">
          +{formatCurrency(monthlyTotals.totalIncome, settings.defaultCurrency)}
        </span>
      </div>

      {/* Expenses Chip */}
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/30">
        <span className="w-2 h-2 rounded-full bg-red-400" />
        <span className="text-[10px] text-white/60">Expenses</span>
        <span className="text-xs font-semibold text-red-400">
          -{formatCurrency(monthlyTotals.totalExpenses, settings.defaultCurrency)}
        </span>
      </div>

      {/* Investments Chip */}
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30">
        <span className="w-2 h-2 rounded-full bg-indigo-400" />
        <span className="text-[10px] text-white/60">Invested</span>
        <span className="text-xs font-semibold text-indigo-400">
          -{formatCurrency(monthlyTotals.totalInvestments, settings.defaultCurrency)}
        </span>
      </div>

      {/* Net Flow Chip */}
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${
          monthlyTotals.net >= 0
            ? 'bg-emerald-500/10 border-emerald-500/30'
            : 'bg-red-500/10 border-red-500/30'
        }`}
      >
        <span className="text-sm">💰</span>
        <span className="text-[10px] text-white/60">Net</span>
        <span
          className={`text-xs font-semibold ${
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
