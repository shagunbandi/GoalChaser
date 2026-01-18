/**
 * Period Tracking Plugin
 */

import type { Plugin, PluginAnalyticsChartData } from '@/sdk'
import { PeriodDataProvider } from './data-provider'
import { PeriodDetailProviderImpl } from './detail-provider'
import PeriodPage from './pages/PeriodPage'
import type { PeriodDayData, PeriodConfig } from './types'
import {
  calculateDaysSinceLastPeriod,
  getPeriodDayNumber,
  calculateCycleStats,
  calculatePeriodDurationStats,
  countPeriodDays,
  getLastPeriodDate,
  getCurrentCycleDay,
  getCyclePhase,
  predictNextPeriod,
} from './utils'
import { buildPluginUrl } from '@/lib/plugin-url-utils'

// Colors - Rose/Red theme for period tracking
const PERIOD_COLOR = '#F43F5E' // Rose-500
const PINK_COLOR = '#F472B6' // Pink-400

export const PeriodPlugin: Plugin<PeriodDayData, PeriodConfig> = {
  id: 'period',

  metadata: {
    name: 'Period',
    icon: '🩸',
    description: 'Track menstrual cycle and period days',
    version: '1.0.0',
    isPrimary: false,
  },

  routes: [
    {
      path: '{year}',
      component: PeriodPage,
      requiresYear: true,
    },
  ],

  dataProvider: new PeriodDataProvider(),

  detailProvider: new PeriodDetailProviderImpl(),

  // Calendar integration - shows on home calendar
  calendar: {
    getDaySummary: (date, data, context) => {
      const allMonthData = context?.allMonthData || {}
      
      // Combine current day data with all month data for calculations
      const combinedData: Record<string, PeriodDayData> = { ...allMonthData }
      if (data) {
        combinedData[date] = data
      }

      // Build navigation URL
      const dateObj = new Date(date)
      const year = dateObj.getFullYear()
      const month = dateObj.getMonth() + 1
      const url = context?.goalId
        ? buildPluginUrl({
            goalId: context.goalId,
            pluginId: 'period',
            year,
            month,
            date,
          })
        : undefined

      // Calculate cycle stats for additional info
      const cycleStats = calculateCycleStats(combinedData)
      const avgCycleLength = cycleStats?.averageCycleLength || 28
      const cycleDay = getCurrentCycleDay(combinedData, date)
      const phaseInfo = cycleDay ? getCyclePhase(cycleDay, avgCycleLength, data?.isPeriod) : null

      // If this is a period day
      if (data?.isPeriod) {
        const dayNumber = getPeriodDayNumber(combinedData, date)
        const durationStats = calculatePeriodDurationStats(combinedData)

        // Build stats for expanded view
        const stats = []
        
        if (dayNumber) {
          stats.push({
            label: 'Period Day',
            value: `Day ${dayNumber}`,
            icon: '🩸',
            color: PERIOD_COLOR,
          })
        }
        
        if (cycleDay) {
          stats.push({
            label: 'Cycle Day',
            value: `${cycleDay}`,
            icon: '🔄',
            color: '#8B5CF6',
          })
        }

        if (durationStats && durationStats.periodCount > 1) {
          stats.push({
            label: 'Avg Duration',
            value: `${durationStats.averageDuration} days`,
            icon: '⏱️',
            color: '#EC4899',
          })
        }

        if (cycleStats && cycleStats.cycleCount > 0) {
          stats.push({
            label: 'Avg Cycle',
            value: `${cycleStats.averageCycleLength} days`,
            icon: '📊',
            color: PINK_COLOR,
          })
        }

        return {
          color: PERIOD_COLOR,
          hasData: true,
          summary: {
            type: 'stats',
            title: 'Period',
            subtitle: dayNumber ? `Day ${dayNumber} • Menstrual Phase` : 'Active',
            icon: '🩸',
            badge: dayNumber ? `Day ${dayNumber}` : 'Active',
            gradient: { from: '#F43F5E', to: '#E11D48' },
            stats: stats.length > 0 ? stats : undefined,
            actions: [
              {
                label: 'View Details',
                url,
                variant: 'primary',
              },
            ],
          },
        }
      }

      // For non-period days, show cycle information
      const daysSince = calculateDaysSinceLastPeriod(combinedData, date)

      if (daysSince !== null && daysSince > 0) {
        const nextPeriod = predictNextPeriod(combinedData, avgCycleLength)
        
        // Build stats for expanded view
        const stats = []

        if (cycleDay) {
          stats.push({
            label: 'Cycle Day',
            value: `${cycleDay}`,
            icon: '🔄',
            color: '#8B5CF6',
          })
        }

        if (phaseInfo) {
          stats.push({
            label: 'Phase',
            value: phaseInfo.name,
            icon: phaseInfo.icon,
            color: phaseInfo.color,
          })
        }

        if (nextPeriod && nextPeriod.daysUntil > 0) {
          stats.push({
            label: 'Next Period',
            value: `${nextPeriod.daysUntil} days`,
            icon: '📅',
            color: PERIOD_COLOR,
          })
        }

        if (cycleStats && cycleStats.cycleCount > 0) {
          stats.push({
            label: 'Avg Cycle',
            value: `${cycleStats.averageCycleLength} days`,
            icon: '📊',
            color: PINK_COLOR,
          })
        }

        // Subtitle based on phase
        const phaseSubtitle = phaseInfo 
          ? `${phaseInfo.name} Phase • Cycle Day ${cycleDay}`
          : `${daysSince} days since last`

        return {
          color: phaseInfo?.color || PINK_COLOR,
          hasData: true,
          summary: {
            type: 'stats',
            title: 'Period Tracker',
            subtitle: phaseSubtitle,
            icon: phaseInfo?.icon || '📅',
            badge: phaseInfo?.name || `Day ${cycleDay}`,
            gradient: { from: phaseInfo?.color || '#F472B6', to: '#FB7185' },
            stats: stats.length > 0 ? stats : undefined,
            actions: [
              {
                label: 'View Details',
                url,
              },
            ],
          },
        }
      }

      // No data to show
      return null
    },
  },

  // Analytics integration
  analytics: {
    getAnalyticsData: (startDate, endDate, data) => {
      const charts: PluginAnalyticsChartData[] = []
      const todayISO = new Date().toISOString().split('T')[0]

      // Basic counts
      const periodDays = countPeriodDays(data)
      const cycleStats = calculateCycleStats(data)
      const durationStats = calculatePeriodDurationStats(data)
      const daysSince = calculateDaysSinceLastPeriod(data, todayISO)
      const lastPeriodDate = getLastPeriodDate(data)

      // Metric: Period Days
      if (periodDays > 0) {
        charts.push({
          chartType: 'metric',
          title: 'Period Days',
          metricData: {
            label: 'Period Days',
            value: periodDays,
            icon: '🩸',
            color: PERIOD_COLOR,
            subtitle: `In selected range`,
          },
        })
      }

      // Metric: Days Since Last Period
      if (daysSince !== null) {
        const formattedDate = lastPeriodDate
          ? new Date(lastPeriodDate + 'T00:00:00').toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })
          : ''

        charts.push({
          chartType: 'metric',
          title: 'Days Since',
          metricData: {
            label: 'Days Since Last',
            value: daysSince,
            unit: 'days',
            icon: '📅',
            color: PINK_COLOR,
            subtitle: formattedDate ? `Last: ${formattedDate}` : undefined,
          },
        })
      }

      // Metric: Average Cycle Length
      if (cycleStats) {
        charts.push({
          chartType: 'metric',
          title: 'Cycle Length',
          metricData: {
            label: 'Average Cycle',
            value: cycleStats.averageCycleLength,
            unit: 'days',
            icon: '🔄',
            color: '#8B5CF6',
            subtitle: `${cycleStats.cycleCount} cycle${cycleStats.cycleCount !== 1 ? 's' : ''} tracked`,
          },
        })
      }

      // Metric: Average Period Duration
      if (durationStats) {
        charts.push({
          chartType: 'metric',
          title: 'Period Duration',
          metricData: {
            label: 'Avg Duration',
            value: durationStats.averageDuration,
            unit: 'days',
            icon: '⏱️',
            color: '#EC4899',
            subtitle: `${durationStats.periodCount} period${durationStats.periodCount !== 1 ? 's' : ''} tracked`,
          },
        })
      }

      return charts
    },
  },
}

export default PeriodPlugin
