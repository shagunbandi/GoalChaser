'use client'

import { useMemo, useState } from 'react'
import { HeaderRenderer } from '@/components/features/year-view/renderers/HeaderRenderer'
import { Modal } from '@/components/ui'
import { BudgetForm } from './BudgetForm'
import { SIPForm } from './SIPForm'
import type { FinanceTransactionData, BudgetPlan, SIPPlan, BudgetCategory, SIPFrequency } from '../types'

// Form data types matching what the forms submit
interface BudgetFormData {
  name: string
  income: number
  categories: BudgetCategory[]
  startMonth: number
  startYear: number
  repeatCount: number
  note: string
}

interface SIPFormData {
  name: string
  amount: number
  frequency: SIPFrequency
  startDate: string
  endDate: string
  expectedReturn?: number
  color: string
  note: string
}

interface FinanceHeaderProps {
  year: number
  dayData: Record<string, FinanceTransactionData>
  budgets?: BudgetPlan[]
  sips?: SIPPlan[]
  onPrevYear: () => void
  onNextYear: () => void
  onSaveBudget?: (budget: BudgetPlan) => Promise<void>
  onSaveBudgets?: (budgets: BudgetPlan[]) => Promise<void>
  onSaveSIP?: (sip: SIPPlan) => Promise<void>
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
  onSaveSIP,
}: FinanceHeaderProps) {
  const [showAddBudget, setShowAddBudget] = useState(false)
  const [showAddSIP, setShowAddSIP] = useState(false)

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
            (s: number, i: any) => s + (i.amount || 0),
            0,
          ) || 0)
        )
      }, 0),
      expenses: yearEntries.reduce((sum, [, data]) => {
        return (
          sum +
          (data?.expenses?.reduce(
            (s: number, e: any) => s + (e.amount || 0),
            0,
          ) || 0)
        )
      }, 0),
      sips: yearEntries.reduce((sum, [, data]) => {
        return (
          sum +
          (data?.sips?.reduce(
            (s: number, sip: any) => s + (sip.amount || 0),
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
              id: 'add-sip',
              label: '+ SIP',
              onClick: () => setShowAddSIP(true),
              color: 'info' as const,
            },
            {
              id: 'add-budget',
              label: '+ Budget Plan',
              onClick: () => setShowAddBudget(true),
              color: 'success' as const,
            },
          ]
        : [],
    }
  }, [dayData, year, onSaveBudget, onSaveSIP])

  const handleSaveBudget = async (data: BudgetFormData) => {
    if (!onSaveBudget) {
      setShowAddBudget(false)
      return
    }

    // Generate monthly budgets
    let currentMonth = data.startMonth
    let currentYear = data.startYear
    const parentId = `budget_${Date.now()}`

    const newBudgets: BudgetPlan[] = []
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

    for (let i = 0; i < data.repeatCount; i++) {
      const monthIndex = currentMonth + 1
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()

      const startDateISO = `${currentYear}-${String(monthIndex).padStart(2, '0')}-01`
      const endDateISO = `${currentYear}-${String(monthIndex).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`

      const budgetName = data.repeatCount > 1
        ? `${data.name} - ${monthNames[currentMonth]} ${currentYear}`
        : data.name

      const period: BudgetPlan = {
        id: `${parentId}_${i}`,
        name: budgetName,
        income: data.income,
        categories: data.categories.map((c: BudgetCategory) => ({ ...c })),
        startDate: startDateISO,
        endDate: endDateISO,
        note: data.note,
        isRecurring: data.repeatCount > 1,
        frequency: 'monthly',
        startDay: 1,
        parentBudgetId: data.repeatCount > 1 ? parentId : undefined,
        periodIndex: i,
      }

      newBudgets.push(period)

      currentMonth++
      if (currentMonth > 11) {
        currentMonth = 0
        currentYear++
      }
    }

    // Save all budgets
    if (onSaveBudgets && newBudgets.length > 1) {
      await onSaveBudgets(newBudgets)
    } else if (newBudgets.length === 1) {
      await onSaveBudget(newBudgets[0])
    } else {
      for (const budget of newBudgets) {
        await onSaveBudget(budget)
      }
    }

    setShowAddBudget(false)
  }

  const handleSaveSIP = async (data: SIPFormData) => {
    if (onSaveSIP) {
      const sip: SIPPlan = {
        id: `sip_${Date.now()}`,
        ...data,
        completedDates: [],
      }
      await onSaveSIP(sip)
    }
    setShowAddSIP(false)
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

      {/* Add Budget Modal */}
      <Modal
        open={showAddBudget}
        onClose={() => setShowAddBudget(false)}
        title="Add Budget Plan"
      >
        <BudgetForm
          onSubmit={handleSaveBudget}
          onCancel={() => setShowAddBudget(false)}
        />
      </Modal>

      {/* Add SIP Modal */}
      <Modal
        open={showAddSIP}
        onClose={() => setShowAddSIP(false)}
        title="Add SIP"
      >
        <SIPForm
          onSubmit={handleSaveSIP}
          onCancel={() => setShowAddSIP(false)}
        />
      </Modal>
    </>
  )
}
