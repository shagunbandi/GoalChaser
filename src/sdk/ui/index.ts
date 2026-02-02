/**
 * UI components that plugins can use
 * Re-exports from the core UI library
 */

export { Card } from '@/components/ui/Card'
export { CardHeader } from '@/components/ui/CardHeader'
export { Modal } from '@/components/ui/Modal'
export { Tabs } from '@/components/ui/Tabs'
export { StatusBar } from '@/components/ui/StatusBar'

// Form components
export { Input, TextArea, Select, FormActions, Section } from '@/components/ui/forms'

// Summary components
export {
  SummaryCard,
  ActionButton,
  StatGrid,
  ItemList,
  type SummaryCardProps,
  type ActionButtonProps,
  type StatGridProps,
  type ItemListProps,
} from './SummaryCard'

// Empty and Loading states
export {
  EmptyState,
  DataLoadingState,
  LoadingSpinner,
  type EmptyStateProps,
  type LoadingStateProps,
} from './EmptyState'

// Calendar components
export * from './calendar-renderers'
export {
  MonthCalendar,
  type CalendarIndicator,
  type DayCustomization,
  type DayRenderInfo,
  type MonthCalendarProps,
} from './MonthCalendar'

// Chart components for analytics - re-export from analytics module
export {
  LineChart,
  BarChart,
  PieChart,
  HeatMap,
} from '../analytics/charts'

export type {
  LineChartProps,
  BarChartProps,
  PieChartProps,
  HeatMapProps,
} from '../analytics/charts'

// Notes field component
export { NotesField, type NotesFieldProps } from './NotesField'

// Map component for insights (Leaflet, data-driven)
export { InsightsMap, type InsightsMapMarker, type InsightsMapPolyline } from './InsightsMap'
export type { InsightsMapProps } from './InsightsMap'
