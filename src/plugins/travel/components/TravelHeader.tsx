'use client'

import { useMemo, useState } from 'react'
import { HeaderRenderer } from '@/components/features/year-view/renderers/HeaderRenderer'
import { Modal } from '@/components/ui'
import { TravelForm } from './TravelForm'
import type { TravelDayData, TravelPlanInput } from '../types'
import { isWeekend } from '@/utils'

interface TravelHeaderProps {
  year: number
  dayData: Record<string, TravelDayData>
  onPrevYear: () => void
  onNextYear: () => void
  onAddTravel?: (travel: TravelPlanInput) => void | Promise<void>
}

export function TravelHeader({
  year,
  dayData,
  onPrevYear,
  onNextYear,
  onAddTravel,
}: TravelHeaderProps) {
  const [showTravelModal, setShowTravelModal] = useState(false)

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
              id: 'add-travel',
              label: '+ Add travel',
              onClick: () => setShowTravelModal(true),
              color: 'info' as const,
            },
          ]
        : [],
    }
  }, [dayData, year, onAddTravel])

  const handleSaveTravel = async (data: {
    title: string
    destination: string
    startDate: string
    endDate: string
    color: string
    note: string
  }) => {
    if (onAddTravel) {
      await onAddTravel({
        title: data.title,
        destination: data.destination,
        startDate: data.startDate,
        endDate: data.endDate,
        color: data.color,
        note: data.note,
      })
    }
    setShowTravelModal(false)
  }

  if (!headerConfig) return null

  return (
    <>
      <HeaderRenderer
        config={headerConfig}
        year={year}
        onPrevYear={onPrevYear}
        onNextYear={onNextYear}
      />

      {/* Add Travel Modal */}
      <Modal
        open={showTravelModal}
        onClose={() => setShowTravelModal(false)}
        title="Add Travel Plan"
      >
        <TravelForm
          onSubmit={handleSaveTravel}
          onCancel={() => setShowTravelModal(false)}
        />
      </Modal>
    </>
  )
}
