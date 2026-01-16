'use client'

import type { TravelSummaryData } from '@/types'

interface TravelSummaryProps {
  data: TravelSummaryData
}

export function TravelSummary({ data }: TravelSummaryProps) {
  const { travelPlans = [] } = data

  if (!data.hasData) {
    return (
      <div className="text-xs text-white/40 italic">
        No travel data recorded
      </div>
    )
  }

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    const startStr = start.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
    const endStr = end.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
    
    return `${startStr} → ${endStr}`
  }

  return (
    <div className="space-y-3">
      {travelPlans.map((travel) => (
        <div key={travel.id} className="space-y-2">
          <div className="text-sm font-medium text-white/90">
            ✈️ {travel.title}
          </div>
          {travel.destination && (
            <div className="text-xs text-white/70">
              📍 {travel.destination}
            </div>
          )}
          <div className="text-xs text-white/60">
            📅 {formatDateRange(travel.startDate, travel.endDate)}
          </div>
          {travel.note && (
            <div className="text-xs text-white/50 bg-white/5 rounded-lg p-2 mt-2">
              {travel.note}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
