/**
 * Productivity Plugin
 */

import type { Plugin } from '@/sdk'
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
      const url = context?.goalId
        ? buildPluginUrl({
            goalId: context.goalId,
            pluginId: 'productivity',
            year,
            date,
          })
        : undefined

      // If we have areas, use list type to show them
      if (data.areas && data.areas.length > 0) {
        const totalTopics = data.areas.reduce((sum, area) => sum + (area.topics?.length || 0), 0)
        
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
      const charts = []

      // Generate date labels
      const dates: string[] = []
      const start = new Date(startDate)
      const end = new Date(endDate)
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        dates.push(d.toISOString().split('T')[0])
      }

      // Calculate daily productivity scores
      const dailyScores = dates.map(date => {
        const dayData = data[date]
        return dayData?.status ?? null
      }).filter((score): score is number => score !== null)

      if (dailyScores.length > 0) {
        // Line chart: Productivity over time
        const scoresWithDates = dates.map(date => data[date]?.status ?? 0)
        charts.push({
          chartType: 'line' as const,
          title: 'Productivity Score Over Time',
          data: {
            labels: dates.map(d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
            datasets: [{
              label: 'Productivity (1-10)',
              data: scoresWithDates,
              color: '#34C759',
            }],
          },
        })

        // Pie chart: Distribution of productivity levels
        const highCount = dailyScores.filter(s => s >= 7).length
        const okCount = dailyScores.filter(s => s >= 4 && s < 7).length
        const lowCount = dailyScores.filter(s => s < 4).length

        if (highCount + okCount + lowCount > 0) {
          charts.push({
            chartType: 'pie' as const,
            title: 'Productivity Distribution',
            data: {
              labels: ['High (7-10)', 'OK (4-6)', 'Low (1-3)'],
              datasets: [{
                label: 'Days',
                data: [highCount, okCount, lowCount],
                color: '#34C759',
              }],
            },
          })
        }

        // Heat map: Productivity activity
        const heatmapData: Record<string, number> = {}
        dates.forEach(date => {
          const score = data[date]?.status
          if (score !== null && score !== undefined) {
            heatmapData[date] = score
          }
        })

        charts.push({
          chartType: 'heatmap' as const,
          title: 'Productivity Heat Map',
          data: {
            labels: [],
            datasets: [],
          },
          heatmapData,
          dateRange: {
            start: startDate,
            end: endDate,
          },
        })
      }

      // Bar chart: Activity by area
      const areaCounts: Record<string, number> = {}
      Object.values(data).forEach(dayData => {
        if (dayData.areas) {
          dayData.areas.forEach(areaEntry => {
            const areaName = areaEntry.area || 'Unknown'
            areaCounts[areaName] = (areaCounts[areaName] || 0) + 1
          })
        }
      })

      if (Object.keys(areaCounts).length > 0) {
        const areas = Object.keys(areaCounts)
        const counts = areas.map(a => areaCounts[a])

        charts.push({
          chartType: 'bar' as const,
          title: 'Days Active by Area',
          data: {
            labels: areas,
            datasets: [{
              label: 'Days',
              data: counts,
              color: '#34C759',
            }],
          },
        })
      }

      return charts
    },
  },
}

export default ProductivityPlugin
