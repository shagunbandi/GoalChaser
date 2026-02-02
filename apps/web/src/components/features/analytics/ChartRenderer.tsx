'use client'

import type { PluginAnalyticsChartData } from '@goal-chaser/sdk/interfaces/plugin.interface'
import { 
  LineChart, 
  BarChart, 
  PieChart, 
  HeatMap,
  MetricCard,
  StreakDisplay,
} from '@goal-chaser/sdk/analytics'

interface ChartRendererProps {
  chart: PluginAnalyticsChartData
  startDate: string
  endDate: string
}

/**
 * Renders the appropriate chart component based on chart type
 */
export function ChartRenderer({ chart, startDate, endDate }: ChartRendererProps) {
  switch (chart.chartType) {
    case 'line':
      if (!chart.data) return null
      return (
        <LineChart
          title={chart.title}
          labels={chart.data.labels}
          datasets={chart.data.datasets}
        />
      )

    case 'bar':
      if (!chart.data) return null
      return (
        <BarChart
          title={chart.title}
          labels={chart.data.labels}
          datasets={chart.data.datasets}
        />
      )

    case 'pie':
      if (!chart.data) return null
      return (
        <PieChart
          title={chart.title}
          data={chart.data.datasets[0]?.data.map((value, index) => ({
            label: chart.data!.labels[index] || `Item ${index + 1}`,
            value,
            color: chart.data!.datasets[0]?.color
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

    case 'metric':
      if (!chart.metricData) return null
      return (
        <MetricCard
          label={chart.metricData.label}
          value={chart.metricData.value}
          unit={chart.metricData.unit}
          icon={chart.metricData.icon}
          color={chart.metricData.color}
          subtitle={chart.metricData.subtitle}
          trend={chart.metricData.trend}
        />
      )

    case 'streak':
      if (!chart.streakData) return null
      return (
        <StreakDisplay
          title={chart.title}
          currentStreak={chart.streakData.currentStreak}
          longestStreak={chart.streakData.longestStreak}
          unit={chart.streakData.unit}
          icon={chart.streakData.icon}
          color={chart.streakData.color}
          description={chart.streakData.description}
        />
      )

    default:
      return <div className="text-white/40">Unsupported chart type: {chart.chartType}</div>
  }
}
