'use client'

import type { PeriodDayData } from '../types'
import { getPeriodDayNumber } from '../utils'

interface PeriodToggleProps {
  isPeriod: boolean
  onToggle: (value: boolean) => void
  date: string
  allData: Record<string, PeriodDayData>
}

export function PeriodToggle({
  isPeriod,
  onToggle,
  date,
  allData,
}: PeriodToggleProps) {
  const dayNumber = isPeriod ? getPeriodDayNumber(allData, date) : null

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-white/60">
        Period Status
      </label>

      <button
        onClick={() => onToggle(!isPeriod)}
        className={`
          w-full py-4 px-5 rounded-xl
          transition-all duration-300 ease-out
          flex items-center justify-between
          ${
            isPeriod
              ? 'bg-gradient-to-r from-red-500/20 to-pink-500/20 border-2 border-red-500/50 hover:border-red-400/70'
              : 'bg-white/[0.03] border-2 border-dashed border-white/10 hover:border-pink-500/40 hover:bg-pink-500/5'
          }
        `}
      >
        <div className="flex items-center gap-3">
          <div
            className={`
              w-10 h-10 rounded-full flex items-center justify-center
              transition-all duration-300
              ${
                isPeriod
                  ? 'bg-red-500/30 text-red-300'
                  : 'bg-white/5 text-white/40'
              }
            `}
          >
            {isPeriod ? '🩸' : '○'}
          </div>
          <div className="text-left">
            <div className={`font-medium ${isPeriod ? 'text-red-300' : 'text-white/70'}`}>
              {isPeriod ? 'Period Day' : 'Not a Period Day'}
            </div>
            {isPeriod && dayNumber && (
              <div className="text-sm text-red-400/70">
                Day {dayNumber} of current period
              </div>
            )}
            {!isPeriod && (
              <div className="text-sm text-white/40">
                Tap to mark as period day
              </div>
            )}
          </div>
        </div>

        {/* Toggle indicator */}
        <div
          className={`
            w-12 h-7 rounded-full relative transition-all duration-300
            ${isPeriod ? 'bg-red-500' : 'bg-white/10'}
          `}
        >
          <div
            className={`
              absolute top-1 w-5 h-5 rounded-full bg-white shadow-md
              transition-all duration-300
              ${isPeriod ? 'left-6' : 'left-1'}
            `}
          />
        </div>
      </button>
    </div>
  )
}
