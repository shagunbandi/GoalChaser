import type { ReactNode } from 'react'

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
     * @param context Optional context information (goalId, etc.) for building navigation URLs
     * @returns CalendarDaySummary or null if no summary to show
     */
    getDaySummary: (
      date: string,
      data: TDayData | null,
      context?: { goalId?: string }
    ) => CalendarDaySummary | null
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
  type: 'chip' | 'accordion' | 'card' | 'custom'

  /** Title/heading for the summary */
  title: string

  /** Content to display (can be string, number, or structured data) */
  content: string | number | Record<string, any>

  /** Icon or emoji to display */
  icon?: string

  /** Optional color override for the summary (different from dot color) */
  color?: string

  /** Action buttons to show in the summary */
  actions?: CalendarSummaryAction[]

  /** Custom render function (for type: 'custom') */
  customRender?: () => ReactNode
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
 * Analytics Chart Data
 * Configuration for rendering a chart in the analytics dashboard
 */
export interface PluginAnalyticsChartData {
  /** Type of chart to render */
  chartType: 'line' | 'bar' | 'pie' | 'heatmap'

  /** Chart title */
  title: string

  /** Chart data */
  data: {
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
   */
  renderDetail(
    data: TDayData | null,
    date: string,
    onUpdate: (data: Partial<TDayData>) => Promise<void>
  ): ReactNode
}
