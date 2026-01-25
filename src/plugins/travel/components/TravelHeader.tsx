'use client'

import { useMemo, useState } from 'react'
import { HeaderRenderer } from '@/components/features/year-view/renderers/HeaderRenderer'
import { TravelManager } from './TravelManager'
import type { TravelDayData, TravelPlan, TravelPlanInput } from '../types'
import { isWeekend } from '@/utils'

interface TravelHeaderProps {
  year: number
  dayData: Record<string, TravelDayData>
  onPrevYear: () => void
  onNextYear: () => void
  onAddTravel?: (travel: TravelPlanInput) => void | Promise<void>
  onUpdateTravel?: (travel: TravelPlan) => void | Promise<void>
  onDeleteTravel?: (travelId: string) => void | Promise<void>
  allTravels?: TravelPlan[]
  userId?: string
  goalId?: string
}

export function TravelHeader({
  year,
  dayData,
  onPrevYear,
  onNextYear,
  onAddTravel,
  onUpdateTravel,
  onDeleteTravel,
  allTravels,
  userId,
  goalId,
}: TravelHeaderProps) {
  const [showTravelManager, setShowTravelManager] = useState(false)

  const headerConfig = useMemo(() => {
    const yearPrefix = `${year}-`
    const travelEntries = Object.entries(dayData).filter(
      ([iso, details]) =>
        iso.startsWith(yearPrefix) && (details.travelPlans?.length || 0) > 0,
    )
    const travelDays = travelEntries.length
    const weekdayCount = travelEntries.filter(([iso]) => !isWeekend(iso)).length
    const weekendCount = travelDays - weekdayCount

    return {
      icon: '✈️',
      title: `Travelling Year:`,
      stats: [
        { label: 'Travel days', value: travelDays },
        { label: 'Weekdays', value: weekdayCount },
        { label: 'Weekends', value: weekendCount },
      ],
      legends: [],
      actions: onAddTravel
        ? [
            {
              id: 'manage-travel',
              label: 'Manage Travel',
              icon: '⚙️',
              onClick: () => setShowTravelManager(true),
            },
          ]
        : [],
    }
  }, [dayData, year, onAddTravel])

  if (!headerConfig) return null

  return (
    <>
      <HeaderRenderer
        config={headerConfig}
        year={year}
        onPrevYear={onPrevYear}
        onNextYear={onNextYear}
      />

      {/* Travel Manager Drawer */}
      {showTravelManager && onAddTravel && onUpdateTravel && onDeleteTravel && (
        <TravelManager
          isOpen={showTravelManager}
          dayData={dayData}
          onAddTravel={onAddTravel}
          onUpdateTravel={onUpdateTravel}
          onDeleteTravel={onDeleteTravel}
          onClose={() => setShowTravelManager(false)}
          allTravels={allTravels}
          userId={userId}
          goalId={goalId}
        />
      )}
    </>
  )
}
