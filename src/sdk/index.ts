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
} from './types'

// Services (for advanced use cases)
export { createPluginLogger, createPluginFirestore } from './services'

// Helper to create plugin context
export { createPluginContext } from './services/plugin-context.service'

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
  Section
} from './ui'
