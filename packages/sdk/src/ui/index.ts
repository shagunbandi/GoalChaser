/**
 * UI components that plugins can use
 * Presentational primitives and composed UI
 */

export { Card } from './Card'
export { CardHeader } from './CardHeader'
export { Modal } from './Modal'
export { Tabs } from './Tabs'
export type { Tab } from './Tabs'
export { MultiSelectDropdown } from './MultiSelectDropdown'

export { Input, TextArea, Select, FormActions, Section } from './forms'
export type { SelectOption } from './forms'

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

export {
  EmptyState,
  DataLoadingState,
  LoadingSpinner,
  type EmptyStateProps,
  type LoadingStateProps,
} from './EmptyState'

export * from './calendar-renderers'
export {
  MonthCalendar,
  type CalendarIndicator,
  type DayCustomization,
  type DayRenderInfo,
  type MonthCalendarProps,
} from './MonthCalendar'

export { LineChart, BarChart, PieChart, HeatMap } from '../analytics/charts'
export type {
  LineChartProps,
  BarChartProps,
  PieChartProps,
  HeatMapProps,
} from '../analytics/charts'

export { NotesField, type NotesFieldProps } from './NotesField'
export { InsightsMap, type InsightsMapMarker, type InsightsMapPolyline } from './InsightsMap'
export type { InsightsMapProps } from './InsightsMap'
