'use client'

import { useState, type ReactNode } from 'react'
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
import { isRecurringTransaction } from './utils/recurring-utils'

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

// Format currency with symbol
function formatAmount(amount: number, currency: Currency = '₹'): string {
  return `${currency}${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
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
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
  const totalIncome = income.reduce((sum, i) => sum + i.amount, 0)
  const netFlow = totalIncome - totalExpenses

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
    const accentColor = isExpense ? '#FF453A' : '#32D74B'
    const isRecurring = isRecurringTransaction(transaction)
    const currency = transaction.currency || defaultCurrency

    return (
      <div
        key={transaction.id}
        className="group flex items-center justify-between px-3 py-2.5 rounded-xl transition-all"
        style={{
          backgroundColor: `${accentColor}10`,
          borderWidth: 1,
          borderColor: `${accentColor}20`,
        }}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="text-sm text-white/80 truncate">
              {transaction.description || 'No description'}
            </div>
            {isRecurring && (
              <span
                className="text-xs px-1.5 py-0.5 rounded"
                style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
              >
                🔄
              </span>
            )}
          </div>
          <div className="text-xs text-white/40">{transaction.categoryName}</div>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-sm font-semibold" style={{ color: accentColor }}>
            {isExpense ? '-' : '+'}
            {formatAmount(transaction.amount, currency)}
          </div>

          {/* Edit/Delete Buttons */}
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() =>
                setEditingTransaction({ transaction, type, mode: 'edit' })
              }
              className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white/80 transition-all"
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
              className="p-1.5 rounded-lg hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-all"
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/30 to-green-500/30 flex items-center justify-center text-xl">
            💰
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white/90">Finance</h3>
            <p className="text-xs text-white/50">
              {expenses.length + income.length} transaction
              {expenses.length + income.length !== 1 ? 's' : ''} today
            </p>
          </div>
        </div>
        {/* Settings Button */}
        <button
          onClick={() => setShowSettings(true)}
          className="p-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.08] border border-white/10 text-white/60 hover:text-white/80 transition-all"
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
      <div className="space-y-4 p-4 rounded-xl bg-white/[0.02] border border-white/10">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-white/70 flex items-center gap-2">
            <span>💳</span>
            Transactions
          </h4>
          <span className="text-xs text-white/40">
            {defaultCurrency} {expenses.length + income.length > 0 ? `• ${expenses.length + income.length} items` : ''}
          </span>
        </div>

        {/* Add Transaction Buttons */}
        {!showExpenseForm && !showIncomeForm && (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setShowExpenseForm(true)}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all text-sm font-medium"
            >
              <span>📉</span>
              Expense
            </button>
            <button
              onClick={() => setShowIncomeForm(true)}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all text-sm font-medium"
            >
              <span>📈</span>
              Income
            </button>
          </div>
        )}

        {/* Expense Form */}
        {showExpenseForm && (
          <div className="p-4 rounded-xl bg-white/[0.02] border border-red-500/20">
            <h4 className="text-sm font-medium text-white/80 mb-4 flex items-center gap-2">
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
          <div className="p-4 rounded-xl bg-white/[0.02] border border-emerald-500/20">
            <h4 className="text-sm font-medium text-white/80 mb-4 flex items-center gap-2">
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
          <div className="space-y-2 pt-2">
            {income.map((item) => renderTransactionItem(item, 'income'))}
            {expenses.map((item) => renderTransactionItem(item, 'expense'))}
          </div>
        )}

        {/* Empty State */}
        {expenses.length === 0 && income.length === 0 && !showExpenseForm && !showIncomeForm && (
          <div className="text-center text-white/40 py-4">
            <p className="text-sm">No transactions yet</p>
            <p className="text-xs mt-1">Add an expense or income above</p>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      {(totalIncome > 0 || totalExpenses > 0) && (
        <div className="grid grid-cols-3 gap-3">
          <div className="px-3 py-3 rounded-xl bg-white/[0.03] border border-white/5">
            <div className="text-xs text-white/40 mb-1">Income</div>
            <div className="text-sm font-semibold text-emerald-400">
              +{formatAmount(totalIncome, defaultCurrency)}
            </div>
          </div>
          <div className="px-3 py-3 rounded-xl bg-white/[0.03] border border-white/5">
            <div className="text-xs text-white/40 mb-1">Expenses</div>
            <div className="text-sm font-semibold text-red-400">
              -{formatAmount(totalExpenses, defaultCurrency)}
            </div>
          </div>
          <div className="px-3 py-3 rounded-xl bg-white/[0.03] border border-white/5">
            <div className="text-xs text-white/40 mb-1">Net</div>
            <div
              className={`text-sm font-semibold ${netFlow >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
            >
              {netFlow >= 0 ? '+' : ''}
              {formatAmount(netFlow, defaultCurrency)}
            </div>
          </div>
        </div>
      )}

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
