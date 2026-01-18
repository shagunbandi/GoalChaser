'use client'

import { useMemo } from 'react'
import { HeaderRenderer } from '@/components/features/year-view/renderers/HeaderRenderer'
import type { PeriodDayData } from '../types'
import { buildPeriodHeaderConfig } from '../utils/header-config'

interface PeriodHeaderProps {
  year: number
  dayData: Record<string, PeriodDayData>
  onPrevYear: () => void
  onNextYear: () => void
}

export function PeriodHeader({
  year,
  dayData,
  onPrevYear,
  onNextYear,
}: PeriodHeaderProps) {
  const headerConfig = useMemo(() => {
    // Filter data for current year for year-specific stats
    const yearPrefix = `${year}-`
    const yearData = Object.fromEntries(
      Object.entries(dayData).filter(([date]) => date.startsWith(yearPrefix))
    )
    
    return buildPeriodHeaderConfig(yearData, dayData, 'year')
  }, [dayData, year])

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
