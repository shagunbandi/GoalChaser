'use client'

import { useMemo, useState } from 'react'
import { HeaderRenderer } from '@/components/features/year-view/renderers/HeaderRenderer'
import { FinanceManager } from './FinanceManager'
import { TransactionSettingsModal } from './TransactionSettingsModal'
import type { FinanceTransactionData, BudgetPlan, SIPPlan, TransactionSettings } from '../types'
import { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from '../types'

interface FinanceHeaderProps {
  year: number
  dayData: Record<string, FinanceTransactionData>
  budgets?: BudgetPlan[]
  sips?: SIPPlan[]
  transactionSettings?: TransactionSettings
  onPrevYear: () => void
  onNextYear: () => void
  onSaveBudget?: (budget: BudgetPlan) => Promise<void>
  onSaveBudgets?: (budgets: BudgetPlan[]) => Promise<void>
  onDeleteBudget?: (budgetId: string) => Promise<void>
  onSaveSIP?: (sip: SIPPlan) => Promise<void>
  onDeleteSIP?: (sipId: string) => Promise<void>
  onUpdateSettings?: (settings: TransactionSettings) => Promise<void>
}

export function FinanceHeader({
  year,
  dayData,
  budgets = [],
  sips = [],
  transactionSettings,
  onPrevYear,
  onNextYear,
  onSaveBudget,
  onSaveBudgets,
  onDeleteBudget,
  onSaveSIP,
  onDeleteSIP,
  onUpdateSettings,
}: FinanceHeaderProps) {
  const [showFinanceManager, setShowFinanceManager] = useState(false)
  const [showTransactionSettings, setShowTransactionSettings] = useState(false)

  // Get settings with defaults
  const settings = transactionSettings || {
    defaultCurrency: '₹' as const,
    expenseCategories: DEFAULT_EXPENSE_CATEGORIES,
    incomeCategories: DEFAULT_INCOME_CATEGORIES,
  }

  const headerConfig = useMemo(() => {
    const yearPrefix = `${year}-`
    const yearEntries = Object.entries(dayData).filter(([iso]) =>
      iso.startsWith(yearPrefix),
    )

    const yearStats = {
      income: yearEntries.reduce((sum, [, data]) => {
        return (
          sum +
          (data?.income?.reduce(
            (s: number, i: { amount?: number }) => s + (i.amount || 0),
            0,
          ) || 0)
        )
      }, 0),
      expenses: yearEntries.reduce((sum, [, data]) => {
        return (
          sum +
          (data?.expenses?.reduce(
            (s: number, e: { amount?: number }) => s + (e.amount || 0),
            0,
          ) || 0)
        )
      }, 0),
      sips: yearEntries.reduce((sum, [, data]) => {
        return (
          sum +
          ((data as { sips?: Array<{ amount?: number }> })?.sips?.reduce(
            (s: number, sip: { amount?: number }) => s + (sip.amount || 0),
            0,
          ) || 0)
        )
      }, 0),
    }

    const hasActions = onSaveBudget && onSaveSIP
    const currency = settings.defaultCurrency

    const actions = []
    if (hasActions) {
      actions.push({
        id: 'manage-finance',
        label: 'Manage Finance',
        icon: '⚙️',
        onClick: () => setShowFinanceManager(true),
      })
    }
    if (onUpdateSettings) {
      actions.push({
        id: 'manage-transactions',
        label: 'Manage Transactions',
        icon: '💳',
        onClick: () => setShowTransactionSettings(true),
      })
    }

    return {
      icon: '💰',
      title: `Finance Year:`,
      stats: [
        {
          label: 'Income',
          value: `${currency}${yearStats.income.toLocaleString('en-IN')}`,
        },
        {
          label: 'Expenses',
          value: `${currency}${yearStats.expenses.toLocaleString('en-IN')}`,
        },
        { label: 'SIP', value: `${currency}${yearStats.sips.toLocaleString('en-IN')}` },
      ],
      legends: [
        { label: 'Income', color: 'rgb(74, 222, 128)' },
        { label: 'Expense', color: 'rgb(248, 113, 113)' },
        { label: 'SIP', color: 'rgb(96, 165, 250)' },
      ],
      actions,
    }
  }, [dayData, year, onSaveBudget, onSaveSIP, onUpdateSettings, settings.defaultCurrency])

  const handleSaveSettings = async (newSettings: TransactionSettings) => {
    if (onUpdateSettings) {
      await onUpdateSettings(newSettings)
    }
  }

  if (!headerConfig) return null

  return (
    <>
      <HeaderRenderer
        config={headerConfig}
        year={year}
        onPrevYear={onPrevYear}
        onNextYear={onNextYear}
      />

      {/* Finance Manager Drawer */}
      {showFinanceManager && onSaveBudget && onSaveBudgets && onDeleteBudget && onSaveSIP && onDeleteSIP && (
        <FinanceManager
          isOpen={showFinanceManager}
          budgets={budgets}
          sips={sips}
          onSaveBudget={onSaveBudget}
          onSaveBudgets={onSaveBudgets}
          onDeleteBudget={onDeleteBudget}
          onSaveSIP={onSaveSIP}
          onDeleteSIP={onDeleteSIP}
          onClose={() => setShowFinanceManager(false)}
        />
      )}

      {/* Transaction Settings Modal */}
      <TransactionSettingsModal
        open={showTransactionSettings}
        onClose={() => setShowTransactionSettings(false)}
        settings={settings}
        onSave={handleSaveSettings}
      />
    </>
  )
}
