/**
 * Period Tracking Utility Functions
 */

import type { PeriodDayData, CycleStats, PeriodDurationStats } from '../types'

/**
 * Calculate days since the last period day
 * @param data Record of date -> PeriodDayData
 * @param currentDate The current date in ISO format (YYYY-MM-DD)
 * @returns Number of days since last period, or null if no period data exists
 */
export function calculateDaysSinceLastPeriod(
  data: Record<string, PeriodDayData>,
  currentDate: string
): number | null {
  const periodDates = Object.entries(data)
    .filter(([, dayData]) => dayData.isPeriod)
    .map(([date]) => date)
    .sort()
    .reverse() // Most recent first

  if (periodDates.length === 0) {
    return null
  }

  // Find the most recent period day that is before or on the current date
  const lastPeriodDate = periodDates.find(date => date <= currentDate)

  if (!lastPeriodDate) {
    return null
  }

  const current = new Date(currentDate)
  const lastPeriod = new Date(lastPeriodDate)
  const diffTime = current.getTime() - lastPeriod.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

  return diffDays
}

/**
 * Get the day number within the current period (e.g., "Day 3")
 * @param data Record of date -> PeriodDayData
 * @param currentDate The current date in ISO format (YYYY-MM-DD)
 * @returns Day number (1-indexed) if in a period, or null if not a period day
 */
export function getPeriodDayNumber(
  data: Record<string, PeriodDayData>,
  currentDate: string
): number | null {
  const currentData = data[currentDate]
  if (!currentData?.isPeriod) {
    return null
  }

  // Count consecutive period days backwards from currentDate
  let dayNumber = 1
  const checkDate = new Date(currentDate)
  
  while (true) {
    checkDate.setDate(checkDate.getDate() - 1)
    const checkISO = checkDate.toISOString().split('T')[0]
    const checkData = data[checkISO]
    
    if (checkData?.isPeriod) {
      dayNumber++
    } else {
      break
    }
  }

  return dayNumber
}

/**
 * Find all period start dates (first day of each period)
 * @param data Record of date -> PeriodDayData
 * @returns Array of period start dates sorted chronologically
 */
export function findPeriodStartDates(data: Record<string, PeriodDayData>): string[] {
  const periodDates = Object.entries(data)
    .filter(([, dayData]) => dayData.isPeriod)
    .map(([date]) => date)
    .sort()

  if (periodDates.length === 0) {
    return []
  }

  const startDates: string[] = []
  
  for (let i = 0; i < periodDates.length; i++) {
    const currentDate = periodDates[i]
    const prevDate = periodDates[i - 1]
    
    if (!prevDate) {
      // First period day is always a start
      startDates.push(currentDate)
    } else {
      // Check if there's a gap (not consecutive days)
      const current = new Date(currentDate)
      const prev = new Date(prevDate)
      const diffDays = Math.floor((current.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24))
      
      if (diffDays > 1) {
        startDates.push(currentDate)
      }
    }
  }

  return startDates
}

/**
 * Calculate cycle statistics (time between period starts)
 * @param data Record of date -> PeriodDayData
 * @returns Cycle statistics or null if not enough data
 */
export function calculateCycleStats(data: Record<string, PeriodDayData>): CycleStats | null {
  const startDates = findPeriodStartDates(data)

  if (startDates.length < 2) {
    return null
  }

  const cycleLengths: number[] = []

  for (let i = 1; i < startDates.length; i++) {
    const current = new Date(startDates[i])
    const previous = new Date(startDates[i - 1])
    const diffDays = Math.floor((current.getTime() - previous.getTime()) / (1000 * 60 * 60 * 24))
    cycleLengths.push(diffDays)
  }

  const averageCycleLength = cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length
  const minCycleLength = Math.min(...cycleLengths)
  const maxCycleLength = Math.max(...cycleLengths)

  return {
    averageCycleLength: Math.round(averageCycleLength * 10) / 10,
    minCycleLength,
    maxCycleLength,
    cycleCount: cycleLengths.length,
  }
}

/**
 * Calculate period duration statistics
 * @param data Record of date -> PeriodDayData
 * @returns Period duration statistics or null if no data
 */
export function calculatePeriodDurationStats(data: Record<string, PeriodDayData>): PeriodDurationStats | null {
  const periodDates = Object.entries(data)
    .filter(([, dayData]) => dayData.isPeriod)
    .map(([date]) => date)
    .sort()

  if (periodDates.length === 0) {
    return null
  }

  const periodDurations: number[] = []
  let currentPeriodLength = 1

  for (let i = 1; i < periodDates.length; i++) {
    const current = new Date(periodDates[i])
    const prev = new Date(periodDates[i - 1])
    const diffDays = Math.floor((current.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 1) {
      // Consecutive day, same period
      currentPeriodLength++
    } else {
      // New period, save the previous one
      periodDurations.push(currentPeriodLength)
      currentPeriodLength = 1
    }
  }
  
  // Don't forget the last period
  periodDurations.push(currentPeriodLength)

  const averageDuration = periodDurations.reduce((a, b) => a + b, 0) / periodDurations.length
  const minDuration = Math.min(...periodDurations)
  const maxDuration = Math.max(...periodDurations)

  return {
    averageDuration: Math.round(averageDuration * 10) / 10,
    minDuration,
    maxDuration,
    periodCount: periodDurations.length,
  }
}

/**
 * Get the last period date
 * @param data Record of date -> PeriodDayData
 * @returns Last period date in ISO format, or null if no periods
 */
export function getLastPeriodDate(data: Record<string, PeriodDayData>): string | null {
  const periodDates = Object.entries(data)
    .filter(([, dayData]) => dayData.isPeriod)
    .map(([date]) => date)
    .sort()
    .reverse()

  return periodDates.length > 0 ? periodDates[0] : null
}

/**
 * Count total period days in the data
 * @param data Record of date -> PeriodDayData
 * @returns Number of period days
 */
export function countPeriodDays(data: Record<string, PeriodDayData>): number {
  return Object.values(data).filter(d => d.isPeriod).length
}

/**
 * Get the most recent period start date
 * @param data Record of date -> PeriodDayData
 * @returns Most recent period start date or null
 */
export function getLastPeriodStartDate(data: Record<string, PeriodDayData>): string | null {
  const startDates = findPeriodStartDates(data)
  return startDates.length > 0 ? startDates[startDates.length - 1] : null
}

/**
 * Calculate the current cycle day (days since last period started + 1)
 * @param data Record of date -> PeriodDayData
 * @param currentDate The current date in ISO format
 * @returns Current cycle day or null if no period data
 */
export function getCurrentCycleDay(
  data: Record<string, PeriodDayData>,
  currentDate: string
): number | null {
  const lastStartDate = getLastPeriodStartDate(data)
  if (!lastStartDate) return null

  const current = new Date(currentDate)
  const lastStart = new Date(lastStartDate)
  const diffTime = current.getTime() - lastStart.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

  return diffDays + 1 // Cycle day is 1-indexed
}

/**
 * Cycle phase type
 */
export type CyclePhase = 'menstrual' | 'follicular' | 'ovulation' | 'luteal'

/**
 * Cycle phase information
 */
export interface CyclePhaseInfo {
  phase: CyclePhase
  name: string
  icon: string
  color: string
  description: string
  dayRange: string
}

/**
 * Get the current cycle phase based on cycle day
 * Uses standard 28-day cycle phases:
 * - Menstrual: Day 1-5
 * - Follicular: Day 6-13
 * - Ovulation: Day 14-16
 * - Luteal: Day 17-28
 * 
 * @param cycleDay Current day of cycle
 * @param avgCycleLength Average cycle length (defaults to 28)
 * @param isOnPeriod Whether currently on period
 * @returns Cycle phase information
 */
export function getCyclePhase(
  cycleDay: number,
  avgCycleLength: number = 28,
  isOnPeriod: boolean = false
): CyclePhaseInfo {
  // If on period, always show menstrual phase
  if (isOnPeriod) {
    return {
      phase: 'menstrual',
      name: 'Menstrual',
      icon: '🩸',
      color: '#F43F5E',
      description: 'Period is active',
      dayRange: 'Day 1-5',
    }
  }

  // Scale phases to actual cycle length
  const scale = avgCycleLength / 28

  const menstrualEnd = Math.round(5 * scale)
  const follicularEnd = Math.round(13 * scale)
  const ovulationEnd = Math.round(16 * scale)

  if (cycleDay <= menstrualEnd) {
    return {
      phase: 'menstrual',
      name: 'Menstrual',
      icon: '🩸',
      color: '#F43F5E',
      description: 'Period phase',
      dayRange: `Day 1-${menstrualEnd}`,
    }
  } else if (cycleDay <= follicularEnd) {
    return {
      phase: 'follicular',
      name: 'Follicular',
      icon: '🌸',
      color: '#F472B6',
      description: 'Building up',
      dayRange: `Day ${menstrualEnd + 1}-${follicularEnd}`,
    }
  } else if (cycleDay <= ovulationEnd) {
    return {
      phase: 'ovulation',
      name: 'Ovulation',
      icon: '✨',
      color: '#A855F7',
      description: 'Fertile window',
      dayRange: `Day ${follicularEnd + 1}-${ovulationEnd}`,
    }
  } else {
    return {
      phase: 'luteal',
      name: 'Luteal',
      icon: '🌙',
      color: '#8B5CF6',
      description: 'Pre-period phase',
      dayRange: `Day ${ovulationEnd + 1}-${avgCycleLength}`,
    }
  }
}

/**
 * Predict the next period start date
 * @param data Record of date -> PeriodDayData
 * @param avgCycleLength Average cycle length
 * @returns Predicted date ISO string and days until, or null
 */
export function predictNextPeriod(
  data: Record<string, PeriodDayData>,
  avgCycleLength: number = 28
): { date: string; daysUntil: number } | null {
  const lastStartDate = getLastPeriodStartDate(data)
  if (!lastStartDate) return null

  const lastStart = new Date(lastStartDate)
  const nextStart = new Date(lastStart)
  nextStart.setDate(nextStart.getDate() + Math.round(avgCycleLength))

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  nextStart.setHours(0, 0, 0, 0)

  const diffTime = nextStart.getTime() - today.getTime()
  const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  return {
    date: nextStart.toISOString().split('T')[0],
    daysUntil,
  }
}

/**
 * Check if currently on period
 * @param data Record of date -> PeriodDayData
 * @param currentDate The current date in ISO format
 * @returns true if current date is a period day
 */
export function isCurrentlyOnPeriod(
  data: Record<string, PeriodDayData>,
  currentDate: string
): boolean {
  return data[currentDate]?.isPeriod === true
}
