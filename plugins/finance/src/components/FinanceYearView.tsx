'use client'

import { useMemo, useCallback } from 'react'
import type { FinanceTransactionData, TransactionSettings } from '../types'
import { computeMonthInfo } from '@goal-chaser/sdk'
import { GenericYearView } from '@goal-chaser/sdk'
import type { YearViewConfig } from '@goal-chaser/sdk'
import { formatCurrency, calculateMonthlyTotals } from '../utils/recurring-utils'

interface FinanceYearViewProps {
  year: number
  todayISO: string
  dayData: Record<string, FinanceTransactionData>
  transactionSettings: TransactionSettings
  initialSelectedDay?: string | null
  onPrevYear: () => void
  onNextYear: () => void
  onJumpToDay?: (iso: string) => void
  onMonthClick?: (year: number, month: number) => void
}

export function FinanceYearView({
  year,
  todayISO,
  dayData,
  transactionSettings,
  initialSelectedDay,
  onPrevYear,
  onNextYear,
  onJumpToDay,
  onMonthClick,
}: FinanceYearViewProps) {
  const months = useMemo(
    () => Array.from({ length: 12 }, (_, i) => computeMonthInfo(year, i + 1)),
    [year],
  )

  // Check what's on a day
  const getDayInfo = (iso: string) => {
    const details = dayData[iso] || {}
    const hasExpense = (details.expenses?.length || 0) > 0
    const hasIncome = (details.income?.length || 0) > 0
    const hasInvestment = (details.investments?.length || 0) > 0
    return { hasExpense, hasIncome, hasInvestment }
  }

  // Handle day select
  const handleDaySelect = useCallback((date: string | null) => {
    if (date && onJumpToDay) {
      onJumpToDay(date)
    }
  }, [onJumpToDay])

  // Build year view configuration
  const config: YearViewConfig = useMemo(
    () => ({
      year,
      todayISO,
      onDaySelect: handleDaySelect,
      showDayModal: false,
      header: undefined,
      months: months.map((month) => {
        const monthTotals = calculateMonthlyTotals(dayData, year, month.month)

        return {
          month: month.month,
          year: month.year,
          onHeaderClick: () => onMonthClick?.(month.year, month.month),
          headerRight: (monthTotals.totalIncome > 0 || monthTotals.totalExpenses > 0 || monthTotals.totalInvestments > 0) ? (
            <div className="flex items-center gap-3 text-xs">
              <span className="text-emerald-400">+{formatCurrency(monthTotals.totalIncome, transactionSettings.defaultCurrency)}</span>
              <span className="text-red-400">-{formatCurrency(monthTotals.totalExpenses, transactionSettings.defaultCurrency)}</span>
              <span className="text-indigo-400">-{formatCurrency(monthTotals.totalInvestments, transactionSettings.defaultCurrency)}</span>
              <span className={monthTotals.net >= 0 ? 'text-emerald-400 font-semibold' : 'text-red-400 font-semibold'}>
                = {monthTotals.net >= 0 ? '+' : ''}{formatCurrency(monthTotals.net, transactionSettings.defaultCurrency)}
              </span>
            </div>
          ) : null,
          days: month.days.map((day) => {
            const info = getDayInfo(day.iso)
            const indicators = []
            if (info.hasIncome) indicators.push({ type: 'income', color: 'rgb(34,197,94)' })
            if (info.hasInvestment) indicators.push({ type: 'investment', color: 'rgb(59,130,246)' })
            if (info.hasExpense) indicators.push({ type: 'expense', color: 'rgb(239,68,68)' })

            return {
              iso: day.iso,
              dayOfMonth: day.dayOfMonth,
              weekdayIndex: day.weekdayIndex,
              indicators,
            }
          }),
          footer: [],
        }
      }),
      modal: {
        getSections: (date: string) => {
          const details = dayData[date] || {}
          const expenses = details.expenses || []
          const income = details.income || []
          const investments = details.investments || []

          const sections = []

          // Summary of day activity
          if (expenses.length > 0 || income.length > 0 || investments.length > 0) {
            const dayExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
            const dayIncome = income.reduce((sum, i) => sum + i.amount, 0)
            const dayInvestments = investments.reduce((sum, inv) => sum + inv.amount, 0)
            const currency = transactionSettings.defaultCurrency
            
            sections.push({
              id: 'day-summary',
              type: 'custom' as const,
              content: (
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <h4 className="text-xs font-semibold text-white/60 uppercase tracking-wide mb-3">
                    Day Summary
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center">
                      <div className="text-emerald-400 text-sm font-semibold">
                        +{currency}{dayIncome.toLocaleString('en-IN')}
                      </div>
                      <div className="text-[10px] text-white/40">Income ({income.length})</div>
                    </div>
                    <div className="text-center">
                      <div className="text-red-400 text-sm font-semibold">
                        -{currency}{dayExpenses.toLocaleString('en-IN')}
                      </div>
                      <div className="text-[10px] text-white/40">Expenses ({expenses.length})</div>
                    </div>
                    <div className="text-center">
                      <div className="text-indigo-400 text-sm font-semibold">
                        -{currency}{dayInvestments.toLocaleString('en-IN')}
                      </div>
                      <div className="text-[10px] text-white/40">Invested ({investments.length})</div>
                    </div>
                  </div>
                </div>
              ),
            })
          }

          // No data message
          if (expenses.length === 0 && income.length === 0 && investments.length === 0) {
            sections.push({
              id: 'no-data',
              type: 'custom' as const,
              content: (
                <p className="text-sm text-white/40 text-center py-4">
                  No financial activity for this day
                </p>
              ),
            })
          }

          return sections
        },
        getActions: (date: string) => {
          const actions = []

          if (onJumpToDay) {
            actions.push({
              id: 'open-day',
              label: 'Open Day View',
              onClick: () => onJumpToDay(date),
              color: 'primary' as const,
            })
          }

          return actions
        },
      },
      onPrevYear,
      onNextYear,
      onMonthClick,
    }),
    [
      year,
      todayISO,
      months,
      dayData,
      transactionSettings,
      onPrevYear,
      onNextYear,
      onMonthClick,
      onJumpToDay,
      handleDaySelect,
    ],
  )

  return (
    <GenericYearView
      config={config}
      initialSelectedDay={initialSelectedDay}
    />
  )
}
