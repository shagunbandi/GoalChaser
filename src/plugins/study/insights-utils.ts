/**
 * Study Insights Utilities
 * 
 * Helper functions for calculating study insights
 */

import type { StudyDayData, SubjectConfig, StreakType } from './types'
import type { StreakStat, BreakdownItem } from '@/sdk'

// ============================================================================
// Date/Week/Month Grouping Utilities
// ============================================================================

/**
 * Get ISO week number for a date (Week starts Monday)
 */
function getISOWeek(dateStr: string): string {
  const date = new Date(dateStr)
  const dayOfWeek = (date.getDay() + 6) % 7 // Monday = 0
  const thursday = new Date(date)
  thursday.setDate(date.getDate() - dayOfWeek + 3) // Thursday of this week
  
  const firstThursday = new Date(thursday.getFullYear(), 0, 4)
  const daysSinceFirstThursday = Math.round((thursday.getTime() - firstThursday.getTime()) / 86400000)
  const weekNumber = 1 + Math.floor(daysSinceFirstThursday / 7)
  
  return `${thursday.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`
}

/**
 * Get year-month key for a date
 */
function getYearMonth(dateStr: string): string {
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

/**
 * Get current ISO week
 */
function getCurrentISOWeek(): string {
  return getISOWeek(new Date().toISOString().split('T')[0])
}

/**
 * Get previous ISO week
 */
function getPreviousISOWeek(weekKey: string): string {
  const [year, weekStr] = weekKey.split('-W')
  const week = parseInt(weekStr)
  
  if (week > 1) {
    return `${year}-W${String(week - 1).padStart(2, '0')}`
  }
  
  // Go to last week of previous year
  const prevYear = parseInt(year) - 1
  return `${prevYear}-W52` // Simplified - most years have 52 weeks
}

/**
 * Get current year-month
 */
function getCurrentYearMonth(): string {
  return getYearMonth(new Date().toISOString().split('T')[0])
}

/**
 * Get previous year-month
 */
function getPreviousYearMonth(monthKey: string): string {
  const [year, monthStr] = monthKey.split('-')
  const month = parseInt(monthStr)
  
  if (month > 1) {
    return `${year}-${String(month - 1).padStart(2, '0')}`
  }
  
  // Go to December of previous year
  const prevYear = parseInt(year) - 1
  return `${prevYear}-12`
}

// ============================================================================
// Streak Calculation Functions
// ============================================================================

/**
 * Calculate weekly streak for a subject with a weekly goal
 */
function calculateWeeklyStreak(
  subject: string,
  allData: Record<string, StudyDayData>,
  targetFrequency: number
): { current: number; longest: number } {
  // Group data by week
  const weekMap = new Map<string, number>()
  
  Object.entries(allData).forEach(([date, dayData]) => {
    if (dayData?.subjects?.some(s => s.subject === subject)) {
      const weekKey = getISOWeek(date)
      weekMap.set(weekKey, (weekMap.get(weekKey) || 0) + 1)
    }
  })
  
  if (weekMap.size === 0) {
    return { current: 0, longest: 0 }
  }
  
  // Sort weeks chronologically
  const sortedWeeks = Array.from(weekMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
  
  let longest = 0
  let tempStreak = 0
  
  // Calculate longest streak
  for (const [weekKey, visits] of sortedWeeks) {
    if (visits >= targetFrequency) {
      tempStreak++
      longest = Math.max(longest, tempStreak)
    } else {
      tempStreak = 0
    }
  }
  
  // Calculate current streak (must include current or previous week)
  const currentWeek = getCurrentISOWeek()
  const previousWeek = getPreviousISOWeek(currentWeek)
  
  const recentWeeks = sortedWeeks
    .filter(([weekKey, visits]) => visits >= targetFrequency)
    .reverse()
  
  if (recentWeeks.length === 0) {
    return { current: 0, longest }
  }
  
  const [mostRecentWeek] = recentWeeks[0]
  
  // Current streak only counts if most recent successful week is current or previous
  if (mostRecentWeek !== currentWeek && mostRecentWeek !== previousWeek) {
    return { current: 0, longest }
  }
  
  // Count consecutive weeks going backwards
  let current = 1
  let expectedPrevWeek = getPreviousISOWeek(mostRecentWeek)
  
  for (let i = 1; i < recentWeeks.length; i++) {
    const [weekKey] = recentWeeks[i]
    if (weekKey === expectedPrevWeek) {
      current++
      expectedPrevWeek = getPreviousISOWeek(expectedPrevWeek)
    } else {
      break
    }
  }
  
  return { current, longest }
}

/**
 * Calculate monthly streak for a subject with a monthly goal
 */
function calculateMonthlyStreak(
  subject: string,
  allData: Record<string, StudyDayData>,
  targetFrequency: number
): { current: number; longest: number } {
  // Group data by month
  const monthMap = new Map<string, number>()
  
  Object.entries(allData).forEach(([date, dayData]) => {
    if (dayData?.subjects?.some(s => s.subject === subject)) {
      const monthKey = getYearMonth(date)
      monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + 1)
    }
  })
  
  if (monthMap.size === 0) {
    return { current: 0, longest: 0 }
  }
  
  // Sort months chronologically
  const sortedMonths = Array.from(monthMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
  
  let longest = 0
  let tempStreak = 0
  
  // Calculate longest streak
  for (const [monthKey, visits] of sortedMonths) {
    if (visits >= targetFrequency) {
      tempStreak++
      longest = Math.max(longest, tempStreak)
    } else {
      tempStreak = 0
    }
  }
  
  // Calculate current streak (must include current or previous month)
  const currentMonth = getCurrentYearMonth()
  const previousMonth = getPreviousYearMonth(currentMonth)
  
  const recentMonths = sortedMonths
    .filter(([monthKey, visits]) => visits >= targetFrequency)
    .reverse()
  
  if (recentMonths.length === 0) {
    return { current: 0, longest }
  }
  
  const [mostRecentMonth] = recentMonths[0]
  
  // Current streak only counts if most recent successful month is current or previous
  if (mostRecentMonth !== currentMonth && mostRecentMonth !== previousMonth) {
    return { current: 0, longest }
  }
  
  // Count consecutive months going backwards
  let current = 1
  let expectedPrevMonth = getPreviousYearMonth(mostRecentMonth)
  
  for (let i = 1; i < recentMonths.length; i++) {
    const [monthKey] = recentMonths[i]
    if (monthKey === expectedPrevMonth) {
      current++
      expectedPrevMonth = getPreviousYearMonth(expectedPrevMonth)
    } else {
      break
    }
  }
  
  return { current, longest }
}

/**
 * Calculate streak for a specific subject (daily)
 */
function calculateSubjectStreak(
  subject: string,
  allData: Record<string, StudyDayData>
): { current: number; longest: number } {
  const sortedDates = Object.keys(allData).sort()
  
  if (sortedDates.length === 0) {
    return { current: 0, longest: 0 }
  }

  let current = 0
  let longest = 0
  let tempStreak = 0
  const today = new Date().toISOString().split('T')[0]

  // Calculate longest streak
  for (const date of sortedDates) {
    const dayData = allData[date]
    const hasSubject = dayData?.subjects?.some(s => s.subject === subject)
    
    if (hasSubject) {
      tempStreak++
      longest = Math.max(longest, tempStreak)
    } else {
      tempStreak = 0
    }
  }

  // Calculate current streak (must include today or yesterday)
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]

  // Find the most recent date with this subject
  const recentDatesWithSubject = sortedDates
    .filter(date => allData[date]?.subjects?.some(s => s.subject === subject))
    .sort()
    .reverse()

  if (recentDatesWithSubject.length === 0) {
    return { current: 0, longest }
  }

  const mostRecent = recentDatesWithSubject[0]
  
  // Current streak only counts if most recent is today or yesterday
  if (mostRecent !== today && mostRecent !== yesterdayStr) {
    return { current: 0, longest }
  }

  // Count consecutive days going backwards
  current = 1
  let prevDate = new Date(mostRecent)
  
  for (let i = 1; i < recentDatesWithSubject.length; i++) {
    const expectedPrev = new Date(prevDate)
    expectedPrev.setDate(expectedPrev.getDate() - 1)
    const expectedPrevStr = expectedPrev.toISOString().split('T')[0]
    
    if (recentDatesWithSubject[i] === expectedPrevStr) {
      current++
      prevDate = expectedPrev
    } else {
      break
    }
  }

  return { current, longest }
}

/**
 * Calculate streaks for all subjects
 */
export function calculateSubjectStreaks(
  allData: Record<string, StudyDayData>,
  subjectConfigs?: SubjectConfig[]
): StreakStat[] {
  // Collect all unique subjects
  const subjectSet = new Set<string>()
  
  Object.values(allData).forEach(dayData => {
    if (dayData?.subjects) {
      dayData.subjects.forEach(entry => {
        if (entry.subject) {
          subjectSet.add(entry.subject)
        }
      })
    }
  })

  // Calculate streak for each subject
  const streaks: StreakStat[] = []
  
  subjectSet.forEach(subject => {
    // Find config for this subject
    const config = subjectConfigs?.find(c => c.name === subject)
    
    // Skip if streak tracking is disabled for this subject (default is false for study)
    if (!config || config.trackStreaks !== true) {
      return
    }
    
    const streakType = config?.streakType || 'daily'
    const targetFrequency = config?.targetFrequency || 1
    
    let streak: { current: number; longest: number }
    let unit: string
    let goalLabel: string
    
    // Calculate streak based on type
    if (streakType === 'weekly') {
      streak = calculateWeeklyStreak(subject, allData, targetFrequency)
      unit = 'week'
      goalLabel = targetFrequency === 1 ? 'weekly' : `${targetFrequency}x/wk`
    } else if (streakType === 'monthly') {
      streak = calculateMonthlyStreak(subject, allData, targetFrequency)
      unit = 'month'
      goalLabel = targetFrequency === 1 ? 'monthly' : `${targetFrequency}x/mo`
    } else {
      streak = calculateSubjectStreak(subject, allData)
      unit = 'day'
      goalLabel = 'daily'
    }
    
    // Calculate weekly average for this subject
    const weeklyAvg = calculateWeeklyAverageForSubject(allData, subject)
    
    streaks.push({
      label: subject,
      current: streak.current,
      longest: streak.longest,
      color: '#A855F7',
      unit,
      goal: goalLabel,
      weeklyAvg,
      icon: streakType === 'weekly' ? '📅' : streakType === 'monthly' ? '📆' : '🔥',
    })
  })

  // Sort by current streak (descending), then by longest
  streaks.sort((a, b) => {
    if (b.current !== a.current) {
      return b.current - a.current
    }
    return b.longest - a.longest
  })

  return streaks
}

/**
 * Get total hours for a day
 */
function getDayHours(dayData: StudyDayData | undefined): number {
  if (!dayData) return 0
  const subjectHours = dayData.subjects?.reduce((sum, entry) => sum + (entry.hours || 0), 0) || 0
  return subjectHours > 0 ? subjectHours : (dayData.directHours || 0)
}

/**
 * Calculate all-time total hours
 */
export function calculateAllTimeTotal(
  allData: Record<string, StudyDayData>
): number {
  return Object.values(allData).reduce((sum, dayData) => sum + getDayHours(dayData), 0)
}

/**
 * Count unique subjects across all data
 */
export function countUniqueSubjects(
  allData: Record<string, StudyDayData>
): number {
  const subjectSet = new Set<string>()
  
  Object.values(allData).forEach(dayData => {
    if (dayData?.subjects) {
      dayData.subjects.forEach(entry => {
        if (entry.subject) {
          subjectSet.add(entry.subject)
        }
      })
    }
  })
  
  return subjectSet.size
}

/**
 * Calculate total hours for a period
 */
export function calculatePeriodTotal(
  data: Record<string, StudyDayData>
): number {
  return Object.values(data).reduce((sum, dayData) => sum + getDayHours(dayData), 0)
}

/**
 * Calculate average hours for a period
 */
export function calculatePeriodAverage(
  data: Record<string, StudyDayData>
): number {
  const daysWithHours = Object.values(data).filter(d => getDayHours(d) > 0)
  
  if (daysWithHours.length === 0) return 0
  
  const totalHours = daysWithHours.reduce((sum, d) => sum + getDayHours(d), 0)
  return totalHours / daysWithHours.length
}

interface SubjectStat {
  subject: string
  hours: number
  days: number
  topics: Set<string>
  weeklyAvg?: number
}

/**
 * Calculate subject statistics for a period
 */
export function calculateSubjectStats(
  data: Record<string, StudyDayData>
): SubjectStat[] {
  const subjectMap = new Map<string, SubjectStat>()
  
  Object.values(data).forEach(dayData => {
    if (dayData?.subjects) {
      dayData.subjects.forEach(entry => {
        if (!entry.subject) return
        
        if (!subjectMap.has(entry.subject)) {
          subjectMap.set(entry.subject, {
            subject: entry.subject,
            hours: 0,
            days: 0,
            topics: new Set(),
          })
        }
        
        const stat = subjectMap.get(entry.subject)!
        stat.days++
        stat.hours += entry.hours || 0
        
        if (entry.topics) {
          entry.topics.forEach(topic => stat.topics.add(topic))
        }
      })
    }
  })
  
  // Calculate weekly averages for each subject
  const stats = Array.from(subjectMap.values())
  stats.forEach(stat => {
    stat.weeklyAvg = calculateWeeklyAverageForSubject(data, stat.subject)
  })
  
  return stats.sort((a, b) => b.hours - a.hours)
}

/**
 * Calculate weekly average visits for a subject
 */
export function calculateWeeklyAverageForSubject(
  data: Record<string, StudyDayData>,
  subject: string
): number {
  // Group data by week
  const weekMap = new Map<string, number>()
  
  Object.entries(data).forEach(([date, dayData]) => {
    if (dayData?.subjects?.some(s => s.subject === subject)) {
      const weekKey = getISOWeek(date)
      weekMap.set(weekKey, (weekMap.get(weekKey) || 0) + 1)
    }
  })
  
  if (weekMap.size === 0) return 0
  
  // Calculate average visits per week
  const totalVisits = Array.from(weekMap.values()).reduce((sum, visits) => sum + visits, 0)
  return totalVisits / weekMap.size
}

/**
 * Calculate average hours per day (for days with study data)
 */
export function calculateAvgHoursPerDay(
  allData: Record<string, StudyDayData>
): number {
  const daysWithHours = Object.values(allData).filter(d => getDayHours(d) > 0)
  
  if (daysWithHours.length === 0) return 0
  
  const totalHours = daysWithHours.reduce((sum, d) => sum + getDayHours(d), 0)
  return totalHours / daysWithHours.length
}

/**
 * Calculate average hours per week (across all weeks with data)
 */
export function calculateAvgHoursPerWeek(
  allData: Record<string, StudyDayData>
): number {
  // Group data by week
  const weekMap = new Map<string, number>()
  
  Object.entries(allData).forEach(([date, dayData]) => {
    const hours = getDayHours(dayData)
    if (hours > 0) {
      const weekKey = getISOWeek(date)
      weekMap.set(weekKey, (weekMap.get(weekKey) || 0) + hours)
    }
  })
  
  if (weekMap.size === 0) return 0
  
  // Calculate average hours per week
  const totalHours = Array.from(weekMap.values()).reduce((sum, hours) => sum + hours, 0)
  return totalHours / weekMap.size
}

/**
 * Calculate average hours per month (across all months with data)
 */
export function calculateAvgHoursPerMonth(
  allData: Record<string, StudyDayData>
): number {
  // Group data by month
  const monthMap = new Map<string, number>()
  
  Object.entries(allData).forEach(([date, dayData]) => {
    const hours = getDayHours(dayData)
    if (hours > 0) {
      const monthKey = getYearMonth(date)
      monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + hours)
    }
  })
  
  if (monthMap.size === 0) return 0
  
  // Calculate average hours per month
  const totalHours = Array.from(monthMap.values()).reduce((sum, hours) => sum + hours, 0)
  return totalHours / monthMap.size
}

/**
 * Format hours for display
 */
export function formatHours(hours: number): string {
  if (hours === 0) return '0h'
  
  const totalMinutes = Math.round(hours * 60)
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

/**
 * Build subject breakdown items
 */
export function buildSubjectBreakdown(
  data: Record<string, StudyDayData>
): BreakdownItem[] {
  const subjectStats = calculateSubjectStats(data)
  
  if (subjectStats.length === 0) return []
  
  const maxHours = Math.max(...subjectStats.map(s => s.hours))
  
  return subjectStats.map(stat => ({
    label: stat.subject,
    value: formatHours(stat.hours),
    count: stat.days,
    details: `${stat.days} session${stat.days !== 1 ? 's' : ''}, ${stat.weeklyAvg?.toFixed(1) || 0}/wk avg`,
    percentage: maxHours > 0 ? (stat.hours / maxHours) * 100 : 0,
    color: '#A855F7',
  }))
}
