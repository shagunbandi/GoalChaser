/**
 * View-related types for unified plugin views
 */

/**
 * View type for different plugin views
 */
export type ViewType = 'year' | 'month' | 'day'

/**
 * Statistic item for displaying aggregated data
 */
export interface StatItem {
  label: string
  value: string | number
  icon?: string
  color?: string
  trend?: {
    value: number
    direction: 'up' | 'down' | 'neutral'
  }
}
