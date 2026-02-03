'use client'

import { useMemo } from 'react'
import type { Plugin, PluginAnalyticsMetric, PluginAnalyticsChartData } from '@goal-chaser/sdk/interfaces/plugin.interface'
import { PluginAnalyticsSection } from './PluginAnalyticsSection'

interface PluginMetricsAggregatorProps {
  plugins: Plugin[]
  enabledPluginIds: string[]
  visiblePluginIds: string[]  // Plugins visible after filtering
  startDate: string
  endDate: string
  pluginData: Record<string, Record<string, any>> // pluginId -> date -> dayData
}

interface AggregatedMetrics {
  pluginId: string
  pluginName: string
  pluginIcon: string
  metrics: PluginAnalyticsMetric[]
  charts: PluginAnalyticsChartData[]
}

export function PluginMetricsAggregator({
  plugins,
  enabledPluginIds,
  visiblePluginIds,
  startDate,
  endDate,
  pluginData
}: PluginMetricsAggregatorProps) {
  const aggregatedData = useMemo(() => {
    const results: AggregatedMetrics[] = []

    // Only process plugins that are both enabled and visible (not filtered out)
    const pluginsToShow = enabledPluginIds.filter(id => visiblePluginIds.includes(id))

    pluginsToShow.forEach(pluginId => {
      const plugin = plugins.find(p => p.id === pluginId)
      if (!plugin?.analytics) return

      const data = pluginData[pluginId] || {}

      // Collect metrics
      const metrics = plugin.analytics.metrics || []

      // Generate charts if method is provided
      const charts = plugin.analytics.getAnalyticsData
        ? plugin.analytics.getAnalyticsData(startDate, endDate, data)
        : []

      if (metrics.length > 0 || charts.length > 0) {
        results.push({
          pluginId: plugin.id,
          pluginName: plugin.metadata.name,
          pluginIcon: plugin.metadata.icon,
          metrics,
          charts
        })
      }
    })

    return results
  }, [plugins, enabledPluginIds, visiblePluginIds, startDate, endDate, pluginData])

  if (aggregatedData.length === 0) {
    return (
      <div className="text-center py-12 text-white/40">
        <p>No analytics data available for the selected date range.</p>
        <p className="text-sm mt-2">Enable plugins to see their analytics here.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {aggregatedData.map((plugin) => (
        <PluginAnalyticsSection
          key={plugin.pluginId}
          pluginId={plugin.pluginId}
          pluginName={plugin.pluginName}
          pluginIcon={plugin.pluginIcon}
          metrics={plugin.metrics}
          charts={plugin.charts}
          startDate={startDate}
          endDate={endDate}
        />
      ))}
    </div>
  )
}
