'use client'

/**
 * Date Range Selector Component
 * Reusable date range picker with preset options
 */

import { useState, useMemo } from 'react'

export interface DateRangePreset {
  label: string
  days: number
}

export interface DateRange {
  start: string
  end: string
}

export interface DateRangeSelectorProps {
  /** Current date range */
  value: DateRange
  /** Callback when date range changes */
  onChange: (range: DateRange) => void
  /** Custom preset options */
  presets?: DateRangePreset[]
  /** Show custom date inputs */
  showCustomInputs?: boolean
  /** Compact mode for smaller spaces */
  compact?: boolean
}

const DEFAULT_PRESETS: DateRangePreset[] = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
  { label: 'Last 6 months', days: 180 },
  { label: 'Last year', days: 365 },
]

export function DateRangeSelector({
  value,
  onChange,
  presets = DEFAULT_PRESETS,
  showCustomInputs = true,
  compact = false,
}: DateRangeSelectorProps) {
  const [activePreset, setActivePreset] = useState<number | null>(null)

  // Check which preset matches current value
  const matchingPreset = useMemo(() => {
    const end = new Date()
    end.setHours(0, 0, 0, 0)
    const endStr = end.toISOString().split('T')[0]

    for (let i = 0; i < presets.length; i++) {
      const start = new Date()
      start.setDate(start.getDate() - presets[i].days)
      start.setHours(0, 0, 0, 0)
      const startStr = start.toISOString().split('T')[0]

      if (value.start === startStr && value.end === endStr) {
        return i
      }
    }
    return null
  }, [value, presets])

  const handlePresetClick = (days: number, index: number) => {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - days)
    
    setActivePreset(index)
    onChange({
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    })
  }

  const handleDateChange = (type: 'start' | 'end', dateValue: string) => {
    setActivePreset(null)
    onChange({
      ...value,
      [type]: dateValue,
    })
  }

  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        {presets.map((preset, index) => (
          <button
            key={preset.days}
            onClick={() => handlePresetClick(preset.days, index)}
            className={`
              px-3 py-1.5 text-sm rounded-lg transition-colors
              ${matchingPreset === index || activePreset === index
                ? 'bg-[#007AFF] text-white'
                : 'bg-white/5 hover:bg-white/10 text-white/70'
              }
            `}
          >
            {preset.label}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="glass-panel rounded-lg p-4 space-y-4">
      {/* Custom date inputs */}
      {showCustomInputs && (
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-white/60">From:</label>
            <input
              type="date"
              value={value.start}
              onChange={(e) => handleDateChange('start', e.target.value)}
              className="bg-white/5 border border-white/10 rounded px-3 py-1.5 text-white/90 text-sm focus:outline-none focus:ring-2 focus:ring-[#007AFF]/50"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm text-white/60">To:</label>
            <input
              type="date"
              value={value.end}
              onChange={(e) => handleDateChange('end', e.target.value)}
              className="bg-white/5 border border-white/10 rounded px-3 py-1.5 text-white/90 text-sm focus:outline-none focus:ring-2 focus:ring-[#007AFF]/50"
            />
          </div>
        </div>
      )}

      {/* Preset ranges */}
      <div className="flex flex-wrap gap-2">
        {presets.map((preset, index) => (
          <button
            key={preset.days}
            onClick={() => handlePresetClick(preset.days, index)}
            className={`
              px-3 py-1.5 text-sm rounded-lg transition-colors
              ${matchingPreset === index || activePreset === index
                ? 'bg-[#007AFF] text-white'
                : 'bg-white/5 hover:bg-white/10 text-white/70'
              }
            `}
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  )
}
