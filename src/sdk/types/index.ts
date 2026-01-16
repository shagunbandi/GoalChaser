/**
 * Shared types that plugins can use
 * These are types from the core app that are safe to expose to plugins
 */

// Re-export commonly used types from core
export type {
  DayStatus,
  DayInfo,
  MonthInfo,
  TimeRangeType,
  TimeRange,
} from '@/types'

/**
 * Plugin-safe goal information
 */
export interface PluginGoalInfo {
  id: string
  name: string
  description?: string
  color?: string
  startDate?: string
  endDate?: string
}

/**
 * Generic day data structure
 */
export interface GenericDayData {
  [key: string]: any
}

/**
 * Generic config structure
 */
export interface GenericConfig {
  [key: string]: any
}

/**
 * Base interface for plugin day-level data
 * Plugins should extend this for their specific day data
 * 
 * @example
 * interface TravelDayData extends PluginDayData {
 *   travelPlans: TravelPlan[]
 * }
 */
export interface PluginDayData extends GenericDayData {}

/**
 * Base interface for plugin configuration
 * Plugins should extend this for their specific config
 * 
 * @example
 * interface ProductivityConfig extends PluginConfigData {
 *   areas: AreaConfig[]
 * }
 */
export interface PluginConfigData extends GenericConfig {}

/**
 * Base interface for activity/summary items
 * Used in activity cards and summary displays
 */
export interface ActivityItem {
  id: string
  label?: string
  [key: string]: unknown
}

// View-related types
export type { ViewType, StatItem } from './view.types'
