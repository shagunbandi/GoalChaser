'use client'

import { useMemo } from 'react'
import { HeaderRenderer } from '@/components/features/year-view/renderers/HeaderRenderer'
import type { TravelDayData } from '../types'

interface TravelHeaderProps {
  year: number
  dayData: Record<string, TravelDayData>
  onPrevYear: () => void
  onNextYear: () => void
}

export function TravelHeader({
  year,
  dayData,
  onPrevYear,
  onNextYear,
}: TravelHeaderProps) {
  const headerConfig = useMemo(() => {
    const travelDays = Object.values(dayData).filter(
      (data) => data?.travelPlans && data.travelPlans.length > 0,
    ).length

    return {
      icon: '✈️',
      title: `Travel Year:`,
      stats: [{ label: 'Travel days', value: travelDays }],
      legends: [],
      actions: [],
    }
  }, [dayData])

  if (!headerConfig) return null

  return (
    <HeaderRenderer
      config={headerConfig}
      year={year}
      onPrevYear={onPrevYear}
      onNextYear={onNextYear}
    />
  )
}
