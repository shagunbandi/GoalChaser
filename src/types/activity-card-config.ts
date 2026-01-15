import { ReactNode } from 'react'

export type ActivityCardType = 'expense' | 'income' | 'travel'

export type ActivityItem = {
  id: string
  label: string
  amount?: number
  subtitle?: string
  note?: string
}

export type ActivityCardConfig = {
  type: ActivityCardType
  icon: string
  title: string
  items: ActivityItem[]
  totalAmount?: number
  color: {
    bg: string
    border: string
    text: string
  }
  expanded: boolean
  onToggle: () => void
  onViewClick?: () => void
  collapsible?: boolean
}
