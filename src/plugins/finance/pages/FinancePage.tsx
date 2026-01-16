'use client'

import type { PluginPageProps } from '@/sdk'
import { usePluginPage, LoadingState } from '@/sdk'
import { BudgetingView } from '../components'
import type { FinanceTransactionData, FinanceConfig } from '../types'

export default function FinancePage({ context, params, year }: PluginPageProps) {
  const {
    isLoading,
    todayISO,
    pluginDayData,
    pluginConfig,
    initialSelectedDay,
    updateDayData,
    updateConfig,
    navigateToPrevYear,
    navigateToNextYear,
    jumpToDay,
    year: currentYear,
  } = usePluginPage<FinanceTransactionData, FinanceConfig>({
    pluginId: 'finance',
    params,
    year,
  })

  const budgets = pluginConfig?.budgets || []
  const sips = pluginConfig?.sips || []

  const handleSaveBudget = async (budget: any) => {
    const existingBudgets = budgets.filter((b: any) => b.id !== budget.id)
    await updateConfig({
      budgets: [...existingBudgets, budget],
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
        onDeleteBudget={handleDeleteBudget}
        onSaveSIP={handleSaveSIP}
        onDeleteSIP={handleDeleteSIP}
        onJumpToDay={jumpToDay}
      />
    </main>
  )
}
