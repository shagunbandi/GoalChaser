'use client'

import { PluginMonthView } from '@/sdk'
import type { DayCustomization } from '@/sdk'
import type { FinanceTransactionData } from '../types'

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
    updates: Partial<FinanceTransactionData>,
  ) => Promise<void>
  onBackToYear: () => void
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
}: FinanceMonthViewProps) {
  // Build day customizations based on financial activity
  const buildDayCustomization = (
    date: string,
    data: FinanceTransactionData | null,
  ): DayCustomization | null => {
    if (!data) return null

    const hasExpenses = data.expenses && data.expenses.length > 0
    const hasIncome = data.income && data.income.length > 0

    if (!hasExpenses && !hasIncome) return null

    // Calculate totals
    const totalExpenses =
      data.expenses?.reduce((sum: number, e) => sum + (e.amount || 0), 0) || 0
    const totalIncome =
      data.income?.reduce((sum: number, i) => sum + (i.amount || 0), 0) || 0
    const totalSIP = 0 // SIP is stored in config, not day data

    const netAmount = totalIncome - totalExpenses - totalSIP

    // Color based on net: positive (green), negative (red), neutral (orange)
    const getFinanceColor = () => {
      if (netAmount > 0) return { bg: 'bg-green-500/20', color: '#00FF00' }
      if (netAmount < 0) return { bg: 'bg-red-500/20', color: '#FF6B6B' }
      return { bg: 'bg-orange-500/20', color: '#FFA500' }
    }

    const { bg, color } = getFinanceColor()

    const indicators = []
    if (hasExpenses) {
      indicators.push({
        id: 'expense',
        label: `₹${totalExpenses.toFixed(0)} expense`,
        color: '#FF6B6B',
      })
    }
    if (hasIncome) {
      indicators.push({
        id: 'income',
        label: `₹${totalIncome.toFixed(0)} income`,
        color: '#00FF00',
      })
    }

    return {
      backgroundColor: bg,
      content: (
        <div className="text-[10px] text-white/60 mt-1">
          {netAmount >= 0 ? '+' : ''}₹{netAmount.toFixed(0)}
        </div>
      ),
      indicators,
    }
  }

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
    />
  )
}
