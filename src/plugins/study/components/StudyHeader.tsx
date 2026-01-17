'use client'

import { useMemo } from 'react'
import { HeaderRenderer } from '@/components/features/year-view/renderers/HeaderRenderer'
import type { StudyDayData } from '../types'

interface StudyHeaderProps {
  year: number
  dayData: Record<string, StudyDayData>
  onPrevYear: () => void
  onNextYear: () => void
}

export function StudyHeader({
  year,
  dayData,
  onPrevYear,
  onNextYear,
}: StudyHeaderProps) {
  const headerConfig = useMemo(() => {
    const yearStats = {
      days: Object.values(dayData).filter(
        (data) => data?.subjects && data.subjects.length > 0,
      ).length,
      total: Object.values(dayData).reduce((sum, data) => {
        return (
          sum +
          (data?.subjects?.reduce(
            (s: number, entry: any) => s + (entry.hours || 0),
            0,
          ) || 0) +
          (data?.directHours || 0)
        )
      }, 0),
    }

    return {
      icon: '📚',
      title: `Study Year:`,
      stats: [
        { label: 'Days tracked', value: yearStats.days },
        { label: 'Total hours', value: yearStats.total.toFixed(1) },
      ],
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
