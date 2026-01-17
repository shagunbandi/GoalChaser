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
  StatItem as SDKStatItem,
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
