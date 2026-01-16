import type { BudgetPlan, BudgetCategory, Expense } from '../types'

interface BudgetPeriodConfig {
  name: string
  income: number
  categories: BudgetCategory[]
  frequency: 'monthly' | 'one-time'
  startDay: number // Day of month (1-31)
  firstPeriodStart: string // ISO date
  duration: { type: 'count' | 'endDate'; value: number | string }
  note?: string
}

/**
 * Generate multiple budget periods for recurring budgets
 */
export function generateBudgetPeriods(config: BudgetPeriodConfig): BudgetPlan[] {
  const {
    name,
    income,
    categories,
    frequency,
    startDay,
    firstPeriodStart,
    duration,
    note,
  } = config

  if (frequency === 'one-time') {
    // For one-time budgets, use the provided dates directly
    const endDate = duration.type === 'endDate' 
      ? duration.value as string 
      : firstPeriodStart

    return [{
      id: `budget_${Date.now()}`,
      name,
      income,
      categories,
      startDate: firstPeriodStart,
      endDate,
      note,
      isRecurring: false,
    }]
  }

  const parentId = `budget_${Date.now()}`
  const periods: BudgetPlan[] = []

  if (frequency === 'monthly') {
    periods.push(...generateMonthlyPeriods(config, parentId))
  }

  return periods
}

/**
 * Generate monthly budget periods
 */
function generateMonthlyPeriods(
  config: BudgetPeriodConfig,
  parentId: string
): BudgetPlan[] {
  const { name, income, categories, startDay, firstPeriodStart, duration, note } = config
  const periods: BudgetPlan[] = []
  
  const firstDate = new Date(firstPeriodStart)
  const firstYear = firstDate.getFullYear()
  const firstMonth = firstDate.getMonth()

  let endCondition: (year: number, month: number, index: number) => boolean

  if (duration.type === 'count') {
    const numPeriods = duration.value as number
    endCondition = (year, month, index) => index < numPeriods
  } else {
    const endDate = new Date(duration.value as string)
    endCondition = (year, month) => {
      const periodEndStr = getMonthEnd(year, month, startDay)
      const periodEndDate = new Date(periodEndStr)
      return periodEndDate <= endDate
    }
  }

  let periodIndex = 0
  let currentYear = firstYear
  let currentMonth = firstMonth

  while (endCondition(currentYear, currentMonth, periodIndex)) {
    const periodStart = getMonthStart(currentYear, currentMonth, startDay, periodIndex === 0)
    const periodEnd = getMonthEnd(currentYear, currentMonth, startDay)

    periods.push({
      id: `${parentId}_period_${periodIndex}`,
      name: `${name} - ${getMonthName(currentMonth)} ${currentYear}`,
      income,
      categories: categories.map(c => ({ ...c })), // Clone categories
      startDate: periodStart,
      endDate: periodEnd,
      note,
      isRecurring: true,
      frequency: 'monthly',
      startDay,
      parentBudgetId: parentId,
      periodIndex,
    })

    // Move to next month
    currentMonth++
    if (currentMonth > 11) {
      currentMonth = 0
      currentYear++
    }
    periodIndex++
  }

  return periods
}

/**
 * Get the start date for a monthly period
 */
function getMonthStart(
  year: number,
  month: number,
  startDay: number,
  isFirstPeriod: boolean
): string {
  if (isFirstPeriod) {
    // First period might start mid-month
    const date = new Date(year, month, Math.min(startDay, getDaysInMonth(year, month)))
    return date.toISOString().split('T')[0]
  }
  
  // Subsequent periods start on the 1st of the month
  return new Date(year, month, 1).toISOString().split('T')[0]
}

/**
 * Get the end date for a monthly period
 */
function getMonthEnd(year: number, month: number, startDay: number): string {
  // If this is the first period and starts mid-month, end at month end
  // Otherwise, calculate based on start day
  const daysInMonth = getDaysInMonth(year, month)
  const endDay = daysInMonth
  
  return new Date(year, month, endDay).toISOString().split('T')[0]
}

/**
 * Get number of days in a month
 */
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

/**
 * Get month name
 */
function getMonthName(month: number): string {
  const names = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ]
  return names[month]
}
