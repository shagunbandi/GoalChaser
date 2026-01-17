'use client'

import type { ReactNode } from 'react'
import type { PluginDetailProvider } from '@/sdk'
import { NotesField } from '@/sdk'
import type { FinanceTransactionData } from './types'

export class FinanceDetailProviderImpl
  implements PluginDetailProvider<FinanceTransactionData>
{
  renderDetail(
    data: FinanceTransactionData | null,
    date: string,
    onUpdate: (updates: Partial<FinanceTransactionData>) => Promise<void>,
  ): ReactNode {
    const expenses = data?.expenses || []
    const income = data?.income || []
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
    const totalIncome = income.reduce((sum, i) => sum + i.amount, 0)
    const netFlow = totalIncome - totalExpenses

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/30 to-green-500/30 flex items-center justify-center text-xl">
            💰
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white/90">Finance</h3>
            <p className="text-xs text-white/50">
              {expenses.length + income.length} transaction
              {expenses.length + income.length !== 1 ? 's' : ''} today
            </p>
          </div>
        </div>

        {/* Notes */}
        <NotesField
          value={data?.notes || ''}
          onSave={async (notes) => await onUpdate({ notes })}
          label="Finance Notes"
          placeholder="Notes about your finances today..."
          icon="📝"
          accentColor="#10B981"
          resetKey={date}
        />

        {/* Summary Stats */}
        {(totalIncome > 0 || totalExpenses > 0) && (
          <div className="grid grid-cols-3 gap-3">
            <div className="px-3 py-3 rounded-xl bg-white/[0.03] border border-white/5">
              <div className="text-xs text-white/40 mb-1">Income</div>
              <div className="text-sm font-semibold text-emerald-400">
                +${totalIncome.toLocaleString()}
              </div>
            </div>
            <div className="px-3 py-3 rounded-xl bg-white/[0.03] border border-white/5">
              <div className="text-xs text-white/40 mb-1">Expenses</div>
              <div className="text-sm font-semibold text-red-400">
                -${totalExpenses.toLocaleString()}
              </div>
            </div>
            <div className="px-3 py-3 rounded-xl bg-white/[0.03] border border-white/5">
              <div className="text-xs text-white/40 mb-1">Net</div>
              <div
                className={`text-sm font-semibold ${netFlow >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
              >
                {netFlow >= 0 ? '+' : ''}${netFlow.toLocaleString()}
              </div>
            </div>
          </div>
        )}

        {/* Transaction List */}
        {(expenses.length > 0 || income.length > 0) && (
          <div className="space-y-2">
            {income.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20"
              >
                <div>
                  <div className="text-sm text-white/80">{item.description}</div>
                  <div className="text-xs text-white/40">{item.categoryName}</div>
                </div>
                <div className="text-sm font-semibold text-emerald-400">
                  +${item.amount.toLocaleString()}
                </div>
              </div>
            ))}
            {expenses.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20"
              >
                <div>
                  <div className="text-sm text-white/80">{item.description}</div>
                  <div className="text-xs text-white/40">{item.categoryName}</div>
                </div>
                <div className="text-sm font-semibold text-red-400">
                  -${item.amount.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {expenses.length === 0 && income.length === 0 && (
          <div className="text-center text-white/40 py-6">
            <div className="text-3xl mb-2">💸</div>
            <p className="text-sm">No transactions recorded</p>
          </div>
        )}
      </div>
    )
  }
}
