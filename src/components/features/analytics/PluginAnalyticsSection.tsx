'use client'

import type { PluginAnalyticsMetric, PluginAnalyticsChartData } from '@/sdk/interfaces/plugin.interface'
import { ChartRenderer } from './ChartRenderer'
import { getDefaultSize, getSizeClass } from './chart-utils'

interface PluginAnalyticsSectionProps {
  pluginId: string
  pluginName: string
  pluginIcon: string
  metrics: PluginAnalyticsMetric[]
  charts: PluginAnalyticsChartData[]
  startDate: string
  endDate: string
}

/**
 * Renders analytics section for a single plugin
 */
export function PluginAnalyticsSection({
  pluginId,
  pluginName,
  pluginIcon,
  metrics,
  charts,
  startDate,
  endDate,
}: PluginAnalyticsSectionProps) {
  return (
    <div key={pluginId} className="space-y-4">
      {/* Plugin header */}
      <div className="flex items-center gap-2 pb-2 border-b border-white/10">
        <span className="text-2xl">{pluginIcon}</span>
        <h2 className="text-xl font-bold text-white/90">{pluginName}</h2>
      </div>

      {/* Metrics from analytics.metrics */}
      {metrics.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((metric) => (
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

      {/* Charts with varied sizes */}
      {charts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
          {charts.map((chart, index) => {
            const size = chart.size || getDefaultSize(chart.chartType)
            const sizeClass = getSizeClass(size)
            const needsPanel = chart.chartType !== 'metric' && chart.chartType !== 'streak'

            return (
              <div 
                key={index} 
                className={`${sizeClass} h-full ${needsPanel ? 'glass-panel rounded-lg p-6' : ''}`}
              >
                <ChartRenderer 
                  chart={chart} 
                  startDate={startDate} 
                  endDate={endDate} 
                />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
