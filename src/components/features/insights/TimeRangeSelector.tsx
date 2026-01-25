/**
 * Time Range Selector (Compact)
 * 
 * Compact time range selector for insights
 */

'use client'

import type { TimeRangeOption } from '@/sdk'

interface TimeRangeSelectorProps {
  /** Available time range options */
  options: TimeRangeOption[]
  
  /** Currently selected option ID */
  selectedId: string
  
  /** Callback when option is selected */
  onChange: (optionId: string) => void
}

export function TimeRangeSelector({
  options,
  selectedId,
  onChange,
}: TimeRangeSelectorProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm text-white/60 shrink-0">Period:</span>
      {options.map((option) => {
        const isActive = option.id === selectedId
        
        return (
          <button
            key={option.id}
            onClick={() => onChange(option.id!)}
            className={`
              px-3 py-1.5 text-sm rounded-lg transition-colors
              ${
                isActive
                  ? 'bg-[#007AFF] text-white'
                  : 'bg-white/5 hover:bg-white/10 text-white/70'
              }
            `}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
