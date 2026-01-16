'use client'

interface AgendaStatsProps {
  totalItems: number
  completedItems: number
  recurringItems: number
  completionPercentage: number
}

export function AgendaStats({
  totalItems,
  completedItems,
  recurringItems,
  completionPercentage,
}: AgendaStatsProps) {
  if (totalItems === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-white/40 text-sm">
          No agenda items found for this year with current filters
        </p>
      </div>
    )
  }

  const pendingItems = totalItems - completedItems
  const oneTimeItems = totalItems - recurringItems

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/5 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-white">{totalItems}</div>
          <div className="text-xs text-white/60 mt-1">Total Items</div>
        </div>

        <div className="bg-green-500/10 rounded-lg p-4 text-center border border-green-500/20">
          <div className="text-2xl font-bold text-green-400">
            {completedItems}
          </div>
          <div className="text-xs text-white/60 mt-1">Completed</div>
        </div>

        <div className="bg-yellow-500/10 rounded-lg p-4 text-center border border-yellow-500/20">
          <div className="text-2xl font-bold text-yellow-400">
            {pendingItems}
          </div>
          <div className="text-xs text-white/60 mt-1">Pending</div>
        </div>

        <div className="bg-purple-500/10 rounded-lg p-4 text-center border border-purple-500/20">
          <div className="text-2xl font-bold text-purple-400">
            {completionPercentage}%
          </div>
          <div className="text-xs text-white/60 mt-1">Complete</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-white/70">Overall Progress</span>
          <span className="text-white font-semibold">
            {completedItems} / {totalItems}
          </span>
        </div>
        <div className="w-full bg-white/5 rounded-full h-3 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-300"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Item Types Breakdown */}
      <div className="grid grid-cols-2 gap-4 pt-2">
        <div className="bg-white/5 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/70">Recurring</span>
            <span className="text-lg font-bold text-blue-400">
              {recurringItems}
            </span>
          </div>
        </div>

        <div className="bg-white/5 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/70">One-time</span>
            <span className="text-lg font-bold text-white">
              {oneTimeItems}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
