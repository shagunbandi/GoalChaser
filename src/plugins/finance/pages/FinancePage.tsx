'use client'
import { useState } from 'react'
import type { PluginPageProps } from '@/sdk'
import { BudgetingView } from '../components'
import { useGoalData } from '@/hooks/useGoalData'
import { toISODateString } from '@/utils'

export default function FinancePage({
  context,
  params,
  year: initialYear,
}: PluginPageProps) {
  const [year, setYear] = useState(initialYear || new Date().getFullYear())
  const {
    pluginData,
    pluginConfigs,
    isLoading,
    handleUpdateData,
    updateConfig,
  } = useGoalData(context.goalId, year)

  // Extract finance-specific data
  const financeData = pluginData?.['finance'] || {}
  const budgets = (pluginConfigs?.['finance'] as any)?.budgets || []
  const sips = (pluginConfigs?.['finance'] as any)?.sips || []

  // Wrapper functions for finance-specific updates
  const handleUpdateDetails = async (iso: string, updates: any) => {
    await handleUpdateData('finance', iso, updates)
  }

  const handleSaveBudget = async (budget: any) => {
    const existingBudgets = budgets.filter((b: any) => b.id !== budget.id)
    await updateConfig('finance', {
      budgets: [...existingBudgets, budget],
      sips,
    })
  }

  const handleDeleteBudget = async (budgetId: string) => {
    await updateConfig('finance', {
      budgets: budgets.filter((b: any) => b.id !== budgetId),
      sips,
    })
  }

  const handleSaveSIP = async (sip: any) => {
    const existingSips = sips.filter((s: any) => s.id !== sip.id)
    await updateConfig('finance', { budgets, sips: [...existingSips, sip] })
  }

  const handleDeleteSIP = async (sipId: string) => {
    await updateConfig('finance', {
      budgets,
      sips: sips.filter((s: any) => s.id !== sipId),
    })
  }

  const todayISO = toISODateString(new Date())

  if (isLoading) {
    return (
      <main className="container mx-auto px-4 py-6">
        <div className="text-white/60">Loading...</div>
      </main>
    )
  }

  return (
    <main className="container mx-auto px-4 py-6">
      <BudgetingView
        year={year}
        todayISO={todayISO}
        dayDetails={financeData}
        budgets={budgets || []}
        sips={sips || []}
        onPrevYear={() => setYear(year - 1)}
        onNextYear={() => setYear(year + 1)}
        onUpdateDay={handleUpdateDetails}
        onSaveBudget={handleSaveBudget}
        onDeleteBudget={handleDeleteBudget}
        onSaveSIP={handleSaveSIP}
        onDeleteSIP={handleDeleteSIP}
      />
    </main>
  )
}
