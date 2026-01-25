/**
 * Insights Types
 * 
 * Types for the new insights system that separates time-agnostic stats
 * from period-specific analysis.
 */

/**
 * Time-agnostic quick stats
 * Shows streaks and all-time metrics that don't depend on a date range
 */
export interface PluginQuickStats {
  /** Streaks per category (area/subject/etc) */
  streaks?: StreakStat[]
  
  /** General metrics (all-time totals) */
  metrics?: MetricStat[]
}

/**
 * Streak statistic for a specific category
 */
export interface StreakStat {
  /** Category label (e.g., "Frontend", "Mathematics") */
  label: string
  
  /** Current streak in days/weeks/months */
  current: number
  
  /** Longest streak ever achieved */
  longest: number
  
  /** Optional emoji icon */
  icon?: string
  
  /** Color for visualization (hex format) */
  color?: string
  
  /** Streak unit ('day', 'week', 'month') */
  unit?: string
  
  /** Goal configuration (e.g., "2x/week", "daily") */
  goal?: string
  
  /** Weekly average (visits per week) */
  weeklyAvg?: number
}

/**
 * General metric statistic
 */
export interface MetricStat {
  /** Metric label */
  label: string
  
  /** Metric value (can be number, formatted string, or object with daily/weekly/monthly for averages) */
  value: string | number | { daily: string; weekly: string; monthly: string }
  
  /** Optional subtitle/description */
  subtitle?: string
  
  /** Optional emoji icon */
  icon?: string
  
  /** Color for visualization (hex format) */
  color?: string
}

/**
 * Period-specific insights
 * Insights calculated for a specific date range
 */
export interface PluginPeriodInsights {
  /** Summary metrics for the period */
  summary?: MetricStat[]
  
  /** Charts and visualizations */
  charts?: InsightChart[]
  
  /** Breakdown by category (areas, subjects, etc.) */
  breakdown?: BreakdownItem[]
}

/**
 * Chart configuration for insights
 */
export interface InsightChart {
  /** Chart type */
  type: 'line' | 'bar' | 'pie' | 'heatmap'
  
  /** Chart title */
  title: string
  
  /** Chart data (structure depends on chart type) */
  data: any
  
  /** Size hint for layout */
  size?: 'small' | 'medium' | 'large'
}

/**
 * Breakdown item for category analysis
 */
export interface BreakdownItem {
  /** Category label (e.g., "Frontend", "Mathematics") */
  label: string
  
  /** Primary value (e.g., "45h", "8h 30m") */
  value: string
  
  /** Number of days/visits in the period */
  count: number
  
  /** Additional details (e.g., "12 days, 8 topics") */
  details?: string
  
  /** Percentage for progress bar (0-100) */
  percentage?: number
  
  /** Optional emoji icon */
  icon?: string
  
  /** Color for visualization (hex format) */
  color?: string
}

/**
 * Time range option for period selection
 */
export interface TimeRangeOption {
  /** Display label (e.g., "Last 7 days") */
  label: string
  
  /** Number of days to look back */
  days: number
  
  /** Optional unique identifier */
  id?: string
}

/**
 * Default time range options
 */
export const DEFAULT_TIME_RANGES: TimeRangeOption[] = [
  { label: 'Last 7 days', days: 7, id: 'last-7' },
  { label: 'Last 30 days', days: 30, id: 'last-30' },
  { label: 'Last 90 days', days: 90, id: 'last-90' },
  { label: 'Last 6 months', days: 180, id: 'last-180' },
  { label: 'Last year', days: 365, id: 'last-365' },
]
