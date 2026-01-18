'use client'

import { useMemo, useState } from 'react'
import { HeaderRenderer } from '@/components/features/year-view/renderers/HeaderRenderer'
import { TransactionSettingsModal } from './TransactionSettingsModal'
import type {
  FinanceTransactionData,
  TransactionSettings,
} from '../types'
import { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES, DEFAULT_INVESTMENT_GROUPS } from '../types'

interface FinanceHeaderProps {
  year: number
  dayData: Record<string, FinanceTransactionData>
  transactionSettings?: TransactionSettings
  onPrevYear: () => void
  onNextYear: () => void
  onUpdateSettings?: (settings: TransactionSettings) => Promise<void>
}

export function FinanceHeader({
  year,
  dayData,
  transactionSettings,
  onPrevYear,
  onNextYear,
  onUpdateSettings,
}: FinanceHeaderProps) {
  const [showTransactionSettings, setShowTransactionSettings] = useState(false)

  // Get settings with defaults
  const settings = transactionSettings || {
    defaultCurrency: '₹' as const,
    expenseCategories: DEFAULT_EXPENSE_CATEGORIES,
    incomeCategories: DEFAULT_INCOME_CATEGORIES,
    investmentGroups: DEFAULT_INVESTMENT_GROUPS,
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
      investments: yearEntries.reduce((sum, [, data]) => {
        return (
          sum +
          (data?.investments?.reduce(
            (s: number, inv: { amount?: number }) => s + (inv.amount || 0),
            0,
          ) || 0)
        )
      }, 0),
    }

    const currency = settings.defaultCurrency

    const actions = []
    
    // Manage Categories/Settings button
    if (onUpdateSettings) {
      actions.push({
        id: 'manage-categories',
        label: 'Categories & Settings',
        icon: '⚙️',
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
        { 
          label: 'Invested', 
          value: `${currency}${yearStats.investments.toLocaleString('en-IN')}` 
        },
      ],
      legends: [
        { label: 'Income', color: 'rgb(74, 222, 128)' },
        { label: 'Expense', color: 'rgb(248, 113, 113)' },
        { label: 'Investment', color: 'rgb(99, 102, 241)' },
      ],
      actions,
    }
  }, [dayData, year, onUpdateSettings, settings.defaultCurrency])

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
