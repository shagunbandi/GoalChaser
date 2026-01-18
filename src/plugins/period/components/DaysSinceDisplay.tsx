'use client'

import type { PeriodDayData } from '../types'
import { calculateDaysSinceLastPeriod, getLastPeriodDate } from '../utils'

interface DaysSinceDisplayProps {
  date: string
  allData: Record<string, PeriodDayData>
}

export function DaysSinceDisplay({ date, allData }: DaysSinceDisplayProps) {
  const daysSince = calculateDaysSinceLastPeriod(allData, date)
  const lastPeriodDate = getLastPeriodDate(allData)

  if (daysSince === null) {
    return (
      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
        <div className="text-center text-white/40">
          <div className="text-2xl mb-2">📊</div>
          <div className="text-sm">No period data recorded yet</div>
          <div className="text-xs mt-1">Mark your first period day to start tracking</div>
        </div>
      </div>
    )
  }

  // Format the last period date
  const formattedLastDate = lastPeriodDate
    ? new Date(lastPeriodDate + 'T00:00:00').toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    : null

  return (
    <div className="p-5 rounded-xl bg-gradient-to-br from-pink-500/10 to-rose-500/5 border border-pink-500/20">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-pink-500/20 flex items-center justify-center">
          <span className="text-2xl">📅</span>
        </div>
        <div className="flex-1">
          <div className="text-sm text-pink-300/70 mb-1">Days since last period</div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-pink-300">{daysSince}</span>
            <span className="text-pink-300/60 text-sm">days</span>
          </div>
          {formattedLastDate && (
            <div className="text-xs text-white/40 mt-1">
              Last period: {formattedLastDate}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
