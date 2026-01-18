/**
 * Plugin Color Utilities
 * Helper functions to calculate background colors for calendar days based on plugin data
 */

import type { StudyDayData } from '@/plugins/study/types'
import type { FinanceTransactionData } from '@/plugins/finance/types'
import type { TravelDayData } from '@/plugins/travel/types'
import type { PeriodDayData } from '@/plugins/period/types'
import { getVibgyorColors } from './score-utils'

/**
 * Calculate background color for Study plugin based on tracked hours
 */
export function getStudyBackgroundColor(
  data: StudyDayData | null,
  maxHours: number = 14,
): string | undefined {
  if (!data) return undefined

  // Calculate total hours
  const totalHours =
    data.subjects?.reduce((sum, entry) => sum + (entry.hours || 0), 0) ||
    data.directHours ||
    0

  if (totalHours === 0) return undefined

  // Use VIBGYOR color based on progress (same as month view)
  const vibgyorColors = getVibgyorColors()
  
  const ratio = Math.min(totalHours / maxHours, 1)
  const colorIndex = Math.min(
    Math.floor(ratio * vibgyorColors.length),
    vibgyorColors.length - 1
  )
  const color = vibgyorColors[colorIndex].color

  // Return with 80% opacity (CC in hex)
  return `${color}CC`
}

/**
 * Calculate background color for Finance plugin based on net financial activity
 */
export function getFinanceBackgroundColor(
  data: FinanceTransactionData | null,
): string | undefined {
  if (!data) return undefined

  const hasExpenses = data.expenses && data.expenses.length > 0
  const hasIncome = data.income && data.income.length > 0

  if (!hasExpenses && !hasIncome) return undefined

  // Calculate totals
  const totalExpenses =
    data.expenses?.reduce((sum: number, e) => sum + (e.amount || 0), 0) || 0
  const totalIncome =
    data.income?.reduce((sum: number, i) => sum + (i.amount || 0), 0) || 0

  const netAmount = totalIncome - totalExpenses

  // Color based on net: positive (green), negative (red), neutral (orange)
  if (netAmount > 0) return 'bg-green-500/20'
  if (netAmount < 0) return 'bg-red-500/20'
  return 'bg-orange-500/20'
}

/**
 * Calculate background color for Travel plugin
 */
export function getTravelBackgroundColor(
  data: TravelDayData | null,
): string | undefined {
  if (!data || !data.travelPlans || data.travelPlans.length === 0) {
    return undefined
  }

  return 'bg-blue-500/20'
}

/**
 * Calculate background color for Period plugin
 */
export function getPeriodBackgroundColor(
  data: PeriodDayData | null,
): string | undefined {
  if (!data) return undefined

  if (data.isPeriod) {
    return 'bg-rose-500/30' // Rose-500 with 30% opacity for period days
  }

  return undefined
}
