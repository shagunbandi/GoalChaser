'use client'

import type { PluginPageProps } from '@/sdk'
import { usePluginPage, LoadingState, NotFoundState } from '@/sdk'
import { FinanceHeader, BudgetingView, FinanceMonthView } from '../components'
import type { FinanceTransactionData, FinanceConfig } from '../types'
import { FinancePlugin } from '../plugin'

export default function FinancePage({
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
    year: currentYear,
  } = usePluginPage<FinanceTransactionData, FinanceConfig>({
    pluginId: 'finance',
    params,
    year,
  })

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
    const newBudgetIds = new Set(newBudgets.map((b) => b.id))
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

  // Check if we have any data yet (for initial load vs navigation)
  const hasData = Object.keys(pluginDayData).length > 0 || pluginConfig !== null

  // Only show full-page loading on TRUE initial load (no goal AND no cached data)
  // This prevents the header from disappearing during navigation
  if (!goal && isLoading && !hasData) return <LoadingState />
  if (!goal && !isLoading) return <NotFoundState />

  // Content loading indicator (shown inline when switching years)
  const ContentLoader = () => (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-[#007AFF] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header - ALWAYS rendered, never unmounted */}
      <FinanceHeader
        year={currentYear}
        dayData={pluginDayData}
        budgets={budgets}
        sips={sips}
        onPrevYear={navigateToPrevYear}
        onNextYear={navigateToNextYear}
        onSaveBudget={handleSaveBudget}
        onSaveBudgets={handleSaveBudgets}
        onDeleteBudget={handleDeleteBudget}
        onSaveSIP={handleSaveSIP}
        onDeleteSIP={handleDeleteSIP}
      />

      {/* Content - shows inline loader when switching years */}
      {isLoading && !hasData ? (
        <ContentLoader />
      ) : month ? (
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
        />
      ) : (
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
      )}
    </div>
  )
}
