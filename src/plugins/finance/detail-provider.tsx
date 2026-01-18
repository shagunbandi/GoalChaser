'use client'

import { useState, useMemo, type ReactNode } from 'react'
import type { PluginDetailProvider } from '@/sdk'
import { NotesField } from '@/sdk'
import type {
  FinanceTransactionData,
  Expense,
  Income,
  BudgetCategory,
  BudgetPlan,
  TransactionCategory,
  TransactionSettings,
  Currency,
} from './types'
import { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from './types'
import { ExpenseForm } from './components/ExpenseForm'
import { IncomeForm } from './components/IncomeForm'
import { EditTransactionModal, type EditAction, type EditedTransactionData } from './components/EditTransactionModal'
import { TransactionSettingsModal } from './components/TransactionSettingsModal'
import {
  isRecurringTransaction,
  calculateDailyTotals,
  calculateRunningTotals,
  formatCurrency,
} from './utils/recurring-utils'

// Type for form data from ExpenseForm/IncomeForm
export type TransactionFormData = {
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

// Context passed from FinanceMonthView
export interface FinanceDetailContext {
  categories: (BudgetCategory | TransactionCategory)[]
  expenseCategories: TransactionCategory[]
  incomeCategories: TransactionCategory[]
  budgets: BudgetPlan[]
  activeBudgetId?: string
  transactionSettings?: TransactionSettings
  onAddExpense?: (expense: TransactionFormData) => Promise<void>
  onAddIncome?: (income: TransactionFormData) => Promise<void>
  onEditTransaction?: (
    transaction: Expense | Income,
    type: 'expense' | 'income',
    action: EditAction,
    editedData?: EditedTransactionData
  ) => Promise<void>
  onDeleteTransaction?: (
    transaction: Expense | Income,
    type: 'expense' | 'income',
    action: EditAction
  ) => Promise<void>
  onUpdateSettings?: (settings: TransactionSettings) => Promise<void>
  allDayData?: Record<string, FinanceTransactionData>
}

// Format amount helper (wrapper for formatCurrency)
function formatAmount(amount: number, currency: Currency = '₹'): string {
  return formatCurrency(amount, currency)
}

// Statistics Card Component
function StatCard({
  icon,
  label,
  value,
  color,
  bgColor,
}: {
  icon: string
  label: string
  value: string
  color: string
  bgColor: string
}) {
  return (
    <div
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all hover:scale-[1.02]"
      style={{
        backgroundColor: bgColor,
        borderColor: `${color}30`,
      }}
    >
      <span className="text-base">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] uppercase tracking-wider text-white/50 font-medium">
          {label}
        </div>
        <div className="text-sm font-bold" style={{ color }}>
          {value}
        </div>
      </div>
    </div>
  )
}

// Statistics Section Component
function FinanceStats({
  dailyTotals,
  runningTotals,
  currency,
  transactionCountToday,
  transactionCountMTD,
}: {
  dailyTotals: { totalExpenses: number; totalIncome: number; net: number }
  runningTotals: { totalExpenses: number; totalIncome: number; net: number }
  currency: Currency
  transactionCountToday: number
  transactionCountMTD: number
}) {
  return (
    <div className="space-y-4">
      {/* Today Stats */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider text-white/40 font-semibold">
            Today
          </span>
          <span className="text-[10px] text-white/30">
            {transactionCountToday} transaction{transactionCountToday !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <StatCard
            icon="💰"
            label="Income"
            value={`+${formatAmount(dailyTotals.totalIncome, currency)}`}
            color="#34D399"
            bgColor="rgba(52, 211, 153, 0.08)"
          />
          <StatCard
            icon="🛒"
            label="Expenses"
            value={formatAmount(dailyTotals.totalExpenses, currency)}
            color="#F87171"
            bgColor="rgba(248, 113, 113, 0.08)"
          />
          <StatCard
            icon={dailyTotals.net >= 0 ? '📈' : '📉'}
            label="Net"
            value={`${dailyTotals.net >= 0 ? '+' : ''}${formatAmount(dailyTotals.net, currency)}`}
            color={dailyTotals.net >= 0 ? '#34D399' : '#F87171'}
            bgColor={dailyTotals.net >= 0 ? 'rgba(52, 211, 153, 0.08)' : 'rgba(248, 113, 113, 0.08)'}
          />
        </div>
      </div>

      {/* Running MTD Stats */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider text-white/40 font-semibold">
            This Month (Running)
          </span>
          <span className="text-[10px] text-white/30">
            {transactionCountMTD} transaction{transactionCountMTD !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <StatCard
            icon="💵"
            label="Income"
            value={`+${formatAmount(runningTotals.totalIncome, currency)}`}
            color="#34D399"
            bgColor="rgba(52, 211, 153, 0.05)"
          />
          <StatCard
            icon="🧾"
            label="Expenses"
            value={formatAmount(runningTotals.totalExpenses, currency)}
            color="#F87171"
            bgColor="rgba(248, 113, 113, 0.05)"
          />
          <StatCard
            icon={runningTotals.net >= 0 ? '📊' : '📉'}
            label="Net"
            value={`${runningTotals.net >= 0 ? '+' : ''}${formatAmount(runningTotals.net, currency)}`}
            color={runningTotals.net >= 0 ? '#34D399' : '#F87171'}
            bgColor={runningTotals.net >= 0 ? 'rgba(52, 211, 153, 0.05)' : 'rgba(248, 113, 113, 0.05)'}
          />
        </div>
      </div>
    </div>
  )
}

// Component wrapper that handles state
function FinanceDetailView({
  data,
  date,
  onUpdate,
  context,
}: {
  data: FinanceTransactionData | null
  date: string
  onUpdate: (updates: Partial<FinanceTransactionData>) => Promise<void>
  context?: FinanceDetailContext
}) {
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [showIncomeForm, setShowIncomeForm] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<{
    transaction: Expense | Income
    type: 'expense' | 'income'
    mode: 'edit' | 'delete'
  } | null>(null)

  const expenses = data?.expenses || []
  const income = data?.income || []

  // Calculate daily totals
  const dailyTotals = useMemo(() => calculateDailyTotals(data), [data])

  // Calculate running totals (MTD)
  const runningTotals = useMemo(() => {
    if (!context?.allDayData) {
      return dailyTotals
    }
    return calculateRunningTotals(context.allDayData, date)
  }, [context?.allDayData, date, dailyTotals])

  // Get settings with defaults
  const settings = context?.transactionSettings || {
    defaultCurrency: '₹' as Currency,
    expenseCategories: DEFAULT_EXPENSE_CATEGORIES,
    incomeCategories: DEFAULT_INCOME_CATEGORIES,
  }

  const expenseCategories = context?.expenseCategories || settings.expenseCategories
  const incomeCategories = context?.incomeCategories || settings.incomeCategories
  const budgets = context?.budgets || []
  const defaultCurrency = settings.defaultCurrency

  const handleAddExpense = async (expenseData: TransactionFormData) => {
    setIsSubmitting(true)
    try {
      if (context?.onAddExpense) {
        await context.onAddExpense(expenseData)
      }
      setShowExpenseForm(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddIncome = async (incomeData: TransactionFormData) => {
    setIsSubmitting(true)
    try {
      if (context?.onAddIncome) {
        await context.onAddIncome(incomeData)
      }
      setShowIncomeForm(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditAction = async (action: EditAction, editedData?: EditedTransactionData) => {
    if (!editingTransaction || !context) return

    const { transaction, type, mode } = editingTransaction

    if (mode === 'delete' && context.onDeleteTransaction) {
      await context.onDeleteTransaction(transaction, type, action)
    } else if (mode === 'edit' && context.onEditTransaction) {
      await context.onEditTransaction(transaction, type, action, editedData)
    }

    setEditingTransaction(null)
  }

  const handleSaveSettings = async (newSettings: TransactionSettings) => {
    if (context?.onUpdateSettings) {
      await context.onUpdateSettings(newSettings)
    }
  }

  const renderTransactionItem = (
    transaction: Expense | Income,
    type: 'expense' | 'income'
  ) => {
    const isExpense = type === 'expense'
    const accentColor = isExpense ? '#F87171' : '#34D399'
    const isRecurring = isRecurringTransaction(transaction)
    const currency = transaction.currency || defaultCurrency
    const icon = isExpense ? '🛒' : '💵'

    return (
      <div
        key={transaction.id}
        className="group flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all duration-200 hover:scale-[1.01]"
        style={{
          background: `linear-gradient(135deg, ${accentColor}08, transparent)`,
          borderWidth: 1,
          borderColor: `${accentColor}15`,
        }}
      >
        {/* Icon */}
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-sm"
          style={{ backgroundColor: `${accentColor}15` }}
        >
          {icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="text-sm font-medium text-white/85 truncate">
              {transaction.description || 'No description'}
            </div>
            {isRecurring && (
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-md font-medium"
                style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
              >
                🔄 Recurring
              </span>
            )}
          </div>
          <div className="text-xs text-white/40 mt-0.5">{transaction.categoryName}</div>
        </div>

        {/* Amount & Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="text-sm font-bold" style={{ color: accentColor }}>
            {isExpense ? '-' : '+'}
            {formatAmount(transaction.amount, currency)}
          </div>

          {/* Edit/Delete Buttons */}
          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-all duration-200">
            <button
              onClick={() =>
                setEditingTransaction({ transaction, type, mode: 'edit' })
              }
              className="p-1.5 rounded-lg hover:bg-white/10 text-white/30 hover:text-white/70 transition-all"
              title="Edit"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
            </button>
            <button
              onClick={() =>
                setEditingTransaction({ transaction, type, mode: 'delete' })
              }
              className="p-1.5 rounded-lg hover:bg-red-500/20 text-white/30 hover:text-red-400 transition-all"
              title="Delete"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Determine status badge
  const getStatusBadge = () => {
    if (dailyTotals.net > 0) return { label: 'Surplus', color: '#34D399', bg: 'rgba(52, 211, 153, 0.15)' }
    if (dailyTotals.net < 0) return { label: 'Deficit', color: '#F87171', bg: 'rgba(248, 113, 113, 0.15)' }
    return { label: 'Balanced', color: '#FBBF24', bg: 'rgba(251, 191, 36, 0.15)' }
  }

  const statusBadge = getStatusBadge()

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-green-500/20 to-teal-500/20 flex items-center justify-center text-xl shadow-lg shadow-emerald-500/10">
            💰
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white/95">Finance</h3>
              <span
                className="px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider"
                style={{ backgroundColor: statusBadge.bg, color: statusBadge.color }}
              >
                {statusBadge.label}
              </span>
            </div>
            <p className="text-xs text-white/50">
              {dailyTotals.transactionCount} today, {runningTotals.transactionCount} this month
            </p>
          </div>
        </div>
        {/* Settings Button */}
        <button
          onClick={() => setShowSettings(true)}
          className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] text-white/50 hover:text-white/80 transition-all duration-200 hover:border-white/15"
          title="Manage Transactions"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </button>
      </div>

      {/* Statistics Section */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.06] backdrop-blur-sm">
        <FinanceStats
          dailyTotals={dailyTotals}
          runningTotals={runningTotals}
          currency={defaultCurrency}
          transactionCountToday={dailyTotals.transactionCount}
          transactionCountMTD={runningTotals.transactionCount}
        />
      </div>

      {/* Notes */}
      <NotesField
        value={data?.notes || ''}
        onSave={async (notes) => await onUpdate({ notes })}
        label="Finance Notes"
        placeholder="Notes about your finances today..."
        icon="📝"
        accentColor="#10B981"
        resetKey={date}
      />

      {/* Transactions Section */}
      <div className="space-y-4 p-4 rounded-2xl bg-gradient-to-br from-white/[0.02] to-transparent border border-white/[0.06]">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-white/80 flex items-center gap-2">
            <span className="text-base">💳</span>
            Transactions
          </h4>
          {(expenses.length > 0 || income.length > 0) && (
            <span className="text-[10px] px-2 py-1 rounded-lg bg-white/[0.05] text-white/40 font-medium">
              {expenses.length + income.length} items
            </span>
          )}
        </div>

        {/* Add Transaction Buttons */}
        {!showExpenseForm && !showIncomeForm && (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setShowExpenseForm(true)}
              className="group flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-gradient-to-br from-red-500/10 to-rose-500/5 border border-red-500/20 text-red-400 hover:from-red-500/15 hover:to-rose-500/10 hover:border-red-500/30 transition-all duration-200 text-sm font-semibold shadow-lg shadow-red-500/5"
            >
              <span className="group-hover:scale-110 transition-transform">📉</span>
              Add Expense
            </button>
            <button
              onClick={() => setShowIncomeForm(true)}
              className="group flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-gradient-to-br from-emerald-500/10 to-green-500/5 border border-emerald-500/20 text-emerald-400 hover:from-emerald-500/15 hover:to-green-500/10 hover:border-emerald-500/30 transition-all duration-200 text-sm font-semibold shadow-lg shadow-emerald-500/5"
            >
              <span className="group-hover:scale-110 transition-transform">📈</span>
              Add Income
            </button>
          </div>
        )}

        {/* Expense Form */}
        {showExpenseForm && (
          <div className="p-4 rounded-xl bg-gradient-to-br from-red-500/[0.03] to-transparent border border-red-500/20">
            <h4 className="text-sm font-semibold text-white/85 mb-4 flex items-center gap-2">
              <span className="text-red-400">📉</span>
              Add Expense
            </h4>
            <ExpenseForm
              date={date}
              categories={expenseCategories}
              availableBudgets={budgets}
              defaultCurrency={defaultCurrency}
              activeBudgetId={context?.activeBudgetId}
              onSubmit={handleAddExpense}
              onCancel={() => setShowExpenseForm(false)}
              isSubmitting={isSubmitting}
            />
          </div>
        )}

        {/* Income Form */}
        {showIncomeForm && (
          <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/[0.03] to-transparent border border-emerald-500/20">
            <h4 className="text-sm font-semibold text-white/85 mb-4 flex items-center gap-2">
              <span className="text-emerald-400">📈</span>
              Add Income
            </h4>
            <IncomeForm
              date={date}
              categories={incomeCategories}
              availableBudgets={budgets}
              defaultCurrency={defaultCurrency}
              activeBudgetId={context?.activeBudgetId}
              onSubmit={handleAddIncome}
              onCancel={() => setShowIncomeForm(false)}
              isSubmitting={isSubmitting}
            />
          </div>
        )}

        {/* Transaction List */}
        {(expenses.length > 0 || income.length > 0) && !showExpenseForm && !showIncomeForm && (
          <div className="space-y-2.5 pt-3">
            {income.map((item) => renderTransactionItem(item, 'income'))}
            {expenses.map((item) => renderTransactionItem(item, 'expense'))}
          </div>
        )}

        {/* Empty State */}
        {expenses.length === 0 && income.length === 0 && !showExpenseForm && !showIncomeForm && (
          <div className="text-center py-8">
            <div className="text-4xl mb-3 opacity-50">💸</div>
            <p className="text-sm text-white/50 font-medium">No transactions yet</p>
            <p className="text-xs text-white/30 mt-1">Add an expense or income to get started</p>
          </div>
        )}
      </div>

      {/* Edit/Delete Modal */}
      {editingTransaction && (
        <EditTransactionModal
          open={!!editingTransaction}
          onClose={() => setEditingTransaction(null)}
          transaction={editingTransaction.transaction}
          type={editingTransaction.type}
          mode={editingTransaction.mode}
          onAction={handleEditAction}
          expenseCategories={expenseCategories}
          incomeCategories={incomeCategories}
          defaultCurrency={defaultCurrency}
        />
      )}

      {/* Settings Modal */}
      <TransactionSettingsModal
        open={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onSave={handleSaveSettings}
      />
    </div>
  )
}

export class FinanceDetailProviderImpl
  implements PluginDetailProvider<FinanceTransactionData>
{
  renderDetail(
    data: FinanceTransactionData | null,
    date: string,
    onUpdate: (updates: Partial<FinanceTransactionData>) => Promise<void>,
    context?: FinanceDetailContext
  ): ReactNode {
    return (
      <FinanceDetailView
        data={data}
        date={date}
        onUpdate={onUpdate}
        context={context}
      />
    )
  }
}
