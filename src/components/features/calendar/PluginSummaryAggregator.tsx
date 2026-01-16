'use client'

import { useMemo } from 'react'
import type { Plugin, CalendarDaySummary } from '@/sdk'
import { CalendarSummaryRenderer } from '@/sdk/ui'
import type { PluginIndicator } from '@/components/features/Calendar'

interface PluginSummaryAggregatorProps {
  /** Enabled plugins to query for summaries */
  plugins: Plugin[]

  /** Date to get summaries for */
  date: string

  /** Plugin data for the date (map of pluginId -> data) */
  pluginData: Record<string, any>

  /** Goal ID for building navigation URLs */
  goalId?: string

  /** Optional callback when an action is clicked */
  onActionClick?: (pluginId: string, actionLabel: string) => void
}

/**
 * Aggregates summaries from all enabled plugins for a specific date
 * Renders them using the appropriate SDK summary renderers
 */
export function PluginSummaryAggregator({
  plugins,
  date,
  pluginData,
  goalId,
  onActionClick,
}: PluginSummaryAggregatorProps) {
  const summaries = useMemo(() => {
    const result: Array<{ pluginId: string; summary: CalendarDaySummary }> = []

    for (const plugin of plugins) {
      if (!plugin.calendar?.getDaySummary) continue

      const data = pluginData[plugin.id] || null
      const summary = plugin.calendar.getDaySummary(date, data, { goalId })

      if (summary && summary.hasData && summary.summary) {
        result.push({ pluginId: plugin.id, summary })
      }
    }

    return result
  }, [plugins, date, pluginData, goalId])

  if (summaries.length === 0) {
    return null
  }

  return (
    <div className="space-y-3">
      {summaries.map(({ pluginId, summary }) => (
        <CalendarSummaryRenderer
          key={pluginId}
          config={summary.summary!}
          onActionClick={(action) => {
            onActionClick?.(pluginId, action.label)
          }}
        />
      ))}
    </div>
  )
}

/**
 * Hook to aggregate plugin indicators (colored dots) for a date range
 */
export function usePluginIndicators(
  plugins: Plugin[],
  dateRange: string[],
  pluginDataByDate: Record<string, Record<string, any>>,
  goalId?: string,
): Record<string, PluginIndicator[]> {
  return useMemo(() => {
    const indicators: Record<string, PluginIndicator[]> = {}

    for (const date of dateRange) {
      const dayIndicators: PluginIndicator[] = []
      const pluginData = pluginDataByDate[date] || {}

      for (const plugin of plugins) {
        if (!plugin.calendar?.getDaySummary) continue

        const data = pluginData[plugin.id] || null
        const summary = plugin.calendar.getDaySummary(date, data, { goalId })

        if (summary) {
          dayIndicators.push({
            pluginId: plugin.id,
            pluginName: plugin.metadata.name,
            color: summary.color,
            hasData: summary.hasData,
          })
        }
      }

      if (dayIndicators.length > 0) {
        indicators[date] = dayIndicators
      }
    }

    return indicators
  }, [plugins, dateRange, pluginDataByDate, goalId])
}
