/**
 * Productivity Insights Utilities
 * 
 * Helper functions for calculating productivity insights
 */

import type { ProductivityDayData, AreaConfig, StreakType } from './types'
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
 * Calculate weekly streak for an area with a weekly goal
 */
function calculateWeeklyStreak(
  area: string,
  allData: Record<string, ProductivityDayData>,
  targetFrequency: number
): { current: number; longest: number } {
  // Group data by week
  const weekMap = new Map<string, number>()
  
  Object.entries(allData).forEach(([date, dayData]) => {
    if (dayData?.areas?.some(a => a.area === area)) {
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
 * Calculate monthly streak for an area with a monthly goal
 */
function calculateMonthlyStreak(
  area: string,
  allData: Record<string, ProductivityDayData>,
  targetFrequency: number
): { current: number; longest: number } {
  // Group data by month
  const monthMap = new Map<string, number>()
  
  Object.entries(allData).forEach(([date, dayData]) => {
    if (dayData?.areas?.some(a => a.area === area)) {
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
 * Calculate streak for a specific area (daily)
 */
function calculateAreaStreak(
  area: string,
  allData: Record<string, ProductivityDayData>
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
    const hasArea = dayData?.areas?.some(a => a.area === area)
    
    if (hasArea) {
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

  // Find the most recent date with this area
  const recentDatesWithArea = sortedDates
    .filter(date => allData[date]?.areas?.some(a => a.area === area))
    .sort()
    .reverse()

  if (recentDatesWithArea.length === 0) {
    return { current: 0, longest }
  }

  const mostRecent = recentDatesWithArea[0]
  
  // Current streak only counts if most recent is today or yesterday
  if (mostRecent !== today && mostRecent !== yesterdayStr) {
    return { current: 0, longest }
  }

  // Count consecutive days going backwards
  current = 1
  let prevDate = new Date(mostRecent)
  
  for (let i = 1; i < recentDatesWithArea.length; i++) {
    const expectedPrev = new Date(prevDate)
    expectedPrev.setDate(expectedPrev.getDate() - 1)
    const expectedPrevStr = expectedPrev.toISOString().split('T')[0]
    
    if (recentDatesWithArea[i] === expectedPrevStr) {
      current++
      prevDate = expectedPrev
    } else {
      break
    }
  }

  return { current, longest }
}

/**
 * Calculate streaks for all areas
 */
export function calculateAreaStreaks(
  allData: Record<string, ProductivityDayData>,
  areaConfigs?: AreaConfig[]
): StreakStat[] {
  // Collect all unique areas
  const areaSet = new Set<string>()
  
  Object.values(allData).forEach(dayData => {
    if (dayData?.areas) {
      dayData.areas.forEach(entry => {
        if (entry.area) {
          areaSet.add(entry.area)
        }
      })
    }
  })

  // Calculate streak for each area
  const streaks: StreakStat[] = []
  
  areaSet.forEach(area => {
    // Find config for this area
    const config = areaConfigs?.find(c => c.name === area)
    
    // Skip if streak tracking is disabled for this area
    if (config && config.trackStreaks === false) {
      return
    }
    
    const streakType = config?.streakType || 'daily'
    const targetFrequency = config?.targetFrequency || 1
    
    let streak: { current: number; longest: number }
    let unit: string
    let goalLabel: string
    
    // Calculate streak based on type
    if (streakType === 'weekly') {
      streak = calculateWeeklyStreak(area, allData, targetFrequency)
      unit = 'week'
      goalLabel = targetFrequency === 1 ? 'weekly' : `${targetFrequency}x/wk`
    } else if (streakType === 'monthly') {
      streak = calculateMonthlyStreak(area, allData, targetFrequency)
      unit = 'month'
      goalLabel = targetFrequency === 1 ? 'monthly' : `${targetFrequency}x/mo`
    } else {
      streak = calculateAreaStreak(area, allData)
      unit = 'day'
      goalLabel = 'daily'
    }
    
    // Calculate weekly average for this area
    const weeklyAvg = calculateWeeklyAverageForArea(allData, area)
    
    streaks.push({
      label: area,
      current: streak.current,
      longest: streak.longest,
      color: '#06B6D4',
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
 * Calculate all-time average productivity score
 */
export function calculateAllTimeAverage(
  allData: Record<string, ProductivityDayData>
): number {
  const scores = Object.values(allData)
    .filter(d => d?.status !== null && d?.status !== undefined)
    .map(d => d.status as number)
  
  if (scores.length === 0) return 0
  
  const sum = scores.reduce((acc, score) => acc + score, 0)
  return sum / scores.length
}

/**
 * Count unique areas across all data
 */
export function countUniqueAreas(
  allData: Record<string, ProductivityDayData>
): number {
  const areaSet = new Set<string>()
  
  Object.values(allData).forEach(dayData => {
    if (dayData?.areas) {
      dayData.areas.forEach(entry => {
        if (entry.area) {
          areaSet.add(entry.area)
        }
      })
    }
  })
  
  return areaSet.size
}

/**
 * Count high productivity days (score >= 7)
 */
export function countHighDays(
  data: Record<string, ProductivityDayData>
): number {
  return Object.values(data).filter(
    d => d?.status !== null && d?.status !== undefined && d.status >= 7
  ).length
}

/**
 * Calculate average score for a period
 */
export function calculatePeriodAverage(
  data: Record<string, ProductivityDayData>
): number {
  const scores = Object.values(data)
    .filter(d => d?.status !== null && d?.status !== undefined)
    .map(d => d.status as number)
  
  if (scores.length === 0) return 0
  
  const sum = scores.reduce((acc, score) => acc + score, 0)
  return sum / scores.length
}

interface AreaStat {
  area: string
  hours: number
  days: number
  topics: Set<string>
  weeklyAvg?: number
}

/**
 * Calculate area statistics for a period
 */
export function calculateAreaStats(
  data: Record<string, ProductivityDayData>
): AreaStat[] {
  const areaMap = new Map<string, AreaStat>()
  
  Object.values(data).forEach(dayData => {
    if (dayData?.areas) {
      dayData.areas.forEach(entry => {
        if (!entry.area) return
        
        if (!areaMap.has(entry.area)) {
          areaMap.set(entry.area, {
            area: entry.area,
            hours: 0,
            days: 0,
            topics: new Set(),
          })
        }
        
        const stat = areaMap.get(entry.area)!
        stat.days++
        stat.hours += entry.hours || 0
        
        if (entry.topics) {
          entry.topics.forEach(topic => stat.topics.add(topic))
        }
      })
    }
  })
  
  // Calculate weekly averages for each area
  const stats = Array.from(areaMap.values())
  stats.forEach(stat => {
    stat.weeklyAvg = calculateWeeklyAverageForArea(data, stat.area)
  })
  
  return stats.sort((a, b) => b.hours - a.hours)
}

/**
 * Calculate weekly average visits for an area
 */
export function calculateWeeklyAverageForArea(
  data: Record<string, ProductivityDayData>,
  area: string
): number {
  // Group data by week
  const weekMap = new Map<string, number>()
  
  Object.entries(data).forEach(([date, dayData]) => {
    if (dayData?.areas?.some(a => a.area === area)) {
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
 * Build area breakdown items
 */
export function buildAreaBreakdown(
  data: Record<string, ProductivityDayData>
): BreakdownItem[] {
  const areaStats = calculateAreaStats(data)
  
  if (areaStats.length === 0) return []
  
  const maxHours = Math.max(...areaStats.map(s => s.hours))
  
  return areaStats.map(stat => ({
    label: stat.area,
    value: formatHours(stat.hours),
    count: stat.days,
    details: `${stat.days} visit${stat.days !== 1 ? 's' : ''}, ${stat.weeklyAvg?.toFixed(1) || 0}/wk avg`,
    percentage: maxHours > 0 ? (stat.hours / maxHours) * 100 : 0,
    color: '#06B6D4',
  }))
}

