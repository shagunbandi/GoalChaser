import type { ReactNode } from 'react'
import type { PluginAIIntegration } from '../types/ai.types'
import type { PluginQuickStats, PluginPeriodInsights, TimeRangeOption, InsightsCustomViewProps } from '../types/insights.types'

/**
 * Core plugin interface that all plugins must implement
 */
export interface Plugin<TDayData = any, TConfig = any> {
  /** Unique plugin identifier */
  id: string

  /** Plugin metadata for UI display */
  metadata: PluginMetadata

  /** Routes this plugin provides */
  routes: PluginRoute[]

  /** Data provider for reading/writing plugin data */
  dataProvider: PluginDataProvider<TDayData, TConfig>

  /** Optional: Provides summary data for calendar view (legacy) */
  summaryProvider?: PluginSummaryProvider<TDayData>

  /** Optional: Provides UI for plugin-specific detail panel */
  detailProvider?: PluginDetailProvider<TDayData>

  /** Optional: Calendar integration for dots and summaries */
  calendar?: {
    /**
     * Generate calendar summary for a specific date
     * @param date ISO date string (YYYY-MM-DD)
     * @param data Day data for this plugin (or null if no data)
     * @param context Optional context information (goalId, allMonthData, etc.) for building navigation URLs
     * @returns CalendarDaySummary or null if no summary to show
     */
    getDaySummary: (
      date: string,
      data: TDayData | null,
      context?: { goalId?: string; allMonthData?: Record<string, TDayData> }
    ) => CalendarDaySummary | null

    /**
     * Get background color/style for a calendar day
     * Used by CalendarPage to color day cells based on plugin data
     * @param data Day data for this plugin (or null if no data)
     * @returns Background color and optional style, or null if no background
     */
    getCalendarBackground?: (data: TDayData | null) => {
      backgroundColor?: string
      style?: React.CSSProperties
    } | null
  }

  /** Optional: Analytics integration for charts and metrics */
  analytics?: {
    /**
     * Simple metrics (config-based)
     * Static metrics that don't require date range filtering
     */
    metrics?: PluginAnalyticsMetric[]

    /**
     * Complex analytics (method-based)
     * Generate chart data for a specific date range
     * @param startDate ISO date string (YYYY-MM-DD)
     * @param endDate ISO date string (YYYY-MM-DD)
     * @param data Date-indexed data for the date range
     * @returns Array of chart configurations
     */
    getAnalyticsData?: (
      startDate: string,
      endDate: string,
      data: Record<string, TDayData>
    ) => PluginAnalyticsChartData[]
  }

  /** Optional: Insights integration (replaces analytics in new system) */
  insights?: {
    /**
     * Time-agnostic insights (streaks, all-time totals)
     * @param allData All available data for this plugin (no date filtering)
     * @param config Plugin configuration (optional)
     * @returns Quick stats to display
     */
    getQuickStats?: (allData: Record<string, TDayData>, config?: TConfig | null) => PluginQuickStats
    
    /**
     * Period-specific insights
     * @param startDate ISO date string (YYYY-MM-DD)
     * @param endDate ISO date string (YYYY-MM-DD)
     * @param data Date-indexed data for the date range
     * @param config Plugin configuration (optional)
     * @returns Period insights to display
     */
    getPeriodInsights?: (
      startDate: string,
      endDate: string,
      data: Record<string, TDayData>,
      config?: TConfig | null
    ) => PluginPeriodInsights
    
    /**
     * Default time range options for this plugin
     * If not provided, uses global defaults
     */
    defaultTimeRanges?: TimeRangeOption[]

    /**
     * Optional custom view component (e.g. map + dates table for travel)
     * Rendered in Insights tab when this plugin is active
     */
    customView?: React.ComponentType<InsightsCustomViewProps<TDayData, TConfig>>
  }

  /** Optional: AI integration for natural language data extraction */
  aiIntegration?: PluginAIIntegration<TDayData, TConfig>
}

/**
 * Plugin metadata
 */
export interface PluginMetadata {
  /** Display name */
  name: string

  /** Emoji or icon identifier */
  icon: string

  /** Short description */
  description: string

  /** Plugin version */
  version: string

  /** Whether this is a primary plugin (always enabled, cannot be disabled) */
  isPrimary: boolean

  /** Whether this plugin should be enabled by default for new goals */
  enabledByDefault?: boolean
}

/**
 * Plugin route definition
 */
export interface PluginRoute {
  /** Route path segment (e.g., 'productivity', 'finance/2024') */
  path: string

  /** React component to render for this route */
  component: React.ComponentType<PluginPageProps>

  /** Whether this route requires a year parameter */
  requiresYear?: boolean
}

/**
 * Props passed to plugin page components
 */
export interface PluginPageProps {
  /** Plugin context with scoped access */
  context: PluginContext

  /** Current year (if route requires it) */
  year?: number

  /** Current month (1-12, if route includes it) */
  month?: number

  /** Route parameters */
  params: {
    id: string // goalId
    plugin: string[] // plugin route segments
  }
}

/**
 * Context provided to plugins for accessing core services
 */
export interface PluginContext {
  /** Current user ID */
  userId: string

  /** Current goal ID */
  goalId: string

  /** Scoped Firestore access */
  firestore: PluginFirestore

  /** Logger service */
  logger: PluginLogger

  /** Goal metadata (read-only) */
  goal?: {
    name: string
    color?: string
    startDate?: string
    endDate?: string
  }
}

/**
 * Scoped Firestore interface for plugins
 * Automatically scopes all operations to: users/{userId}/goals/{goalId}/addons/{pluginId}/
 */
export interface PluginFirestore {
  /** Get a scoped collection reference */
  collection: (path: string) => any // Firestore CollectionReference

  /** Get a scoped document reference */
  doc: (path: string) => any // Firestore DocumentReference

  /** Create a write batch (commit many writes in one round-trip) */
  writeBatch?: () => any // Firestore WriteBatch

  /** Query helper */
  query: (collectionRef: any, ...queryConstraints: any[]) => any

  /** Firestore functions (where, orderBy, etc.) */
  where: any
  orderBy: any
  limit: any
  getDocs: any
  getDoc: any
  setDoc: any
  deleteDoc: any
}

/**
 * Logger interface for plugins
 */
export interface PluginLogger {
  info: (message: string, ...args: any[]) => void
  error: (message: string, error?: any) => void
  warn: (message: string, ...args: any[]) => void
  success: (message: string) => void
  progress: (message: string) => void
}

/**
 * Data provider interface for plugin data operations
 */
export interface PluginDataProvider<TDayData = any, TConfig = any> {
  /**
   * Load data for a specific date
   * @param context Plugin context
   * @param date ISO date string (YYYY-MM-DD)
   */
  loadDayData(context: PluginContext, date: string): Promise<TDayData | null>

  /**
   * Load data for a date range
   * @param context Plugin context
   * @param startDate ISO date string (YYYY-MM-DD)
   * @param endDate ISO date string (YYYY-MM-DD)
   */
  loadDateRange(
    context: PluginContext,
    startDate: string,
    endDate: string
  ): Promise<Record<string, TDayData>>

  /**
   * Save data for a specific date
   * @param context Plugin context
   * @param date ISO date string (YYYY-MM-DD)
   * @param data Data to save
   */
  saveDayData(context: PluginContext, date: string, data: Partial<TDayData>): Promise<boolean>

  /**
   * Save many days in one batch (optional). Use for multi-day updates to avoid N round-trips.
   * If not implemented, core will fall back to calling saveDayData in a loop.
   */
  saveDayDataBatch?(
    context: PluginContext,
    updates: Array<{ date: string; data: Partial<TDayData> }>,
  ): Promise<void>

  /**
   * Load plugin configuration (optional)
   * @param context Plugin context
   */
  loadConfig?(context: PluginContext): Promise<TConfig | null>

  /**
   * Save plugin configuration (optional)
   * @param context Plugin context
   * @param config Configuration to save
   */
  saveConfig?(context: PluginContext, config: TConfig): Promise<boolean>
}

/**
 * Summary provider for calendar integration
 */
export interface PluginSummaryProvider<TDayData = any> {
  /**
   * Generate summary for a specific day
   * @param data Day data for this plugin
   * @param date ISO date string
   */
  generateSummary(data: TDayData | null, date: string): PluginSummaryData
}

/**
 * Summary data for calendar display (legacy)
 * @deprecated Use CalendarDaySummary instead
 */
export interface PluginSummaryData {
  /** Main label (e.g., "8 hours", "7/10", "3 tasks") */
  label?: string

  /** Detailed text (e.g., "Math: 3hrs, Physics: 2hrs") */
  details?: string

  /** Icon or emoji */
  icon?: string

  /** Color indicator */
  color?: string

  /** Whether this day has data */
  hasData: boolean
}

/**
 * Calendar integration for plugins
 * Allows plugins to provide:
 * - Colored dot indicators on calendar days
 * - Summary data for the detail panel
 */
export interface CalendarDaySummary {
  /** Color for the dot indicator (hex format, e.g., "#007AFF") */
  color: string

  /** Whether to show a dot for this day */
  hasData: boolean

  /** Summary configuration for the detail panel */
  summary?: CalendarSummaryConfig
}


/**
 * Configuration for how the summary should be rendered in the detail panel
 */
export interface CalendarSummaryConfig {
  /** Rendering type */
  type: 'chip' | 'accordion' | 'card' | 'stats' | 'list' | 'custom'

  /** Title/heading for the summary */
  title: string

  /** Subtitle or description (optional) */
  subtitle?: string

  /** Content to display (can be string, number, or structured data) */
  content?: string | number | Record<string, any>

  /** Icon or emoji to display */
  icon?: string

  /** Optional color override for the summary (different from dot color) */
  color?: string

  /** Gradient colors for more visual appeal */
  gradient?: {
    from: string
    to: string
  }

  /** Stats items (for type: 'stats') */
  stats?: StatItem[]

  /** Sectioned stats (for type: 'stats' with multiple groups) */
  sections?: StatSection[]

  /** List items (for type: 'list') */
  items?: ListItem[]

  /** Action buttons to show in the summary */
  actions?: CalendarSummaryAction[]

  /** Badge text (e.g., "New", "Updated", count badge) */
  badge?: string | number

  /** Custom render function (for type: 'custom') */
  customRender?: () => ReactNode
}

/**
 * Stat item for stats display
 */
export interface StatItem {
  label: string
  value: string | number
  icon?: string
  color?: string
  subtitle?: string
}

/**
 * Section of stats for grouped display
 */
export interface StatSection {
  title: string
  stats: StatItem[]
}

/**
 * List item for list display
 */
export interface ListItem {
  id: string
  label: string
  value?: string | number
  icon?: string
  color?: string
  subtitle?: string
  onClick?: () => void
}

/**
 * Action button configuration for summaries
 */
export interface CalendarSummaryAction {
  /** Button label */
  label: string

  /** Navigation URL (if provided, will be used instead of onClick) */
  url?: string

  /** Click handler (optional if url is provided) */
  onClick?: () => void

  /** Optional icon */
  icon?: string

  /** Button variant */
  variant?: 'primary' | 'secondary' | 'danger'
}

/**
 * Analytics Metric
 * Simple key-value metric that a plugin can expose
 */
export interface PluginAnalyticsMetric {
  /** Unique identifier for this metric */
  id: string

  /** Display label */
  label: string

  /** Numeric value */
  value: number

  /** Optional unit (e.g., "hours", "$", "%") */
  unit?: string

  /** Color for visual representation (hex format) */
  color?: string

  /** Icon or emoji */
  icon?: string

  /** Trend indicator */
  trend?: 'up' | 'down' | 'neutral'

  /** Trend value (e.g., +5%, -3%) */
  trendValue?: number
}

/**
 * Chart size for layout purposes
 * - small: 1/4 width (metric cards)
 * - medium: 1/2 width (pie charts, streak)
 * - large: full width (line charts, heatmaps)
 */
export type ChartSize = 'small' | 'medium' | 'large'

/**
 * Analytics Chart Data
 * Configuration for rendering a chart in the analytics dashboard
 */
export interface PluginAnalyticsChartData {
  /** Type of chart to render */
  chartType: 'line' | 'bar' | 'pie' | 'heatmap' | 'metric' | 'streak'

  /** Chart title */
  title: string

  /** Size hint for layout (default: based on chart type) */
  size?: ChartSize

  /** Chart data (for line, bar, pie charts) */
  data?: {
    /** Labels for x-axis or categories */
    labels: string[]

    /** Dataset(s) to plot */
    datasets: Array<{
      /** Dataset label/name */
      label: string

      /** Data points corresponding to labels */
      data: number[]

      /** Color for this dataset (hex format) */
      color?: string
    }>
  }

  /** Optional: For heatmap, provide date-value mapping */
  heatmapData?: Record<string, number>

  /** Optional: Date range for heatmap */
  dateRange?: {
    start: string
    end: string
  }

  /** Optional: For metric card display */
  metricData?: {
    /** Label for the metric */
    label: string
    /** The value to display */
    value: number | string
    /** Optional unit (e.g., "/10", "hrs", "$") */
    unit?: string
    /** Optional icon emoji */
    icon?: string
    /** Primary color */
    color?: string
    /** Optional subtitle */
    subtitle?: string
    /** Trend information */
    trend?: {
      direction: 'up' | 'down' | 'neutral'
      value: number
    }
  }

  /** Optional: For streak display */
  streakData?: {
    /** Current active streak */
    currentStreak: number
    /** Longest streak achieved */
    longestStreak: number
    /** Unit label (e.g., "days", "sessions") */
    unit?: string
    /** Icon emoji */
    icon?: string
    /** Primary color */
    color?: string
    /** Description of what counts as a streak day */
    description?: string
  }
}

/**
 * Detail provider for calendar detail panel
 */
export interface PluginDetailProvider<TDayData = any> {
  /**
   * Render detail view for a specific day
   * @param data Day data for this plugin
   * @param date ISO date string
   * @param onUpdate Callback to update data
   * @param context Optional context data (e.g., config, callbacks)
   */
  renderDetail(
    data: TDayData | null,
    date: string,
    onUpdate: (data: Partial<TDayData>) => Promise<void>,
    context?: any
  ): ReactNode
}
