'use client'

import { useState } from 'react'
import { getDateRangePresets, type DateRange } from '@/lib/analyticsUtils'

interface DateRangeSelectorProps {
  selectedRange: DateRange
  onRangeChange: (range: DateRange) => void
}

export function DateRangeSelector({ selectedRange, onRangeChange }: DateRangeSelectorProps) {
  const [showCustom, setShowCustom] = useState(false)
  const [customStart, setCustomStart] = useState(selectedRange.startDate)
  const [customEnd, setCustomEnd] = useState(selectedRange.endDate)
  const [activePreset, setActivePreset] = useState('lastweek')

  const presets = getDateRangePresets()

  const handlePresetClick = (presetId: string) => {
    const preset = presets.find((p) => p.id === presetId)
    if (preset) {
      setActivePreset(presetId)
      setShowCustom(false)
      onRangeChange(preset.getDates())
    }
  }

  const handleCustomClick = () => {
    setActivePreset('custom')
    setShowCustom(true)
  }

  const handleApplyCustom = () => {
    if (customStart && customEnd && customStart <= customEnd) {
      onRangeChange({
        startDate: customStart,
        endDate: customEnd,
        label: 'Custom Range',
      })
    }
  }

  return (
    <div className="space-y-4">
      {/* Preset Buttons */}
      <div className="flex flex-wrap gap-2">
        {presets.map((preset) => (
          <button
            key={preset.id}
            onClick={() => handlePresetClick(preset.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activePreset === preset.id
                ? 'bg-gradient-to-r from-cyan-500 to-violet-500 text-white'
                : 'bg-white/10 text-slate-300 hover:bg-white/20'
            }`}
          >
            {preset.label}
          </button>
        ))}
        <button
          onClick={handleCustomClick}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            activePreset === 'custom'
              ? 'bg-gradient-to-r from-cyan-500 to-violet-500 text-white'
              : 'bg-white/10 text-slate-300 hover:bg-white/20'
          }`}
        >
          Custom
        </button>
      </div>

      {/* Custom Date Picker */}
      {showCustom && (
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Start Date</label>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">End Date</label>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
              />
            </div>
            <button
              onClick={handleApplyCustom}
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-white font-medium rounded-lg text-sm transition-colors"
            >
              Apply
            </button>
          </div>
        </div>
      )}

      {/* Current Selection Display */}
      <div className="text-sm text-slate-400">
        Showing data from{' '}
        <span className="text-white font-medium">
          {new Date(selectedRange.startDate + 'T00:00:00').toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </span>{' '}
        to{' '}
        <span className="text-white font-medium">
          {new Date(selectedRange.endDate + 'T00:00:00').toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </span>
      </div>
    </div>
  )
}

