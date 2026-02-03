'use client'

import { PluginMonthView } from '@goal-chaser/sdk'
import type { DayCustomization } from '@goal-chaser/sdk'
import { ProductivityPlugin } from '../plugin'
import type { ProductivityDayData, AreaConfig } from '../types'
import { getScoreColorClassForCalendar } from '../utils/score-utils'

interface ProductivityMonthViewProps {
  plugin: any
  month: number
  year: number
  goalId: string
  todayISO: string
  dayData: Record<string, ProductivityDayData>
  initialSelectedDate: string | null
  areaConfigs: AreaConfig[]
  onUpdateDay: (
    iso: string,
    updates: Partial<ProductivityDayData>,
  ) => Promise<void>
  onBackToYear: () => void
  selectedAreas: Set<string>
  detailContext?: {
    areaConfigs: AreaConfig[]
    onAddArea: (name: string) => void
    onAddTopic: (areaId: string, topic: string) => void
    isTopicInUse: (areaId: string, topic: string) => boolean
  }
}

export function ProductivityMonthView({
  plugin,
  month,
  year,
  goalId,
  todayISO,
  dayData,
  initialSelectedDate,
  areaConfigs,
  onUpdateDay,
  onBackToYear,
  selectedAreas,
  detailContext,
}: ProductivityMonthViewProps) {
  // Build day customizations based on productivity status
  const buildDayCustomization = (
    date: string,
    data: ProductivityDayData | null,
  ): DayCustomization | null => {
    if (!data) return null

    const status = data.status ?? null
    const bgColor = getScoreColorClassForCalendar(status)
    const hasAreas = data.areas && data.areas.length > 0
    const areasCount = data.areas?.length || 0

    const getStatusColor = () => {
      if (status === null) return '#FFA500'
      if (status >= 7) return '#00FF00'
      if (status >= 4) return '#FFA500'
      return '#FF6B6B'
    }

    // Check if day has selected areas
    const hasSelectedArea =
      selectedAreas.size === areaConfigs.length ||
      data.areas?.some((entry) => {
        const areaConfig = areaConfigs.find((a) => a.name === entry.area)
        return areaConfig && selectedAreas.has(areaConfig.id)
      })

    return {
      backgroundColor: bgColor,
      style: {
        opacity: hasSelectedArea ? 1.0 : 0.3,
        transition: 'opacity 0.2s ease-in-out',
      },
      indicators: hasAreas
        ? [
            {
              id: 'areas',
              label: `${areasCount} area${areasCount !== 1 ? 's' : ''}`,
              color: getStatusColor(),
            },
          ]
        : [],
    }
  }

  return (
    <PluginMonthView
      plugin={plugin}
      year={year}
      month={month}
      goalId={goalId}
      todayISO={todayISO}
      dayData={dayData}
      initialSelectedDate={initialSelectedDate}
      onUpdateDay={onUpdateDay}
      onBackToYear={onBackToYear}
      buildDayCustomization={buildDayCustomization}
      detailContext={detailContext}
    />
  )
}
