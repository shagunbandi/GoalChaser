/**
 * Productivity Plugin
 */

import type { Plugin, PluginAnalyticsChartData } from '@/sdk'
import { calculateStreak, calculateAverage, generateDateRange } from '@/sdk'
import { ProductivityDataProvider } from './data-provider'
import { ProductivityDetailProviderImpl } from './detail-provider'
import ProductivityPage from './pages/ProductivityPage'
import type { ProductivityDayData, ProductivityConfig } from './types'
import { buildPluginUrl } from '@/lib/plugin-url-utils'

export const ProductivityPlugin: Plugin<ProductivityDayData, ProductivityConfig> = {
  id: 'productivity',
  
  metadata: {
    name: 'Productivity',
    icon: '📊',
    description: 'Track daily productivity (1-10 scale)',
    version: '1.0.0',
    isPrimary: false,
  },

  routes: [
    {
      path: '{year}',
      component: ProductivityPage,
      requiresYear: true,
    },
  ],

  dataProvider: new ProductivityDataProvider(),
  
  detailProvider: new ProductivityDetailProviderImpl(),

  // Calendar integration
  calendar: {
    getDaySummary: (date, data, context) => {
      if (!data || (data.status === null && !data.areas?.length)) {
        return null
      }

      const status = data.status || 0
      const hasStatus = data.status !== null
      const areasCount = data.areas?.length || 0

      if (!hasStatus && areasCount === 0) {
        return null
      }

      // Format productivity level
      let level = ''
      if (hasStatus) {
        if (status >= 7) level = 'High'
        else if (status >= 4) level = 'OK'
        else level = 'Low'
      }

      // Build navigation URL
      const dateObj = new Date(date)
      const year = dateObj.getFullYear()
      const month = dateObj.getMonth() + 1 // 1-indexed
      const url = context?.goalId
        ? buildPluginUrl({
            goalId: context.goalId,
            pluginId: 'productivity',
            year,
            month,
            date,
          })
        : undefined

      // If we have areas, use list type to show them
      if (data.areas && data.areas.length > 0) {
        return {
          color: '#06B6D4',
          hasData: true,
          summary: {
            type: 'list',
            title: 'Productivity',
            subtitle: hasStatus ? `Score: ${status}/10 (${level})` : `${areasCount} area${areasCount !== 1 ? 's' : ''} tracked`,
            icon: '🎯',
            badge: hasStatus ? `${status}/10` : `${areasCount}`,
            gradient: { from: '#06B6D4', to: '#3B82F6' },
            items: data.areas.slice(0, 5).map(area => ({
              id: area.area,
              label: area.area,
              value: area.topics?.length ? `${area.topics.length} topic${area.topics.length !== 1 ? 's' : ''}` : undefined,
              icon: '📝',
              color: '#06B6D4',
              subtitle: area.topics?.slice(0, 2).join(', ')
            })),
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

      // Just status score, use chip
      return {
        color: '#06B6D4',
        hasData: true,
        summary: {
          type: 'chip',
          title: 'Productivity',
          subtitle: level,
          content: `${status}/10`,
          icon: '📊',
          badge: level,
          gradient: { from: '#06B6D4', to: '#3B82F6' },
          actions: [
            {
              label: 'View Details',
              url,
            },
          ],
        },
      }
    },
  },

  // Analytics integration
  analytics: {
    getAnalyticsData: (startDate, endDate, data) => {
      const charts: PluginAnalyticsChartData[] = []
      const dates = generateDateRange(startDate, endDate)

      // Calculate daily productivity scores
      const dailyScores = dates.map(date => {
        const dayData = data[date]
        return dayData?.status ?? null
      }).filter((score): score is number => score !== null)

      const daysTracked = dailyScores.length
      const avgScore = calculateAverage(data, (d) => d?.status ?? null)

      // Calculate streak for high productivity days (score >= 7)
      const highProductivityStreak = calculateStreak(
        data,
        (d) => d?.status !== null && d?.status !== undefined && d.status >= 7
      )

      // Calculate area and topic statistics
      const areaStats: Record<string, { days: number; topics: Set<string> }> = {}

      Object.values(data).forEach(dayData => {
        if (dayData.areas) {
          dayData.areas.forEach(areaEntry => {
            const areaName = areaEntry.area || 'Unknown'
            if (!areaStats[areaName]) {
              areaStats[areaName] = { days: 0, topics: new Set() }
            }
            areaStats[areaName].days++
            if (areaEntry.topics) {
              areaEntry.topics.forEach(topic => {
                areaStats[areaName].topics.add(topic)
              })
            }
          })
        }
      })

      const uniqueAreas = Object.keys(areaStats).length
      const uniqueTopics = Object.values(areaStats).reduce((sum, s) => sum + s.topics.size, 0)

      // Metric cards
      if (daysTracked > 0) {
        charts.push({
          chartType: 'metric',
          title: 'Average Score',
          metricData: {
            label: 'Average Productivity',
            value: avgScore.toFixed(1),
            unit: '/10',
            icon: '📊',
            color: avgScore >= 7 ? '#34C759' : avgScore >= 4 ? '#FF9500' : '#FF3B30',
            subtitle: `Based on ${daysTracked} days`,
          },
        })

        charts.push({
          chartType: 'metric',
          title: 'Days Tracked',
          metricData: {
            label: 'Days Tracked',
            value: daysTracked,
            icon: '📅',
            color: '#007AFF',
            subtitle: `Out of ${dates.length} days`,
          },
        })

        // High productivity days count
        const highDays = dailyScores.filter(s => s >= 7).length
        charts.push({
          chartType: 'metric',
          title: 'High Productivity Days',
          metricData: {
            label: 'High Productivity',
            value: highDays,
            icon: '🔥',
            color: '#34C759',
            subtitle: `Score 7+`,
          },
        })

        // Areas tracked
        if (uniqueAreas > 0) {
          charts.push({
            chartType: 'metric',
            title: 'Areas Tracked',
            metricData: {
              label: 'Unique Areas',
              value: uniqueAreas,
              icon: '🎯',
              color: '#06B6D4',
              subtitle: `${uniqueTopics} unique topics`,
            },
          })
        }
      }

      // Streak display
      if (highProductivityStreak.longest > 0) {
        charts.push({
          chartType: 'streak',
          title: 'High Productivity Streak',
          size: 'medium',
          streakData: {
            currentStreak: highProductivityStreak.current,
            longestStreak: highProductivityStreak.longest,
            unit: 'days',
            icon: '🔥',
            color: '#FF9500',
            description: 'Consecutive days with score 7+',
          },
        })
      }

      // Heat map: Productivity activity
      if (dailyScores.length > 0) {
        const heatmapData: Record<string, number> = {}
        dates.forEach(date => {
          const score = data[date]?.status
          if (score !== null && score !== undefined) {
            heatmapData[date] = score
          }
        })

        charts.push({
          chartType: 'heatmap',
          title: 'Productivity Heat Map',
          size: 'small',
          heatmapData,
          dateRange: {
            start: startDate,
            end: endDate,
          },
        })
      }

      return charts
    },
  },
}

export default ProductivityPlugin
