'use client'

import type { DayStatus } from '@/types'
import { getScoreCategory, getScoreLabel } from '@/lib/scoreUtils'

interface StatusSelectorProps {
  value: DayStatus
  onChange: (status: DayStatus) => void
}

export function StatusSelector({ value, onChange }: StatusSelectorProps) {
  const getButtonStyle = (score: number) => {
    const isSelected = value === score
    const category = getScoreCategory(score)

    if (isSelected) {
      switch (category) {
        case 'high':
          return 'bg-green-500 border-green-500 text-white ring-2 ring-green-400 ring-offset-2 ring-offset-slate-900'
        case 'ok':
          return 'bg-yellow-400 border-yellow-400 text-slate-900 ring-2 ring-yellow-400 ring-offset-2 ring-offset-slate-900'
        case 'low':
          return 'bg-red-500 border-red-500 text-white ring-2 ring-red-400 ring-offset-2 ring-offset-slate-900'
      }
    }

    switch (category) {
      case 'high':
        return 'bg-white/5 border-green-500/30 text-slate-300 hover:bg-green-500/20'
      case 'ok':
        return 'bg-white/5 border-yellow-500/30 text-slate-300 hover:bg-yellow-500/20'
      case 'low':
        return 'bg-white/5 border-red-500/30 text-slate-300 hover:bg-red-500/20'
      default:
        return 'bg-white/5 border-white/20 text-slate-300'
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-slate-300">
          Productivity Score
        </label>
        {value !== null && (
          <div className="flex items-center gap-2">
            <span
              className={`text-2xl font-bold ${
                value >= 7
                  ? 'text-green-400'
                  : value >= 4
                  ? 'text-yellow-400'
                  : 'text-red-400'
              }`}
            >
              {value}/10
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                value >= 7
                  ? 'bg-green-500/20 text-green-400'
                  : value >= 4
                  ? 'bg-yellow-500/20 text-yellow-400'
                  : 'bg-red-500/20 text-red-400'
              }`}
            >
              {getScoreLabel(value)}
            </span>
          </div>
        )}
      </div>

      {/* Score legend */}
      <div className="flex justify-between text-xs text-slate-500 px-1">
        <span>🔴 Low (1-3)</span>
        <span>🟡 OK (4-6)</span>
        <span>🟢 High (7-10)</span>
      </div>

      {/* Score buttons */}
      <div className="grid grid-cols-10 gap-1.5">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
          <button
            key={score}
            onClick={() => onChange(value === score ? null : score)}
            className={`aspect-square rounded-lg border-2 transition-all duration-200 flex items-center justify-center text-sm font-bold ${getButtonStyle(
              score
            )}`}
          >
            {score}
          </button>
        ))}
      </div>

      {/* Clear button */}
      {value !== null && (
        <button
          onClick={() => onChange(null)}
          className="w-full py-2 text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          Clear score
        </button>
      )}
    </div>
  )
}

