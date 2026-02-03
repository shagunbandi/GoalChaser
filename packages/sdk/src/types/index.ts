/**
 * Shared types that plugins can use
 */

export type DayStatus = number | null

export interface DayInfo {
  date: Date
  iso: string
  dayOfMonth: number
  weekdayIndex: number
}

export interface MonthInfo {
  year: number
  month: number
  days: DayInfo[]
}

export type TimeRangeType = 'week' | 'month' | 'year' | 'custom'

export interface TimeRange {
  type: TimeRangeType
  startDate: string
  endDate: string
  label: string
}

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

// AI integration types
export type {
  AIFieldType,
  AIInputField,
  PluginAISchema,
  AIExtractionResult,
  AIExtractRequest,
  AIExtractResponse,
  PluginAIIntegration,
  AIPreviewData,
  AIWizardFlowProps,
} from './ai.types'

// Insights types
export type {
  PluginQuickStats,
  PluginPeriodInsights,
  StreakStat,
  MetricStat,
  InsightChart,
  BreakdownItem,
  TimeRangeOption,
  InsightsCustomViewProps,
} from './insights.types'

export { DEFAULT_TIME_RANGES } from './insights.types'

// Chat integration types
export type {
  ChatMessage,
  ChatResponse,
  PluginChatConfig,
  ChatInterfaceProps,
  AIChatInterfaceProps,
} from './chat.types'
