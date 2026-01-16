'use client'

import type { AgendaSummaryData } from '@/types'

interface AgendaSummaryProps {
  data: AgendaSummaryData
}

export function AgendaSummary({ data }: AgendaSummaryProps) {
  const { agendaItems = [], completedCount, totalCount } = data

  if (!data.hasData) {
    return (
      <div className="text-xs text-white/40 italic">
        No agenda items recorded
      </div>
    )
  }

  const completionPercentage = totalCount > 0 
    ? Math.round((completedCount / totalCount) * 100) 
    : 0

  return (
    <div className="space-y-3">
      {/* Completion Summary */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/60">Progress:</span>
          <span className="text-sm font-bold text-purple-400">
            {completedCount}/{totalCount} completed
          </span>
        </div>
        <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-purple-400 transition-all duration-300"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Agenda Items List */}
      <div className="space-y-2">
        <div className="text-xs text-white/60">Items:</div>
        {agendaItems.map((item) => (
          <div key={item.id} className="text-xs">
            <div className="flex items-start gap-2">
              <span className={`mt-0.5 ${item.completed ? 'opacity-50' : ''}`}>
                {item.completed ? '✅' : '⬜'}
              </span>
              <div className="flex-1">
                <div
                  className={`text-white/80 ${
                    item.completed ? 'line-through opacity-60' : ''
                  }`}
                >
                  {item.title}
                </div>
                {item.startTime && item.endTime && (
                  <div className="text-[10px] text-white/40 mt-0.5">
                    🕐 {item.startTime} - {item.endTime}
                  </div>
                )}
                {item.note && (
                  <div className="text-[11px] text-white/50 mt-1">
                    {item.note}
                  </div>
                )}
                {item.subjects && item.subjects.length > 0 && (
                  <div className="text-[10px] text-white/40 mt-1">
                    📚 {item.subjects.join(', ')}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
