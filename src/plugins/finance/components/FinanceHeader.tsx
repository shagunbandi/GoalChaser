'use client'

import { useMemo, useState } from 'react'
import { HeaderRenderer } from '@/components/features/year-view/renderers/HeaderRenderer'
import { FinanceManager } from './FinanceManager'
import type { FinanceTransactionData, BudgetPlan, SIPPlan } from '../types'

interface FinanceHeaderProps {
  year: number
  dayData: Record<string, FinanceTransactionData>
  budgets?: BudgetPlan[]
  sips?: SIPPlan[]
  onPrevYear: () => void
  onNextYear: () => void
  onSaveBudget?: (budget: BudgetPlan) => Promise<void>
  onSaveBudgets?: (budgets: BudgetPlan[]) => Promise<void>
  onDeleteBudget?: (budgetId: string) => Promise<void>
  onSaveSIP?: (sip: SIPPlan) => Promise<void>
  onDeleteSIP?: (sipId: string) => Promise<void>
}

export function FinanceHeader({
  year,
  dayData,
  budgets = [],
  sips = [],
  onPrevYear,
  onNextYear,
  onSaveBudget,
  onSaveBudgets,
  onDeleteBudget,
  onSaveSIP,
  onDeleteSIP,
}: FinanceHeaderProps) {
  const [showFinanceManager, setShowFinanceManager] = useState(false)

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

    return {
      icon: '💰',
      title: `Finance Year:`,
      stats: [
        {
          label: 'Income',
          value: `₹${yearStats.income.toLocaleString('en-IN')}`,
        },
        {
          label: 'Expenses',
          value: `₹${yearStats.expenses.toLocaleString('en-IN')}`,
        },
        { label: 'SIP', value: `₹${yearStats.sips.toLocaleString('en-IN')}` },
      ],
      legends: [
        { label: 'Income', color: 'rgb(74, 222, 128)' },
        { label: 'Expense', color: 'rgb(248, 113, 113)' },
        { label: 'SIP', color: 'rgb(96, 165, 250)' },
      ],
      actions: hasActions
        ? [
            {
              id: 'manage-finance',
              label: 'Manage Finance',
              icon: '⚙️',
              onClick: () => setShowFinanceManager(true),
            },
          ]
        : [],
    }
  }, [dayData, year, onSaveBudget, onSaveSIP])

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
    </>
  )
}
