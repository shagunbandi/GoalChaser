'use client'

import type { PluginPageProps } from '@/sdk'
import { usePluginPage, LoadingState } from '@/sdk'
import { BudgetingView, FinanceMonthView } from '../components'
import type { FinanceTransactionData, FinanceConfig } from '../types'
import { FinancePlugin } from '../plugin'

export default function FinancePage({
  context,
  params,
  year,
  month,
}: PluginPageProps) {
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
    jumpToDay,
    router,
    year: currentYear,
  } = usePluginPage<FinanceTransactionData, FinanceConfig>({
    pluginId: 'finance',
    params,
    year,
  })
  
  // Handler to navigate to month view with selected day
  const handleJumpToDay = (iso: string) => {
    const [y, m] = iso.split('-').map(Number)
    navigateToMonth(y, m, iso)
  }

  const budgets = pluginConfig?.budgets || []
  const sips = pluginConfig?.sips || []

  const handleSaveBudget = async (budget: any) => {
    const existingBudgets = budgets.filter((b: any) => b.id !== budget.id)
    await updateConfig({
      budgets: [...existingBudgets, budget],
      sips,
    })
  }

  const handleSaveBudgets = async (newBudgets: any[]) => {
    // Filter out any budgets with IDs that match the new budgets
    const newBudgetIds = new Set(newBudgets.map(b => b.id))
    const existingBudgets = budgets.filter((b: any) => !newBudgetIds.has(b.id))
    await updateConfig({
      budgets: [...existingBudgets, ...newBudgets],
      sips,
    })
  }

  const handleDeleteBudget = async (budgetId: string) => {
    await updateConfig({
      budgets: budgets.filter((b: any) => b.id !== budgetId),
      sips,
    })
  }

  const handleSaveSIP = async (sip: any) => {
    const existingSips = sips.filter((s: any) => s.id !== sip.id)
    await updateConfig({ budgets, sips: [...existingSips, sip] })
  }

  const handleDeleteSIP = async (sipId: string) => {
    await updateConfig({
      budgets,
      sips: sips.filter((s: any) => s.id !== sipId),
    })
  }

  if (isLoading) return <LoadingState />

  // If month is specified, show month view
  if (month) {
    // Calculate month-specific stats
    const monthData = Object.entries(pluginDayData).filter(([date]) => {
      const [y, m] = date.split('-').map(Number)
      return y === currentYear && m === month
    })
    const monthStats = {
      income: monthData.reduce((sum, [, data]) => {
        return sum + (data?.income?.reduce((s: number, i: any) => s + (i.amount || 0), 0) || 0)
      }, 0),
      expenses: monthData.reduce((sum, [, data]) => {
        return sum + (data?.expenses?.reduce((s: number, e: any) => s + (e.amount || 0), 0) || 0)
      }, 0),
      sips: monthData.reduce((sum, [, data]) => {
        return sum + (data?.sips?.reduce((s: number, sip: any) => s + (sip.amount || 0), 0) || 0)
      }, 0),
    }

    const monthHeaderConfig = {
      icon: '💰',
      title: `Finance Month:`,
      stats: [
        { label: 'Income', value: `₹${monthStats.income.toLocaleString('en-IN')}` },
        { label: 'Expenses', value: `₹${monthStats.expenses.toLocaleString('en-IN')}` },
        { label: 'SIP', value: `₹${monthStats.sips.toLocaleString('en-IN')}` },
      ],
      legends: [
        { label: 'Income', color: 'rgb(74, 222, 128)' },
        { label: 'Expense', color: 'rgb(248, 113, 113)' },
        { label: 'SIP', color: 'rgb(96, 165, 250)' },
      ],
      actions: [],
    }

    return (
      <main className="container mx-auto px-4 py-6 space-y-4">
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
          headerConfig={monthHeaderConfig}
          onPrevYear={navigateToPrevYear}
          onNextYear={navigateToNextYear}
        />
      </main>
    )
  }

  // Otherwise show year view
  return (
    <main className="container mx-auto px-4 py-6">
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
    </main>
  )
}
