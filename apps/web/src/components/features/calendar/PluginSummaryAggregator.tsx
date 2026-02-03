'use client'

import { useMemo } from 'react'
import type { Plugin, CalendarDaySummary } from '@goal-chaser/sdk'
import { CalendarSummaryRenderer } from '@goal-chaser/sdk/ui'

/**
 * Plugin indicator for calendar dots
 */
export interface PluginIndicator {
  pluginId: string
  pluginName: string
  color: string
  hasData: boolean
}

interface PluginSummaryAggregatorProps {
  /** Enabled plugins to query for summaries */
  plugins: Plugin[]

  /** Date to get summaries for */
  date: string

  /** Plugin data for the date (map of pluginId -> data) */
  pluginData: Record<string, any>

  /** All plugin data for the month (map of pluginId -> date -> data) */
  allPluginData?: Record<string, Record<string, any>>

  /** Goal ID for building navigation URLs */
  goalId?: string

  /** Optional callback when an action is clicked */
  onActionClick?: (pluginId: string, actionLabel: string) => void
}

/**
 * Aggregates summaries from all enabled plugins for a specific date
 * Renders them using the appropriate SDK summary renderers
 * Also shows plugins without data with a "Start tracking" option
 */
export function PluginSummaryAggregator({
  plugins,
  date,
  pluginData,
  allPluginData,
  goalId,
  onActionClick,
}: PluginSummaryAggregatorProps) {
  const { summaries, pluginsWithoutData } = useMemo(() => {
    const summaries: Array<{ pluginId: string; summary: CalendarDaySummary }> = []
    const pluginsWithoutData: Array<{ id: string; name: string; icon: string }> = []

    for (const plugin of plugins) {
      if (!plugin.calendar?.getDaySummary) continue

      const data = pluginData[plugin.id] || null
      // Pass all month data for this plugin so it can calculate monthly totals
      const allMonthData = allPluginData?.[plugin.id] || undefined
      const summary = plugin.calendar.getDaySummary(date, data, { goalId, allMonthData })

      if (summary && summary.hasData && summary.summary) {
        summaries.push({ pluginId: plugin.id, summary })
      } else {
        // Plugin has no data for this date - add to untracked list
        pluginsWithoutData.push({
          id: plugin.id,
          name: plugin.metadata.name,
          icon: plugin.metadata.icon || '📊',
        })
      }
    }

    return { summaries, pluginsWithoutData }
  }, [plugins, date, pluginData, allPluginData, goalId])

  const handleStartTracking = (pluginId: string) => {
    onActionClick?.(pluginId, 'Start tracking')
  }

  return (
    <div className="space-y-4">
      {/* Plugins with data */}
      {summaries.length > 0 && (
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
      )}

      {/* Plugins without data - Start tracking section */}
      {pluginsWithoutData.length > 0 && (
        <div className="pt-2">
          <div className="text-xs text-white/40 mb-2">Track more:</div>
          <div className="flex flex-wrap gap-2">
            {pluginsWithoutData.map((plugin) => (
              <button
                key={plugin.id}
                onClick={() => handleStartTracking(plugin.id)}
                className="
                  inline-flex items-center gap-1.5 px-3 py-1.5
                  bg-white/5 hover:bg-white/10
                  border border-white/10 hover:border-white/20
                  rounded-lg text-xs text-white/60 hover:text-white/80
                  transition-all duration-150
                "
              >
                <span>{plugin.icon}</span>
                <span>{plugin.name}</span>
                <span className="text-white/30">+</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Empty state when nothing to show */}
      {summaries.length === 0 && pluginsWithoutData.length === 0 && (
        <div className="text-center text-white/40 py-4">
          <p className="text-sm">No plugins available</p>
        </div>
      )}
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
