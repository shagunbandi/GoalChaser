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
            className={`
              px-4 py-2.5 rounded-xl text-sm font-medium 
              transition-all duration-200 backdrop-blur-sm
              ${activePreset === preset.id
                ? 'bg-gradient-to-r from-[#007AFF] to-[#AF52DE] text-white shadow-[0_0_25px_rgba(0,122,255,0.3)] border border-white/20'
                : 'bg-white/[0.03] text-white/60 hover:bg-white/[0.08] hover:text-white/90 border border-white/[0.06] hover:border-white/[0.1]'
              }
            `}
          >
            {preset.label}
          </button>
        ))}
        <button
          onClick={handleCustomClick}
          className={`
            px-4 py-2.5 rounded-xl text-sm font-medium 
            transition-all duration-200 backdrop-blur-sm
            ${activePreset === 'custom'
              ? 'bg-gradient-to-r from-[#007AFF] to-[#AF52DE] text-white shadow-[0_0_25px_rgba(0,122,255,0.3)] border border-white/20'
              : 'bg-white/[0.03] text-white/60 hover:bg-white/[0.08] hover:text-white/90 border border-white/[0.06] hover:border-white/[0.1]'
            }
          `}
        >
          Custom
        </button>
      </div>

      {/* Custom Date Picker */}
      {showCustom && (
        <div className="
          bg-white/[0.02] backdrop-blur-xl
          rounded-2xl p-5 
          border border-white/[0.06]
        ">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-xs text-white/40 mb-2">Start Date</label>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="
                  px-4 py-2.5
                  bg-white/[0.03] backdrop-blur-sm
                  border border-white/[0.08] rounded-xl
                  text-white text-sm
                  focus:outline-none focus:border-[#007AFF]/50
                  focus:shadow-[0_0_0_3px_rgba(0,122,255,0.1)]
                  transition-all duration-200
                  [color-scheme:dark]
                "
              />
            </div>
            <div>
              <label className="block text-xs text-white/40 mb-2">End Date</label>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="
                  px-4 py-2.5
                  bg-white/[0.03] backdrop-blur-sm
                  border border-white/[0.08] rounded-xl
                  text-white text-sm
                  focus:outline-none focus:border-[#007AFF]/50
                  focus:shadow-[0_0_0_3px_rgba(0,122,255,0.1)]
                  transition-all duration-200
                  [color-scheme:dark]
                "
              />
            </div>
            <button
              onClick={handleApplyCustom}
              className="
                px-5 py-2.5
                bg-[#007AFF] hover:bg-[#007AFF]/80
                text-white font-medium rounded-xl text-sm
                shadow-[0_0_20px_rgba(0,122,255,0.3)]
                hover:shadow-[0_0_25px_rgba(0,122,255,0.4)]
                transition-all duration-200
              "
            >
              Apply
            </button>
          </div>
        </div>
      )}

      {/* Current Selection Display */}
      <div className="text-sm text-white/40">
        Showing data from{' '}
        <span className="text-white/80 font-medium">
          {new Date(selectedRange.startDate + 'T00:00:00').toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </span>{' '}
        to{' '}
        <span className="text-white/80 font-medium">
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
