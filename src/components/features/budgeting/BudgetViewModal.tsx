import type { BudgetPlan, Expense, Income } from '@/types'

interface BudgetViewModalProps {
  budget: BudgetPlan
  expenses: Expense[]
  income: Income[]
  onEdit: () => void
  onClose: () => void
}

export function BudgetViewModal({
  budget,
  expenses,
  income,
  onEdit,
  onClose,
}: BudgetViewModalProps) {
  // Calculate total spent and earned
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0)
  const totalEarned = income.reduce((sum, i) => sum + i.amount, 0)
  const totalBudgeted = budget.categories.reduce(
    (sum, c) => sum + c.allocatedAmount,
    0
  )
  const remaining = budget.income + totalEarned - totalSpent
  const savingsGoal = budget.income - totalBudgeted
  const isOverBudget = totalSpent > totalBudgeted

  // Calculate spending by category
  const categorySpending = budget.categories.map((category) => {
    const spent = expenses
      .filter((e) => e.categoryId === category.id)
      .reduce((sum, e) => sum + e.amount, 0)
    return {
      ...category,
      spent,
      remaining: category.allocatedAmount - spent,
      percentUsed:
        category.allocatedAmount > 0
          ? (spent / category.allocatedAmount) * 100
          : 0,
    }
  })

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-lg">💰</span>
              <h3 className="text-base font-semibold text-white truncate">
                {budget.name}
              </h3>
              {budget.isRecurring && (
                <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 text-[10px] font-medium border border-purple-500/30">
                  Recurring
                </span>
              )}
            </div>
            <div className="mt-1 text-xs text-white/60">
              {new Date(budget.startDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}{' '}
              →{' '}
              {new Date(budget.endDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </div>
            {budget.isRecurring && budget.periodIndex !== undefined && (
              <div className="mt-1 text-xs text-purple-400">
                Period {budget.periodIndex + 1}
              </div>
            )}
          </div>
          <div className="text-right">
            <div
              className={`text-base font-semibold ${
                remaining >= savingsGoal ? 'text-green-400' : 'text-yellow-400'
              }`}
            >
              ₹{remaining.toLocaleString('en-IN')}
            </div>
            <div className="text-xs text-white/60">remaining</div>
          </div>
        </div>
      </div>

      {/* Budget Overview */}
      <div className="space-y-2 text-sm rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="flex justify-between">
          <span className="text-white/60">Income:</span>
          <span className="text-white font-medium">
            ₹{budget.income.toLocaleString('en-IN')}
          </span>
        </div>
        {totalEarned > 0 && (
          <div className="flex justify-between">
            <span className="text-white/60">Additional Income:</span>
            <span className="text-green-400 font-medium">
              +₹{totalEarned.toLocaleString('en-IN')}
            </span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-white/60">Spent:</span>
          <span
            className={
              isOverBudget ? 'text-red-400 font-medium' : 'text-white/80'
            }
          >
            ₹{totalSpent.toLocaleString('en-IN')}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/60">Budgeted:</span>
          <span className="text-white/60">
            ₹{totalBudgeted.toLocaleString('en-IN')}
          </span>
        </div>
        <div className="pt-2 border-t border-white/10 flex justify-between">
          <span className="text-white font-medium">Savings:</span>
          <span
            className={`font-semibold ${
              remaining >= savingsGoal ? 'text-green-400' : 'text-yellow-400'
            }`}
          >
            ₹{remaining.toLocaleString('en-IN')} (
            {budget.income > 0
              ? ((remaining / budget.income) * 100).toFixed(1)
              : '0.0'}
            %)
          </span>
        </div>
      </div>

      {/* Category Breakdown */}
      {categorySpending.length > 0 && (
        <div className="space-y-3">
          <div className="text-sm text-white/70 font-semibold uppercase tracking-wide">
            Category Breakdown
          </div>
          {categorySpending.map((cat) => {
            const isOver = cat.spent > cat.allocatedAmount
            const percentage = cat.percentUsed > 100 ? 100 : cat.percentUsed

            return (
              <div
                key={cat.id}
                className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-sm text-white/80 font-medium truncate">
                      {cat.name}
                    </span>
                    {cat.isFixed && (
                      <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[10px] font-medium">
                        Fixed
                      </span>
                    )}
                  </div>
                  <span className="text-sm whitespace-nowrap ml-2">
                    <span
                      className={`font-semibold ${
                        isOver ? 'text-red-400' : 'text-white'
                      }`}
                    >
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
                  <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 rounded-full ${
                        isOver
                          ? 'bg-gradient-to-r from-red-500 to-red-600'
                          : 'bg-gradient-to-r from-green-500 to-emerald-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span
                    className={`text-xs font-medium min-w-[40px] text-right ${
                      isOver ? 'text-red-400' : 'text-white/60'
                    }`}
                  >
                    {cat.percentUsed.toFixed(0)}%
                  </span>
                </div>

                {isOver ? (
                  <div className="text-xs text-red-400 flex items-center gap-1 bg-red-500/10 rounded px-2 py-1">
                    <span>⚠️</span>
                    <span>
                      Over by ₹
                      {(cat.spent - cat.allocatedAmount).toLocaleString('en-IN')}
                    </span>
                  </div>
                ) : (
                  cat.remaining > 0 && (
                    <div className="text-xs text-green-400 flex items-center gap-1">
                      <span>✓</span>
                      <span>
                        ₹{cat.remaining.toLocaleString('en-IN')} remaining
                      </span>
                    </div>
                  )
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Overall Warning */}
      {isOverBudget && (
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
          <span className="font-semibold">⚠️ Over Budget</span>
          <span className="text-white/60"> by </span>
          <span className="font-semibold">
            ₹{(totalSpent - totalBudgeted).toLocaleString('en-IN')}
          </span>
        </div>
      )}

      {budget.note && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="text-xs text-white/60 font-medium mb-1">Note</div>
          <div className="text-sm text-white/80">{budget.note}</div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={onClose}
          className="flex-1 px-4 py-2.5 rounded-lg text-sm text-white border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
        >
          Close
        </button>
        <button
          onClick={onEdit}
          className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 transition-all"
        >
          Edit Budget
        </button>
      </div>
    </div>
  )
}
