'use client'

import { useCallback, useMemo } from 'react'
import type { PluginPageProps } from '@/sdk'
import { usePluginPage, LoadingState, NotFoundState } from '@/sdk'
import { FinanceHeader, BudgetingView, FinanceMonthView } from '../components'
import type { EditAction, EditedTransactionData } from '../components/EditTransactionModal'
import type {
  FinanceTransactionData,
  FinanceConfig,
  Expense,
  Income,
  BudgetCategory,
  TransactionSettings,
  Currency,
} from '../types'
import { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from '../types'
import { FinancePlugin } from '../plugin'
import {
  generateTransactionId,
  generateSeriesId,
  generateOccurrenceDates,
  deleteThisAndUpcoming,
  getFutureOccurrences,
  type TransactionType,
} from '../utils/recurring-utils'

// Type for expense/income form data (includes currency)
type TransactionFormData = {
  categoryId: string
  categoryName: string
  amount: number
  currency: Currency
  description: string
  date: string
  budgetId?: string
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
    year: currentYear,
  } = usePluginPage<FinanceTransactionData, FinanceConfig>({
    pluginId: 'finance',
    params,
    year,
  })

  const handleJumpToDay = (iso: string) => {
    const [y, m] = iso.split('-').map(Number)
    navigateToMonth(y, m, iso)
  }

  const budgets = pluginConfig?.budgets || []
  const sips = pluginConfig?.sips || []

  // Get transaction settings with defaults
  const transactionSettings: TransactionSettings = useMemo(() => {
    return pluginConfig?.transactionSettings || {
      defaultCurrency: '₹',
      expenseCategories: DEFAULT_EXPENSE_CATEGORIES,
      incomeCategories: DEFAULT_INCOME_CATEGORIES,
    }
  }, [pluginConfig?.transactionSettings])

  // Get categories from all budgets
  const allCategories = useMemo(() => {
    const categoryMap = new Map<string, BudgetCategory>()
    budgets.forEach((budget) => {
      budget.categories?.forEach((cat) => {
        if (!categoryMap.has(cat.id)) {
          categoryMap.set(cat.id, cat)
        }
      })
    })
    return Array.from(categoryMap.values())
  }, [budgets])

  // Get active budget for a date
  const getActiveBudget = useCallback(
    (date: string) => {
      return budgets.find((b) => date >= b.startDate && date <= b.endDate)
    },
    [budgets]
  )

  // Get categories for a specific date (from active budget)
  const getCategoriesForDate = useCallback(
    (date: string): BudgetCategory[] => {
      const activeBudget = getActiveBudget(date)
      return activeBudget?.categories || allCategories
    },
    [getActiveBudget, allCategories]
  )

  const handleSaveBudget = async (budget: any) => {
    const existingBudgets = budgets.filter((b: any) => b.id !== budget.id)
    await updateConfig({
      budgets: [...existingBudgets, budget],
      sips,
      transactionSettings,
    })
  }

  const handleSaveBudgets = async (newBudgets: any[]) => {
    const newBudgetIds = new Set(newBudgets.map((b) => b.id))
    const existingBudgets = budgets.filter((b: any) => !newBudgetIds.has(b.id))
    await updateConfig({
      budgets: [...existingBudgets, ...newBudgets],
      sips,
      transactionSettings,
    })
  }

  const handleDeleteBudget = async (budgetId: string) => {
    await updateConfig({
      budgets: budgets.filter((b: any) => b.id !== budgetId),
      sips,
      transactionSettings,
    })
  }

  const handleSaveSIP = async (sip: any) => {
    const existingSips = sips.filter((s: any) => s.id !== sip.id)
    await updateConfig({
      budgets,
      sips: [...existingSips, sip],
      transactionSettings,
    })
  }

  const handleDeleteSIP = async (sipId: string) => {
    await updateConfig({
      budgets,
      sips: sips.filter((s: any) => s.id !== sipId),
      transactionSettings,
    })
  }

  // Update transaction settings
  const handleUpdateSettings = useCallback(
    async (newSettings: TransactionSettings) => {
      await updateConfig({
        budgets,
        sips,
        transactionSettings: newSettings,
      })
    },
    [budgets, sips, updateConfig]
  )

  // Add expense handler
  const handleAddExpense = useCallback(
    async (date: string, formData: TransactionFormData) => {
      const dayData = pluginDayData[date] || { expenses: [], income: [] }
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
          }

          const expense: Expense = {
            id: generateTransactionId('expense'),
            categoryId: formData.categoryId,
            categoryName: formData.categoryName,
            amount: formData.amount,
            currency: formData.currency,
            description: formData.description,
            date: occurrenceDate,
            budgetId: formData.budgetId,
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
          budgetId: formData.budgetId,
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
      const dayData = pluginDayData[date] || { expenses: [], income: [] }
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
          }

          const income: Income = {
            id: generateTransactionId('income'),
            categoryId: formData.categoryId,
            categoryName: formData.categoryName,
            amount: formData.amount,
            currency: formData.currency,
            description: formData.description,
            date: occurrenceDate,
            budgetId: formData.budgetId,
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
          budgetId: formData.budgetId,
        }
        await updateDayData(date, {
          income: [...existingIncome, newIncome],
        })
      }
    },
    [pluginDayData, updateDayData]
  )

  // Edit transaction handler
  const handleEditTransaction = useCallback(
    async (
      date: string,
      transaction: Expense | Income,
      type: TransactionType,
      action: EditAction,
      editedData?: EditedTransactionData
    ) => {
      const dayData = pluginDayData[date] || { expenses: [], income: [] }
      const transactionKey = type === 'expense' ? 'expenses' : 'income'
      const transactions = (dayData[transactionKey] || []) as (Expense | Income)[]

      if (action === 'edit_single') {
        // Detach from series and apply edits
        const updated = {
          ...transaction,
          ...(editedData && {
            amount: editedData.amount,
            currency: editedData.currency,
            description: editedData.description,
            categoryId: editedData.categoryId,
            categoryName: editedData.categoryName,
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
        const futureOccurrences = getFutureOccurrences<Expense | Income>(
          transaction.seriesId,
          date,
          pluginDayData,
          type
        )

        // Update each future occurrence with new seriesId and edited data
        for (let i = 0; i < futureOccurrences.length; i++) {
          const occ = futureOccurrences[i]
          const occDayData = pluginDayData[occ.date] || { expenses: [], income: [] }
          const occTransactions = (occDayData[transactionKey] || []) as (Expense | Income)[]

          const updatedOcc = {
            ...occ,
            ...(editedData && {
              amount: editedData.amount,
              currency: editedData.currency,
              description: editedData.description,
              categoryId: editedData.categoryId,
              categoryName: editedData.categoryName,
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
      transaction: Expense | Income,
      type: TransactionType,
      action: EditAction
    ) => {
      const transactionKey = type === 'expense' ? 'expenses' : 'income'

      if (action === 'delete_single') {
        // Delete just this occurrence
        const dayData = pluginDayData[date] || { expenses: [], income: [] }
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
          const dayData = pluginDayData[updateDate] || { expenses: [], income: [] }
          const transactions = dayData[transactionKey] || []
          const filtered = transactions.filter((t) => !idsToDelete.has(t.id))
          await updateDayData(updateDate, { [transactionKey]: filtered })
        }
      }
    },
    [pluginDayData, updateDayData]
  )

  // Check if we have any data yet (for initial load vs navigation)
  const hasData = Object.keys(pluginDayData).length > 0 || pluginConfig !== null

  // Only show full-page loading on TRUE initial load (no goal AND no cached data)
  if (!goal && isLoading && !hasData) return <LoadingState />
  if (!goal && !isLoading) return <NotFoundState />

  // Content loading indicator (shown inline when switching years)
  const ContentLoader = () => (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-[#007AFF] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  // Get current month's categories for the month view
  const currentMonthCategories = month
    ? getCategoriesForDate(`${currentYear}-${String(month).padStart(2, '0')}-01`)
    : allCategories

  // Get active budget ID for current month
  const currentActiveBudgetId = month
    ? getActiveBudget(`${currentYear}-${String(month).padStart(2, '0')}-01`)?.id
    : undefined

  return (
    <div className="space-y-6">
      {/* Header - ALWAYS rendered, never unmounted */}
      <FinanceHeader
        year={currentYear}
        dayData={pluginDayData}
        budgets={budgets}
        sips={sips}
        transactionSettings={transactionSettings}
        onPrevYear={navigateToPrevYear}
        onNextYear={navigateToNextYear}
        onSaveBudget={handleSaveBudget}
        onSaveBudgets={handleSaveBudgets}
        onDeleteBudget={handleDeleteBudget}
        onSaveSIP={handleSaveSIP}
        onDeleteSIP={handleDeleteSIP}
        onUpdateSettings={handleUpdateSettings}
      />

      {/* Content - shows inline loader when switching years */}
      {isLoading && !hasData ? (
        <ContentLoader />
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
          categories={currentMonthCategories}
          budgets={budgets}
          activeBudgetId={currentActiveBudgetId}
          transactionSettings={transactionSettings}
          onAddExpense={handleAddExpense}
          onAddIncome={handleAddIncome}
          onEditTransaction={handleEditTransaction}
          onDeleteTransaction={handleDeleteTransaction}
          onUpdateSettings={handleUpdateSettings}
        />
      ) : (
        <BudgetingView
          year={currentYear}
          todayISO={todayISO}
          dayDetails={pluginDayData}
          budgets={budgets}
          sips={sips}
          initialSelectedDay={initialSelectedDay}
          onPrevYear={navigateToPrevYear}
          onNextYear={navigateToNextYear}
          onUpdateDay={updateDayData}
          onSaveBudget={handleSaveBudget}
          onSaveBudgets={handleSaveBudgets}
          onDeleteBudget={handleDeleteBudget}
          onSaveSIP={handleSaveSIP}
          onDeleteSIP={handleDeleteSIP}
          onJumpToDay={handleJumpToDay}
          onMonthClick={navigateToMonth}
        />
      )}
    </div>
  )
}
