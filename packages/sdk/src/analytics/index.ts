/**
 * Analytics SDK
 * 
 * Provides reusable analytics components and utilities for plugins.
 * Plugins use these components to display charts, metrics, and insights.
 */

// Chart components
export { LineChart } from './charts/LineChart'
export { BarChart } from './charts/BarChart'
export { PieChart } from './charts/PieChart'
export { HeatMap } from './charts/HeatMap'

// Analytics components
export { MetricCard } from './MetricCard'
export { StreakDisplay } from './StreakDisplay'

// Filter components
export { DateRangeSelector } from './DateRangeSelector'
export { PluginFilter } from './PluginFilter'

// Types
export type {
  LineChartProps,
  BarChartProps,
  PieChartProps,
  HeatMapProps,
  MetricCardProps,
  StreakDisplayProps,
  DateRangeSelectorProps,
  DateRange,
  DateRangePreset,
  PluginFilterProps,
  PluginFilterItem,
  MetricDataConfig,
  StreakDataConfig,
  AnalyticsChartType,
} from './types'

// Utility functions
export {
  calculateStreak,
  calculateAverage,
  calculateSum,
  calculateTrend,
  generateDateRange,
  formatDateLabel,
} from './types'
