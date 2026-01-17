'use client'

import { useMemo } from 'react'
import { HeaderRenderer } from '@/components/features/year-view/renderers/HeaderRenderer'
import type { FinanceTransactionData } from '../types'

interface FinanceHeaderProps {
  year: number
  dayData: Record<string, FinanceTransactionData>
  onPrevYear: () => void
  onNextYear: () => void
}

export function FinanceHeader({
  year,
  dayData,
  onPrevYear,
  onNextYear,
}: FinanceHeaderProps) {
  const headerConfig = useMemo(() => {
    const yearStats = {
      income: Object.values(dayData).reduce((sum, data) => {
        return (
          sum +
          (data?.income?.reduce(
            (s: number, i: any) => s + (i.amount || 0),
            0,
          ) || 0)
        )
      }, 0),
      expenses: Object.values(dayData).reduce((sum, data) => {
        return (
          sum +
          (data?.expenses?.reduce(
            (s: number, e: any) => s + (e.amount || 0),
            0,
          ) || 0)
        )
      }, 0),
      sips: Object.values(dayData).reduce((sum, data) => {
        return (
          sum +
          (data?.sips?.reduce(
            (s: number, sip: any) => s + (sip.amount || 0),
            0,
          ) || 0)
        )
      }, 0),
    }

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
      actions: [],
    }
  }, [dayData])

  if (!headerConfig) return null

  return (
    <HeaderRenderer
      config={headerConfig}
      year={year}
      onPrevYear={onPrevYear}
      onNextYear={onNextYear}
    />
  )
}
