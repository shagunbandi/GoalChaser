'use client'

import type { FinanceSummaryData } from '@/types'

interface FinanceSummaryProps {
  data: FinanceSummaryData
}

export function FinanceSummary({ data }: FinanceSummaryProps) {
  const { expenses = [], income = [], totalExpenses, totalIncome, netAmount } = data

  if (!data.hasData) {
    return (
      <div className="text-xs text-white/40 italic">
        No financial data recorded
      </div>
    )
  }

  const formatAmount = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`
  }

  return (
    <div className="space-y-3">
      {/* Net Amount Summary */}
      <div className="flex items-center justify-between p-2 rounded-lg bg-white/5">
        <span className="text-xs text-white/60">Net:</span>
        <span
          className={`text-sm font-bold ${
            netAmount >= 0 ? 'text-green-400' : 'text-red-400'
          }`}
        >
          {netAmount >= 0 ? '+' : ''}
          {formatAmount(netAmount)}
        </span>
      </div>

      {/* Expenses */}
      {expenses.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/60">Expenses:</span>
            <span className="text-xs text-red-400 font-semibold">
              -{formatAmount(totalExpenses)}
            </span>
          </div>
          <div className="space-y-1.5">
            {expenses.map((expense) => (
              <div key={expense.id} className="text-xs">
                <div className="flex justify-between items-start">
                  <span className="text-white/70 flex-1 truncate">
                    💸 {expense.categoryName}
                  </span>
                  <span className="text-red-400 ml-2">
                    {formatAmount(expense.amount)}
                  </span>
                </div>
                {expense.description && (
                  <div className="text-[10px] text-white/40 ml-4 mt-0.5">
                    {expense.description}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Income */}
      {income.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/60">Income:</span>
            <span className="text-xs text-green-400 font-semibold">
              +{formatAmount(totalIncome)}
            </span>
          </div>
          <div className="space-y-1.5">
            {income.map((inc) => (
              <div key={inc.id} className="text-xs">
                <div className="flex justify-between items-start">
                  <span className="text-white/70 flex-1 truncate">
                    💰 {inc.categoryName}
                  </span>
                  <span className="text-green-400 ml-2">
                    {formatAmount(inc.amount)}
                  </span>
                </div>
                {inc.description && (
                  <div className="text-[10px] text-white/40 ml-4 mt-0.5">
                    {inc.description}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
