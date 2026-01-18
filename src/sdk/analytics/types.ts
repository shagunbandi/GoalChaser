/**
 * Analytics Types
 * 
 * Types for analytics components and configurations
 */

// Re-export component props for convenience
export type { LineChartProps } from './charts/LineChart'
export type { BarChartProps } from './charts/BarChart'
export type { PieChartProps } from './charts/PieChart'
export type { HeatMapProps } from './charts/HeatMap'
export type { MetricCardProps } from './MetricCard'
export type { StreakDisplayProps } from './StreakDisplay'
export type { DateRangeSelectorProps, DateRange, DateRangePreset } from './DateRangeSelector'
export type { PluginFilterProps, PluginFilterItem } from './PluginFilter'

/**
 * Metric data configuration for plugins
 * Used in getAnalyticsData return
 */
export interface MetricDataConfig {
  label: string
  value: number | string
  unit?: string
  icon?: string
  color?: string
  subtitle?: string
  trend?: {
    direction: 'up' | 'down' | 'neutral'
    value: number
  }
}

/**
 * Streak data configuration for plugins
 * Used in getAnalyticsData return
 */
export interface StreakDataConfig {
  currentStreak: number
  longestStreak: number
  unit?: string
  icon?: string
  color?: string
  description?: string
}

/**
 * Analytics chart type union
 */
export type AnalyticsChartType = 'line' | 'bar' | 'pie' | 'heatmap' | 'metric' | 'streak'

/**
 * Helper to calculate streak from date-indexed data
 */
export function calculateStreak<T>(
  data: Record<string, T>,
  hasValue: (item: T) => boolean,
  endDate?: string
): { current: number; longest: number } {
  const dates = Object.keys(data).sort()
  if (dates.length === 0) return { current: 0, longest: 0 }

  let current = 0
  let longest = 0
  let streak = 0

  // Find the end date to calculate from (today or specified)
  const today = endDate || new Date().toISOString().split('T')[0]
  
  // Calculate longest streak
  for (const date of dates) {
    if (hasValue(data[date])) {
      streak++
      longest = Math.max(longest, streak)
    } else {
      streak = 0
    }
  }

  // Calculate current streak (must be consecutive including today or yesterday)
  const sortedDates = dates.filter(d => hasValue(data[d])).sort().reverse()
  
  if (sortedDates.length === 0) return { current: 0, longest }

  // Check if most recent day with data is today or yesterday
  const mostRecent = sortedDates[0]
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]

  if (mostRecent !== today && mostRecent !== yesterdayStr) {
    return { current: 0, longest }
  }

  // Count consecutive days going backwards
  current = 1
  let prevDate = new Date(mostRecent)
  
  for (let i = 1; i < sortedDates.length; i++) {
    const expectedPrev = new Date(prevDate)
    expectedPrev.setDate(expectedPrev.getDate() - 1)
    const expectedPrevStr = expectedPrev.toISOString().split('T')[0]
    
    if (sortedDates[i] === expectedPrevStr) {
      current++
      prevDate = expectedPrev
    } else {
      break
    }
  }

  return { current, longest }
}

/**
 * Helper to calculate average from date-indexed data
 */
export function calculateAverage<T>(
  data: Record<string, T>,
  getValue: (item: T) => number | null
): number {
  const values = Object.values(data)
    .map(getValue)
    .filter((v): v is number => v !== null)
  
  if (values.length === 0) return 0
  return values.reduce((sum, v) => sum + v, 0) / values.length
}

/**
 * Helper to calculate sum from date-indexed data
 */
export function calculateSum<T>(
  data: Record<string, T>,
  getValue: (item: T) => number
): number {
  return Object.values(data).reduce((sum, item) => sum + getValue(item), 0)
}

/**
 * Helper to calculate trend (percentage change vs previous period)
 */
export function calculateTrend(
  currentValue: number,
  previousValue: number
): { direction: 'up' | 'down' | 'neutral'; value: number } {
  if (previousValue === 0) {
    return { direction: currentValue > 0 ? 'up' : 'neutral', value: 0 }
  }
  
  const change = ((currentValue - previousValue) / previousValue) * 100
  const direction = change > 0 ? 'up' : change < 0 ? 'down' : 'neutral'
  
  return { direction, value: Math.round(Math.abs(change)) }
}

/**
 * Helper to generate date array between start and end
 */
export function generateDateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = []
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dates.push(d.toISOString().split('T')[0])
  }
  
  return dates
}

/**
 * Helper to format date for chart labels
 */
export function formatDateLabel(date: string, format: 'short' | 'medium' | 'long' = 'short'): string {
  const d = new Date(date)
  
  switch (format) {
    case 'short':
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    case 'medium':
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })
    case 'long':
      return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    default:
      return date
  }
}
