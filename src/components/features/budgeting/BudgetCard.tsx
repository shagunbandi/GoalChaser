import type { BudgetPlan, Expense } from '@/types'
import { formatShortDate } from '@/utils'

interface BudgetCardProps {
  budget: BudgetPlan & { days?: string[] }
  expenses: Expense[] // All expenses for this budget
  onRemove?: (type: 'single' | 'all') => void
  onUpdateFromNow?: () => void
}

export function BudgetCard({ budget, expenses, onRemove, onUpdateFromNow }: BudgetCardProps) {
  // Calculate total spent
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0)
  const totalBudgeted = budget.categories.reduce(
    (sum, c) => sum + c.allocatedAmount,
    0
  )
  const remaining = budget.income - totalSpent
  const savingsGoal = budget.income - totalBudgeted
  
  // Calculate spending by category
  const categorySpending = budget.categories.map((category) => {
    const spent = expenses
      .filter((e) => e.categoryId === category.id)
      .reduce((sum, e) => sum + e.amount, 0)
    return {
      ...category,
      spent,
      remaining: category.allocatedAmount - spent,
      percentUsed: category.allocatedAmount > 0 
        ? (spent / category.allocatedAmount) * 100 
        : 0,
    }
  })

  const isOverBudget = totalSpent > totalBudgeted
  const savingsRate = budget.income > 0 
    ? ((remaining / budget.income) * 100).toFixed(1) 
    : '0.0'

  return (
    <div className="group w-full rounded-xl border border-white/10 bg-white/5 p-4 transition-all hover:border-white/20 hover:bg-white/8">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-lg">💰</span>
            <h3 className="text-sm font-semibold text-white truncate">
              {budget.name}
            </h3>
            {budget.isRecurring && (
              <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 text-[10px] font-medium border border-purple-500/30">
                Recurring
              </span>
            )}
          </div>
          <div className="mt-1 text-xs text-white/60">
            {formatShortDate(budget.startDate)} → {formatShortDate(budget.endDate)}
          </div>
          {budget.isRecurring && budget.periodIndex !== undefined && (
            <div className="mt-1 text-xs text-purple-400">
              Period {budget.periodIndex + 1}
            </div>
          )}
        </div>
        <div className="text-right">
          <div className={`text-sm font-semibold ${
            remaining >= savingsGoal ? 'text-green-400' : 'text-yellow-400'
          }`}>
            ₹{remaining.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-white/60">remaining</div>
        </div>
      </div>

      {/* Budget Overview */}
      <div className="space-y-1.5 text-xs mb-4">
        <div className="flex justify-between">
          <span className="text-white/60">Income:</span>
          <span className="text-white font-medium">
            ₹{budget.income.toLocaleString('en-IN')}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/60">Spent:</span>
          <span className={isOverBudget ? 'text-red-400 font-medium' : 'text-white/80'}>
            ₹{totalSpent.toLocaleString('en-IN')}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/60">Budgeted:</span>
          <span className="text-white/60">
            ₹{totalBudgeted.toLocaleString('en-IN')}
          </span>
        </div>
        <div className="pt-1.5 border-t border-white/10 flex justify-between">
          <span className="text-white font-medium">Savings:</span>
          <span className={`font-semibold ${
            remaining >= savingsGoal ? 'text-green-400' : 'text-yellow-400'
          }`}>
            ₹{remaining.toLocaleString('en-IN')} ({savingsRate}%)
          </span>
        </div>
      </div>

      {/* Category Breakdown - ALWAYS VISIBLE */}
      {categorySpending.length > 0 && (
        <div className="space-y-3 pb-3 border-b border-white/10">
          <div className="text-xs text-white/70 font-semibold uppercase tracking-wide">By Category:</div>
          {categorySpending.map((cat) => {
            const isOver = cat.spent > cat.allocatedAmount
            const percentage = cat.percentUsed > 100 ? 100 : cat.percentUsed

            return (
              <div key={cat.id} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-xs text-white/80 font-medium truncate">
                      {cat.name}
                    </span>
                  </div>
                  <span className="text-xs whitespace-nowrap ml-2">
                    <span className={`font-semibold ${isOver ? 'text-red-400' : 'text-white'}`}>
                      ₹{cat.spent.toLocaleString('en-IN')}
                    </span>
                    <span className="text-white/40"> / </span>
                    <span className="text-white/60">
                      ₹{cat.allocatedAmount.toLocaleString('en-IN')}
                    </span>
                  </span>
                </div>
                
                {/* Progress Bar */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 rounded-full ${
                        isOver 
                          ? 'bg-gradient-to-r from-red-500 to-red-600' 
                          : 'bg-gradient-to-r from-green-500 to-emerald-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className={`text-[10px] font-medium min-w-[35px] text-right ${
                    isOver ? 'text-red-400' : 'text-white/60'
                  }`}>
                    {cat.percentUsed.toFixed(0)}%
                  </span>
                </div>

                {isOver && (
                  <div className="text-[10px] text-red-400 flex items-center gap-1">
                    <span>⚠️</span>
                    <span>Over by ₹{(cat.spent - cat.allocatedAmount).toLocaleString('en-IN')}</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Overall Warning */}
      {isOverBudget && (
        <div className="mt-3 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          <span className="font-semibold">⚠️ Over Budget</span>
          <span className="text-white/60"> by </span>
          <span className="font-semibold">₹{(totalSpent - totalBudgeted).toLocaleString('en-IN')}</span>
        </div>
      )}

      {/* Action Buttons */}
      {(onRemove || onUpdateFromNow) && (
        <div className="mt-3 pt-3 border-t border-white/10">
          {budget.isRecurring ? (
            <div className="space-y-2">
              {onUpdateFromNow && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onUpdateFromNow()
                  }}
                  className="w-full px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 hover:border-blue-500/30 transition-all"
                >
                  Update from Now (7 months)
                </button>
              )}
              {onRemove && (
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (confirm(`Delete ${budget.name}?`)) {
                        onRemove('single')
                      }
                    }}
                    className="flex-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/30 transition-all"
                  >
                    Delete This Month
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (confirm(`Delete all recurring periods of ${budget.name}?`)) {
                        onRemove('all')
                      }
                    }}
                    className="flex-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-600/10 text-red-300 border border-red-600/20 hover:bg-red-600/20 hover:border-red-600/30 transition-all"
                  >
                    Delete All
                  </button>
                </div>
              )}
            </div>
          ) : (
            onRemove && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  if (confirm(`Delete ${budget.name}?`)) {
                    onRemove('single')
                  }
                }}
                className="w-full px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/30 transition-all"
              >
                Delete Budget
              </button>
            )
          )}
        </div>
      )}
    </div>
  )
}
