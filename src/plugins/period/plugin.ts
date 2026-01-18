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

      // If this is a period day
      if (data?.isPeriod) {
        const dayNumber = getPeriodDayNumber(combinedData, date)

        return {
          color: PERIOD_COLOR,
          hasData: true,
          summary: {
            type: 'chip',
            title: 'Period',
            subtitle: dayNumber ? `Day ${dayNumber}` : 'Active',
            content: dayNumber ? `Day ${dayNumber}` : '●',
            icon: '🩸',
            badge: dayNumber ? `Day ${dayNumber}` : undefined,
            gradient: { from: '#F43F5E', to: '#E11D48' }, // Rose gradient
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

      // For non-period days, show days since last period
      const daysSince = calculateDaysSinceLastPeriod(combinedData, date)

      if (daysSince !== null && daysSince > 0) {
        return {
          color: PINK_COLOR,
          hasData: true,
          summary: {
            type: 'chip',
            title: 'Period Tracker',
            subtitle: `${daysSince} days since last`,
            content: `${daysSince}d`,
            icon: '📅',
            gradient: { from: '#F472B6', to: '#FB7185' },
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
