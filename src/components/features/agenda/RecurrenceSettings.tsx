'use client'

import type { RepeatType } from '@/types'
import { WEEKDAY_CODES } from '@/utils'

interface RecurrenceSettingsProps {
  repeatType: RepeatType
  repeatDays: string[]
  recurrenceStart: string
  endDateOverride: string
  onRepeatTypeChange: (type: RepeatType) => void
  onToggleRepeatDay: (code: string) => void
  onRecurrenceStartChange: (date: string) => void
  onEndDateChange: (date: string) => void
}

export function RecurrenceSettings({
  repeatType,
  repeatDays,
  recurrenceStart,
  endDateOverride,
  onRepeatTypeChange,
  onToggleRepeatDay,
  onRecurrenceStartChange,
  onEndDateChange,
}: RecurrenceSettingsProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="flex items-center gap-2 sm:col-span-3">
          <label className="text-xs text-white/40 w-16">Repeat</label>
          <select
            value={repeatType}
            onChange={(e) => onRepeatTypeChange(e.target.value as RepeatType)}
            data-test-id="select-repeat-type"
            className="
              flex-1 px-3 py-2 rounded-xl
              bg-white/[0.04] border border-white/[0.08]
              text-white
              focus:outline-none focus:border-[#AF52DE]/60
            "
          >
            <option value="none">None</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="custom">Custom days</option>
          </select>
        </div>
      </div>

      {(repeatType === 'weekly' || repeatType === 'custom') && (
        <div className="flex flex-wrap gap-2" data-test-id="weekday-selector">
          {WEEKDAY_CODES.map((code) => (
            <button
              key={code}
              onClick={() => onToggleRepeatDay(code)}
              data-test-id={`button-weekday-${code}`}
              className={`
                px-3 py-1.5 rounded-lg text-xs font-medium
                transition-all duration-200
                ${
                  repeatDays.includes(code)
                    ? 'bg-[#AF52DE] text-white shadow-[0_0_10px_rgba(175,82,222,0.3)]'
                    : 'bg-white/[0.05] text-white/50 hover:bg-white/[0.1]'
                }
              `}
            >
              {code.toUpperCase()}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex items-center gap-2">
          <label className="text-xs text-white/40 w-20">Start on</label>
          <input
            type="date"
            value={recurrenceStart}
            onChange={(e) => onRecurrenceStartChange(e.target.value)}
            data-test-id="input-recurrence-start"
            className="
              flex-1 px-3 py-2 rounded-xl
              bg-white/[0.04] border border-white/[0.08]
              text-white placeholder-white/40
              focus:outline-none focus:border-[#AF52DE]/60
            "
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-white/40 w-20">End on</label>
          <input
            type="date"
            value={endDateOverride || ''}
            onChange={(e) => onEndDateChange(e.target.value)}
            data-test-id="input-recurrence-end"
            className="
              flex-1 px-3 py-2 rounded-xl
              bg-white/[0.04] border border-white/[0.08]
              text-white placeholder-white/40
              focus:outline-none focus:border-[#AF52DE]/60
            "
            placeholder="Optional"
          />
        </div>
      </div>
    </div>
  )
}
