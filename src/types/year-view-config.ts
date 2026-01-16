import { ReactNode } from 'react'

// Button configuration
export type ButtonConfig = {
  id: string
  label: string
  icon?: string
  color?: 'primary' | 'success' | 'danger' | 'warning' | 'info' | 'purple' | 'secondary'
  variant?: 'solid' | 'ghost'
  disabled?: boolean
  onClick: () => void
}

// Day appearance configuration
export type DayIndicator = {
  type: 'travel' | 'expense' | 'income' | 'sip'
  color?: string // optional custom color
  count?: number // for multiple items
}

export type DayConfig = {
  iso: string
  dayOfMonth: number
  weekdayIndex: number
  highlighted?: boolean
  highlightColor?: string
  indicators: DayIndicator[]
  onClick?: () => void
}

// Month footer configuration
export type MonthFooterItem = {
  id: string
  type: 'budget' | 'sip' | 'travel' | 'custom'
  title: string
  subtitle?: string
  icon?: string
  color?: string
  actionButton?: {
    icon: string
    onClick: () => void
  }
}

// Modal section configuration
export type ModalSection = {
  id: string
  type: 'list' | 'card' | 'summary' | 'custom'
  content: ReactNode | (() => ReactNode)
}

// Legend configuration
export type LegendItem = {
  label: string
  color: string
  icon?: string
}

// Header configuration
export type HeaderConfig = {
  icon: string
  title: string
  legends?: LegendItem[]
  stats?: Array<{
    label: string
    value: string | number
    disabled?: boolean
  }>
  actions: ButtonConfig[]
}

// Month configuration
export type MonthConfig = {
  month: number
  year: number
  headerRight?: ReactNode
  days: DayConfig[]
  footer: MonthFooterItem[]
}

// Complete year view configuration
export type YearViewConfig = {
  year: number
  todayISO: string
  header: HeaderConfig
  months: MonthConfig[]
  modal: {
    getSections: (date: string) => ModalSection[]
    getActions: (date: string) => ButtonConfig[]
  }
  onPrevYear: () => void
  onNextYear: () => void
  onDaySelect?: (date: string | null) => void
}
