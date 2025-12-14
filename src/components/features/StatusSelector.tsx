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
          return 'bg-[#30D158] border-[#30D158] text-white ring-2 ring-[#30D158]/50 ring-offset-2 ring-offset-[#0a0a12] shadow-[0_0_25px_rgba(48,209,88,0.4)]'
        case 'ok':
          return 'bg-[#FF9500] border-[#FF9500] text-white ring-2 ring-[#FF9500]/50 ring-offset-2 ring-offset-[#0a0a12] shadow-[0_0_25px_rgba(255,149,0,0.4)]'
        case 'low':
          return 'bg-[#FF453A] border-[#FF453A] text-white ring-2 ring-[#FF453A]/50 ring-offset-2 ring-offset-[#0a0a12] shadow-[0_0_25px_rgba(255,69,58,0.4)]'
      }
    }

    switch (category) {
      case 'high':
        return 'bg-white/[0.03] border-[#30D158]/30 text-white/60 hover:bg-[#30D158]/20 hover:border-[#30D158]/50 hover:text-white/90'
      case 'ok':
        return 'bg-white/[0.03] border-[#FF9500]/30 text-white/60 hover:bg-[#FF9500]/20 hover:border-[#FF9500]/50 hover:text-white/90'
      case 'low':
        return 'bg-white/[0.03] border-[#FF453A]/30 text-white/60 hover:bg-[#FF453A]/20 hover:border-[#FF453A]/50 hover:text-white/90'
      default:
        return 'bg-white/[0.03] border-white/10 text-white/60'
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-white/60">
          Productivity Score
        </label>
        {value !== null && (
          <div className="flex items-center gap-2">
            <span
              className={`text-2xl font-bold ${
                value >= 7
                  ? 'text-[#30D158]'
                  : value >= 4
                  ? 'text-[#FF9500]'
                  : 'text-[#FF453A]'
              }`}
            >
              {value}/10
            </span>
            <span
              className={`text-xs px-2.5 py-1 rounded-full backdrop-blur-sm ${
                value >= 7
                  ? 'bg-[#30D158]/20 text-[#30D158] border border-[#30D158]/30'
                  : value >= 4
                  ? 'bg-[#FF9500]/20 text-[#FF9500] border border-[#FF9500]/30'
                  : 'bg-[#FF453A]/20 text-[#FF453A] border border-[#FF453A]/30'
              }`}
            >
              {getScoreLabel(value)}
            </span>
          </div>
        )}
      </div>

      {/* Score legend */}
      <div className="flex justify-between text-xs text-white/40 px-1">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#FF453A]" /> Low (1-3)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#FF9500]" /> OK (4-6)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#30D158]" /> High (7-10)
        </span>
      </div>

      {/* Score buttons */}
      <div className="grid grid-cols-10 gap-1.5">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
          <button
            key={score}
            onClick={() => onChange(value === score ? null : score)}
            className={`
              aspect-square rounded-xl border-2 
              transition-all duration-200 
              flex items-center justify-center 
              text-sm font-semibold
              backdrop-blur-sm
              ${getButtonStyle(score)}
            `}
          >
            {score}
          </button>
        ))}
      </div>

      {/* Clear button */}
      {value !== null && (
        <button
          onClick={() => onChange(null)}
          className="
            w-full py-2.5 
            text-xs text-white/40 hover:text-white/70
            bg-white/[0.02] hover:bg-white/[0.05]
            border border-white/[0.05] hover:border-white/[0.1]
            rounded-xl
            transition-all duration-200
          "
        >
          Clear score
        </button>
      )}
    </div>
  )
}
