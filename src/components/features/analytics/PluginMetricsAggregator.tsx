'use client'

import { useMemo } from 'react'
import type { Plugin, PluginAnalyticsMetric, PluginAnalyticsChartData } from '@/sdk/interfaces/plugin.interface'
import { LineChart, BarChart, PieChart, HeatMap } from '@/sdk/ui/charts'

interface PluginMetricsAggregatorProps {
  plugins: Plugin[]
  enabledPluginIds: string[]
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
  startDate,
  endDate,
  pluginData
}: PluginMetricsAggregatorProps) {
  const aggregatedData = useMemo(() => {
    const results: AggregatedMetrics[] = []

    enabledPluginIds.forEach(pluginId => {
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
  }, [plugins, enabledPluginIds, startDate, endDate, pluginData])

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
        <div key={plugin.pluginId} className="space-y-4">
          {/* Plugin header */}
          <div className="flex items-center gap-2 pb-2 border-b border-white/10">
            <span className="text-2xl">{plugin.pluginIcon}</span>
            <h2 className="text-xl font-bold text-white/90">{plugin.pluginName}</h2>
          </div>

          {/* Metrics */}
          {plugin.metrics.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {plugin.metrics.map((metric) => (
                <div
                  key={metric.id}
                  className="glass-panel rounded-lg p-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/60">{metric.label}</span>
                    {metric.icon && <span className="text-lg">{metric.icon}</span>}
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-white/90">
                      {metric.value}
                    </span>
                    {metric.unit && (
                      <span className="text-sm text-white/40">{metric.unit}</span>
                    )}
                  </div>
                  {metric.trend && metric.trendValue !== undefined && (
                    <div className={`text-sm ${
                      metric.trend === 'up' ? 'text-green-400' :
                      metric.trend === 'down' ? 'text-red-400' :
                      'text-white/40'
                    }`}>
                      {metric.trend === 'up' ? '↑' : metric.trend === 'down' ? '↓' : '→'}{' '}
                      {metric.trendValue > 0 ? '+' : ''}{metric.trendValue}%
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Charts */}
          {plugin.charts.length > 0 && (
            <div className="space-y-6">
              {plugin.charts.map((chart, index) => (
                <div key={index} className="glass-panel rounded-lg p-6">
                  {renderChart(chart, startDate, endDate)}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function renderChart(
  chart: PluginAnalyticsChartData,
  startDate: string,
  endDate: string
) {
  switch (chart.chartType) {
    case 'line':
      return (
        <LineChart
          title={chart.title}
          labels={chart.data.labels}
          datasets={chart.data.datasets}
        />
      )

    case 'bar':
      return (
        <BarChart
          title={chart.title}
          labels={chart.data.labels}
          datasets={chart.data.datasets}
        />
      )

    case 'pie':
      return (
        <PieChart
          title={chart.title}
          data={chart.data.datasets[0]?.data.map((value, index) => ({
            label: chart.data.labels[index] || `Item ${index + 1}`,
            value,
            color: chart.data.datasets[0]?.color
          })) || []}
        />
      )

    case 'heatmap':
      return (
        <HeatMap
          title={chart.title}
          data={chart.heatmapData || {}}
          startDate={chart.dateRange?.start || startDate}
          endDate={chart.dateRange?.end || endDate}
        />
      )

    default:
      return <div className="text-white/40">Unsupported chart type: {chart.chartType}</div>
  }
}
