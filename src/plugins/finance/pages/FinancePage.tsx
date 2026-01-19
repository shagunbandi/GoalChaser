'use client'

import { useCallback, useMemo } from 'react'
import type { PluginPageProps } from '@/sdk'
import { usePluginPage, LoadingState, NotFoundState, ContentLoader } from '@/sdk'
import { FinanceHeader, FinanceMonthView } from '../components'
import type { EditAction, EditedTransactionData } from '../components/EditTransactionModal'
import type {
  FinanceTransactionData,
  FinanceConfig,
  Expense,
  Income,
  Investment,
  TransactionSettings,
  Currency,
} from '../types'
import { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES, DEFAULT_INVESTMENT_GROUPS } from '../types'
import { FinancePlugin } from '../plugin'
import {
  generateTransactionId,
  generateSeriesId,
  generateOccurrenceDates,
  deleteThisAndUpcoming,
  getFutureOccurrences,
  type TransactionType,
} from '../utils/recurring-utils'
import { FinanceYearView } from '../components/FinanceYearView'

// Type for expense/income form data (includes currency)
type TransactionFormData = {
  categoryId: string
  categoryName: string
  amount: number
  currency: Currency
  description: string
  date: string
  isRecurring?: boolean
  frequency?: 'daily' | 'weekly' | 'monthly'
  endDate?: string
}

// Type for investment form data
type InvestmentFormData = {
  investmentGroupId: string
  investmentGroupName: string
  amount: number
  currency: Currency
  description?: string
  date: string
  isRecurring?: boolean
  frequency?: 'daily' | 'weekly' | 'monthly'
  endDate?: string
}

export default function FinancePage({ params, year, month }: PluginPageProps) {
  const {
    goal,
    goalId,
    isLoading,
    todayISO,
    pluginDayData,
    pluginConfig,
    initialSelectedDay,
    updateDayData,
    updateConfig,
    navigateToPrevYear,
    navigateToNextYear,
    navigateToYear,
    navigateToMonth,
    jumpToMonth,
    hasData,
    year: currentYear,
  } = usePluginPage<FinanceTransactionData, FinanceConfig>({
    pluginId: 'finance',
    params,
    year,
  })

  // Get transaction settings with defaults
  const transactionSettings: TransactionSettings = useMemo(() => {
    return pluginConfig?.transactionSettings || {
      defaultCurrency: '₹',
      expenseCategories: DEFAULT_EXPENSE_CATEGORIES,
      incomeCategories: DEFAULT_INCOME_CATEGORIES,
      investmentGroups: DEFAULT_INVESTMENT_GROUPS,
    }
  }, [pluginConfig?.transactionSettings])

  // Update transaction settings
  const handleUpdateSettings = useCallback(
    async (newSettings: TransactionSettings) => {
      await updateConfig({
        transactionSettings: newSettings,
      })
    },
    [updateConfig]
  )

  // Add expense handler
  const handleAddExpense = useCallback(
    async (date: string, formData: TransactionFormData) => {
      const dayData = pluginDayData[date] || { expenses: [], income: [], investments: [] }
      const existingExpenses = dayData.expenses || []

      if (formData.isRecurring && formData.frequency && formData.endDate) {
        // Create recurring expenses
        const seriesId = generateSeriesId()
        const dates = generateOccurrenceDates(date, formData.endDate, formData.frequency)

        // Create all occurrences
        for (let i = 0; i < dates.length; i++) {
          const occurrenceDate = dates[i]
          const existingDayData = pluginDayData[occurrenceDate] || {
            expenses: [],
            income: [],
            investments: [],
          }

          const expense: Expense = {
            id: generateTransactionId('expense'),
            categoryId: formData.categoryId,
            categoryName: formData.categoryName,
            amount: formData.amount,
            currency: formData.currency,
            description: formData.description,
            date: occurrenceDate,
            isRecurring: true,
            frequency: formData.frequency,
            endDate: formData.endDate,
            seriesId,
            isSeriesParent: i === 0,
            occurrenceIndex: i,
          }

          await updateDayData(occurrenceDate, {
            expenses: [...(existingDayData.expenses || []), expense],
          })
        }
      } else {
        // Single expense
        const newExpense: Expense = {
          id: generateTransactionId('expense'),
          categoryId: formData.categoryId,
          categoryName: formData.categoryName,
          amount: formData.amount,
          currency: formData.currency,
          description: formData.description,
          date,
        }
        await updateDayData(date, {
          expenses: [...existingExpenses, newExpense],
        })
      }
    },
    [pluginDayData, updateDayData]
  )

  // Add income handler
  const handleAddIncome = useCallback(
    async (date: string, formData: TransactionFormData) => {
      const dayData = pluginDayData[date] || { expenses: [], income: [], investments: [] }
      const existingIncome = dayData.income || []

      if (formData.isRecurring && formData.frequency && formData.endDate) {
        // Create recurring income
        const seriesId = generateSeriesId()
        const dates = generateOccurrenceDates(date, formData.endDate, formData.frequency)

        // Create all occurrences
        for (let i = 0; i < dates.length; i++) {
          const occurrenceDate = dates[i]
          const existingDayData = pluginDayData[occurrenceDate] || {
            expenses: [],
            income: [],
            investments: [],
          }

          const income: Income = {
            id: generateTransactionId('income'),
            categoryId: formData.categoryId,
            categoryName: formData.categoryName,
            amount: formData.amount,
            currency: formData.currency,
            description: formData.description,
            date: occurrenceDate,
            isRecurring: true,
            frequency: formData.frequency,
            endDate: formData.endDate,
            seriesId,
            isSeriesParent: i === 0,
            occurrenceIndex: i,
          }

          await updateDayData(occurrenceDate, {
            income: [...(existingDayData.income || []), income],
          })
        }
      } else {
        // Single income
        const newIncome: Income = {
          id: generateTransactionId('income'),
          categoryId: formData.categoryId,
          categoryName: formData.categoryName,
          amount: formData.amount,
          currency: formData.currency,
          description: formData.description,
          date,
        }
        await updateDayData(date, {
          income: [...existingIncome, newIncome],
        })
      }
    },
    [pluginDayData, updateDayData]
  )

  // Add investment handler
  const handleAddInvestment = useCallback(
    async (date: string, formData: InvestmentFormData) => {
      const dayData = pluginDayData[date] || { expenses: [], income: [], investments: [] }
      const existingInvestments = dayData.investments || []

      if (formData.isRecurring && formData.frequency && formData.endDate) {
        // Create recurring investments
        const seriesId = generateSeriesId()
        const dates = generateOccurrenceDates(date, formData.endDate, formData.frequency)

        // Create all occurrences
        for (let i = 0; i < dates.length; i++) {
          const occurrenceDate = dates[i]
          const existingDayData = pluginDayData[occurrenceDate] || {
            expenses: [],
            income: [],
            investments: [],
          }

          const investment: Investment = {
            id: generateTransactionId('investment'),
            investmentGroupId: formData.investmentGroupId,
            investmentGroupName: formData.investmentGroupName,
            amount: formData.amount,
            currency: formData.currency,
            description: formData.description,
            date: occurrenceDate,
            isRecurring: true,
            frequency: formData.frequency,
            endDate: formData.endDate,
            seriesId,
            isSeriesParent: i === 0,
            occurrenceIndex: i,
          }

          await updateDayData(occurrenceDate, {
            investments: [...(existingDayData.investments || []), investment],
          })
        }
      } else {
        // Single investment
        const newInvestment: Investment = {
          id: generateTransactionId('investment'),
          investmentGroupId: formData.investmentGroupId,
          investmentGroupName: formData.investmentGroupName,
          amount: formData.amount,
          currency: formData.currency,
          description: formData.description,
          date,
        }
        await updateDayData(date, {
          investments: [...existingInvestments, newInvestment],
        })
      }
    },
    [pluginDayData, updateDayData]
  )

  // Edit transaction handler
  const handleEditTransaction = useCallback(
    async (
      date: string,
      transaction: Expense | Income | Investment,
      type: TransactionType,
      action: EditAction,
      editedData?: EditedTransactionData
    ) => {
      const dayData = pluginDayData[date] || { expenses: [], income: [], investments: [] }
      const transactionKey = type === 'expense' ? 'expenses' : type === 'income' ? 'income' : 'investments'
      const transactions = (dayData[transactionKey] || []) as (Expense | Income | Investment)[]

      if (action === 'edit_single') {
        // Detach from series and apply edits
        const updated = {
          ...transaction,
          ...(editedData && {
            amount: editedData.amount,
            currency: editedData.currency,
            description: editedData.description,
            ...(type !== 'investment' && {
              categoryId: editedData.categoryId,
              categoryName: editedData.categoryName,
            }),
          }),
          seriesId: undefined,
          isSeriesParent: undefined,
          isRecurring: false,
        }
        const updatedTransactions = transactions.map((t) =>
          t.id === transaction.id ? updated : t
        )
        await updateDayData(date, { [transactionKey]: updatedTransactions })
      } else if (action === 'edit_upcoming' && transaction.seriesId) {
        // Update this and all future occurrences with new data
        const newSeriesId = generateSeriesId()
        const futureOccurrences = getFutureOccurrences<Expense | Income | Investment>(
          transaction.seriesId,
          date,
          pluginDayData,
          type
        )

        // Update each future occurrence with new seriesId and edited data
        for (let i = 0; i < futureOccurrences.length; i++) {
          const occ = futureOccurrences[i]
          const occDayData = pluginDayData[occ.date] || { expenses: [], income: [], investments: [] }
          const occTransactions = (occDayData[transactionKey] || []) as (Expense | Income | Investment)[]

          const updatedOcc = {
            ...occ,
            ...(editedData && {
              amount: editedData.amount,
              currency: editedData.currency,
              description: editedData.description,
              ...(type !== 'investment' && {
                categoryId: editedData.categoryId,
                categoryName: editedData.categoryName,
              }),
            }),
            seriesId: newSeriesId,
            isSeriesParent: i === 0,
            occurrenceIndex: i,
          }

          const updatedTransactions = occTransactions.map((t) =>
            t.id === occ.id ? updatedOcc : t
          )
          await updateDayData(occ.date, { [transactionKey]: updatedTransactions })
        }
      }
    },
    [pluginDayData, updateDayData]
  )

  // Delete transaction handler
  const handleDeleteTransaction = useCallback(
    async (
      date: string,
      transaction: Expense | Income | Investment,
      type: TransactionType,
      action: EditAction
    ) => {
      const transactionKey = type === 'expense' ? 'expenses' : type === 'income' ? 'income' : 'investments'

      if (action === 'delete_single') {
        // Delete just this occurrence
        const dayData = pluginDayData[date] || { expenses: [], income: [], investments: [] }
        const transactions = dayData[transactionKey] || []
        const filtered = transactions.filter((t) => t.id !== transaction.id)
        await updateDayData(date, { [transactionKey]: filtered })
      } else if (action === 'delete_upcoming') {
        // Delete this and all future occurrences
        const { transactionsToDelete, datesToUpdate } = deleteThisAndUpcoming(
          transaction,
          pluginDayData,
          type
        )

        // Group by date and delete
        const idsToDelete = new Set(transactionsToDelete.map((t) => t.id))

        for (const updateDate of datesToUpdate) {
          const dayData = pluginDayData[updateDate] || { expenses: [], income: [], investments: [] }
          const transactions = dayData[transactionKey] || []
          const filtered = transactions.filter((t) => !idsToDelete.has(t.id))
          await updateDayData(updateDate, { [transactionKey]: filtered })
        }
      }
    },
    [pluginDayData, updateDayData]
  )

  // Only show full-page loading on TRUE initial load (no goal AND no cached data)
  if (!goal && isLoading && !hasData) return <LoadingState />
  if (!goal && !isLoading) return <NotFoundState />

  return (
    <div className="space-y-6">
      {/* Header - ALWAYS rendered, never unmounted */}
      <FinanceHeader
        year={currentYear}
        dayData={pluginDayData}
        transactionSettings={transactionSettings}
        onPrevYear={navigateToPrevYear}
        onNextYear={navigateToNextYear}
        onUpdateSettings={handleUpdateSettings}
      />

      {/* Content - shows inline loader when switching years */}
      {isLoading && !hasData ? (
        <ContentLoader color="#007AFF" />
      ) : month ? (
        <FinanceMonthView
          plugin={FinancePlugin}
          month={month}
          year={currentYear}
          goalId={goalId}
          todayISO={todayISO}
          dayData={pluginDayData}
          initialSelectedDate={initialSelectedDay}
          onUpdateDay={updateDayData}
          onBackToYear={() => navigateToYear(currentYear)}
          transactionSettings={transactionSettings}
          onAddExpense={handleAddExpense}
          onAddIncome={handleAddIncome}
          onAddInvestment={handleAddInvestment}
          onEditTransaction={handleEditTransaction}
          onDeleteTransaction={handleDeleteTransaction}
          onUpdateSettings={handleUpdateSettings}
        />
      ) : (
        <FinanceYearView
          year={currentYear}
          todayISO={todayISO}
          dayData={pluginDayData}
          transactionSettings={transactionSettings}
          initialSelectedDay={initialSelectedDay}
          onPrevYear={navigateToPrevYear}
          onNextYear={navigateToNextYear}
          onJumpToDay={jumpToMonth}
          onMonthClick={navigateToMonth}
        />
      )}
    </div>
  )
}
