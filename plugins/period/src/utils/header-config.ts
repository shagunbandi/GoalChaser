import type { HeaderConfig } from '@goal-chaser/sdk'
import type { PeriodDayData } from '../types'
import {
  countPeriodDays,
  calculateCycleStats,
  calculatePeriodDurationStats,
  getCurrentCycleDay,
  getCyclePhase,
  predictNextPeriod,
  isCurrentlyOnPeriod,
  getPeriodDayNumber,
} from './period-utils'

/**
 * Build header configuration for period view
 * Used by both year and month views to ensure consistency
 */
export function buildPeriodHeaderConfig(
  dataToAnalyze: Record<string, PeriodDayData>,
  allData: Record<string, PeriodDayData>,
  viewType: 'year' | 'month'
): HeaderConfig {
  const todayISO = new Date().toISOString().split('T')[0]
  
  const periodDays = countPeriodDays(dataToAnalyze)
  const cycleStats = calculateCycleStats(allData)
  const durationStats = calculatePeriodDurationStats(allData)
  const avgCycle = cycleStats?.averageCycleLength ?? 28
  const cycleDay = getCurrentCycleDay(allData, todayISO)
  const onPeriod = isCurrentlyOnPeriod(allData, todayISO)
  const periodDayNum = onPeriod ? getPeriodDayNumber(allData, todayISO) : null
  const phase = cycleDay ? getCyclePhase(cycleDay, avgCycle, onPeriod) : null
  const nextPeriod = predictNextPeriod(allData, avgCycle)

  // Build stats array
  const stats: HeaderConfig['stats'] = [
    { label: 'Period days', value: periodDays, color: '#F43F5E' },
  ]

  if (cycleStats) {
    stats.push({ label: 'Avg cycle', value: `${cycleStats.averageCycleLength}d`, color: '#F472B6' })
  }

  if (durationStats) {
    stats.push({ label: 'Avg duration', value: `${durationStats.averageDuration}d`, color: '#A855F7' })
  }

  // Add current status
  if (onPeriod && periodDayNum) {
    stats.push({ label: 'Status', value: `Period Day ${periodDayNum}`, color: '#F43F5E' })
  } else if (cycleDay && phase) {
    stats.push({ label: 'Cycle day', value: `${cycleDay} (${phase.name})`, color: phase.color })
  }

  // Add next period prediction
  if (nextPeriod && !onPeriod) {
    const daysText = nextPeriod.daysUntil <= 0
      ? 'Any day now'
      : nextPeriod.daysUntil === 1
      ? 'Tomorrow'
      : `In ${nextPeriod.daysUntil}d`
    stats.push({ label: 'Next period', value: daysText, color: '#EC4899' })
  }

  return {
    icon: '🩸',
    title: `Period ${viewType === 'year' ? 'Year' : 'Month'}:`,
    stats,
    legends: [
      { label: 'Period day', color: '#F43F5E' },
      { label: 'Non-period', color: 'rgba(255, 255, 255, 0.2)' },
    ],
    actions: [],
  }
}
