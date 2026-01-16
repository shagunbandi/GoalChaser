import type {
  DayDetails,
  SubjectConfig,
  ProductivitySummaryData,
  HoursSummaryData,
  FinanceSummaryData,
  TravelSummaryData,
  AgendaSummaryData,
} from '@/types'

/**
 * Extract productivity data for a specific date
 */
export function extractProductivityData(
  dayDetails: Record<string, DayDetails>,
  date: string
): ProductivitySummaryData {
  const details = dayDetails[date]
  const score = details?.status ?? null
  const areas = details?.areas || []
  
  return {
    addon: 'productivity',
    hasData: score !== null || areas.length > 0,
    score,
    areas,
  }
}

/**
 * Extract hours data for a specific date
 */
export function extractHoursData(
  dayDetails: Record<string, DayDetails>,
  date: string,
  subjectConfigs: SubjectConfig[]
): HoursSummaryData {
  const details = dayDetails[date]
  const subjects = details?.subjects || []
  const directHours = details?.directHours || 0
  
  // Calculate total hours from subjects
  const subjectHours = subjects.reduce((sum, s) => sum + (s.hours || 0), 0)
  
  // Use subject hours if any, otherwise use direct hours
  const totalHours = subjectHours > 0 ? subjectHours : directHours
  
  return {
    addon: 'hours',
    hasData: totalHours > 0 || subjects.length > 0,
    totalHours,
    subjects,
    directHours,
  }
}

/**
 * Extract finance data for a specific date
 */
export function extractFinanceData(
  dayDetails: Record<string, DayDetails>,
  date: string
): FinanceSummaryData {
  const details = dayDetails[date]
  const expenses = details?.expenses || []
  const income = details?.income || []
  
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
  const totalIncome = income.reduce((sum, i) => sum + i.amount, 0)
  const netAmount = totalIncome - totalExpenses
  
  return {
    addon: 'finance',
    hasData: expenses.length > 0 || income.length > 0,
    expenses,
    income,
    totalExpenses,
    totalIncome,
    netAmount,
  }
}

/**
 * Extract travel data for a specific date
 */
export function extractTravelData(
  dayDetails: Record<string, DayDetails>,
  date: string
): TravelSummaryData {
  const details = dayDetails[date]
  const travelPlans = details?.travelPlans || []
  
  return {
    addon: 'travel',
    hasData: travelPlans.length > 0,
    travelPlans,
  }
}

/**
 * Extract agenda data for a specific date
 */
export function extractAgendaData(
  dayDetails: Record<string, DayDetails>,
  date: string
): AgendaSummaryData {
  const details = dayDetails[date]
  const agendaItems = details?.agendaItems || []
  
  const completedCount = agendaItems.filter(item => item.completed).length
  const totalCount = agendaItems.length
  
  return {
    addon: 'calendar',
    hasData: agendaItems.length > 0,
    agendaItems,
    completedCount,
    totalCount,
  }
}
