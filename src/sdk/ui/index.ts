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

// Chart components for analytics
export * from './charts'

// Notes field component
export { NotesField, type NotesFieldProps } from './NotesField'
