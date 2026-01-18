/**
 * Goal Chaser Plugin SDK
 * 
 * This SDK provides everything a plugin needs to integrate with Goal Chaser.
 * Plugins should ONLY import from this SDK, never from core app internals.
 */

// Core interfaces
export type {
  Plugin,
  PluginMetadata,
  PluginRoute,
  PluginPageProps,
  PluginContext,
  PluginFirestore,
  PluginLogger,
  PluginDataProvider,
  PluginSummaryProvider,
  PluginSummaryData,
  PluginDetailProvider,
  CalendarDaySummary,
  CalendarSummaryConfig,
  CalendarSummaryAction,
  PluginAnalyticsMetric,
  PluginAnalyticsChartData,
  ChartSize,
  StatItem as SDKStatItem,
  StatSection,
  ListItem,
} from './interfaces/plugin.interface'

// Shared types
export type {
  PluginGoalInfo,
  GenericDayData,
  GenericConfig,
  PluginDayData,
  PluginConfigData,
  ActivityItem,
  DayStatus,
  DayInfo,
  MonthInfo,
  TimeRangeType,
  TimeRange,
  ViewType,
  StatItem,
} from './types'

// Services (for advanced use cases)
export { createPluginLogger, createPluginFirestore } from './services'

// Helper to create plugin context
export { createPluginContext } from './services/plugin-context.service'

// Hooks
export { usePluginPage, useMonthCalendar } from './hooks'
export type { UseMonthCalendarOptions, UseMonthCalendarReturn } from './hooks'

// Utilities
export * from './utils'

// Components
export { LoadingState, NotFoundState, PluginMonthView, Drawer } from './components'
export type { PluginMonthViewProps } from './components'

// UI components
export { 
  Card, 
  CardHeader, 
  Modal, 
  Tabs, 
  StatusBar,
  Input,
  TextArea,
  Select,
  FormActions,
  Section,
  MonthCalendar,
  NotesField
} from './ui'

// UI component types
export type { NotesFieldProps } from './ui'

// UI types
export type {
  CalendarIndicator,
  DayCustomization,
  DayRenderInfo,
  MonthCalendarProps
} from './ui'

// Analytics components and utilities
export {
  // Charts
  LineChart,
  BarChart,
  PieChart,
  HeatMap,
  // Analytics components
  MetricCard,
  StreakDisplay,
  // Filter components
  DateRangeSelector,
  PluginFilter,
  // Utility functions
  calculateStreak,
  calculateAverage,
  calculateSum,
  calculateTrend,
  generateDateRange,
  formatDateLabel,
} from './analytics'

// Analytics types
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
} from './analytics'
