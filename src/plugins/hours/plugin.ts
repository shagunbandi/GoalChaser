/**
 * Hours Plugin
 * 
 * Track hours spent per day across different subjects and topics.
 */

import type { Plugin } from '@/sdk'
import { HoursDataProvider } from './data-provider'
import { HoursDetailProviderImpl } from './detail-provider'
import HoursPage from './pages/HoursPage'
import type { HoursDayData, HoursConfig } from './types'
import { buildPluginUrl } from '@/lib/plugin-url-utils'

export const HoursPlugin: Plugin<HoursDayData, HoursConfig> = {
  id: 'hours',
  
  metadata: {
    name: 'Hours',
    icon: '⏱️',
    description: 'Track hours spent per day',
    version: '1.0.0',
    isPrimary: false,
  },

  routes: [
    {
      path: '{year}',
      component: HoursPage,
      requiresYear: true,
    },
  ],

  dataProvider: new HoursDataProvider(),
  
  detailProvider: new HoursDetailProviderImpl(),

  // Calendar integration
  calendar: {
    getDaySummary: (date, data, context) => {
      if (!data || (!data.subjects?.length && !data.directHours)) {
        return null
      }

      // Calculate total hours
      const subjectHours = data.subjects?.reduce((sum, entry) => sum + (entry.hours || 0), 0) || 0
      const totalHours = subjectHours > 0 ? subjectHours : (data.directHours || 0)

      if (totalHours === 0) {
        return null
      }

      // Format hours to h/m
      const formatHours = (hours: number) => {
        const totalMinutes = Math.round(hours * 60)
        const h = Math.floor(totalMinutes / 60)
        const m = totalMinutes % 60
        if (m === 0) return `${h}h`
        return `${h}h ${m}m`
      }

      // Build navigation URL
      const dateObj = new Date(date)
      const year = dateObj.getFullYear()
      const url = context?.goalId
        ? buildPluginUrl({
            goalId: context.goalId,
            pluginId: 'hours',
            year,
            date,
          })
        : undefined

      // If we have subjects breakdown, use stats type
      if (data.subjects && data.subjects.length > 0) {
        return {
          color: '#A855F7',
          hasData: true,
          summary: {
            type: 'stats',
            title: 'Hours Tracked',
            subtitle: formatHours(totalHours) + ' total',
            icon: '⏱️',
            badge: `${data.subjects.length} subject${data.subjects.length !== 1 ? 's' : ''}`,
            gradient: { from: '#A855F7', to: '#8B5CF6' },
            stats: data.subjects.slice(0, 4).map(s => ({
              label: s.subject,
              value: formatHours(s.hours),
              icon: '📚',
              color: '#A855F7',
              subtitle: s.topics?.length ? `${s.topics.length} topic${s.topics.length !== 1 ? 's' : ''}` : undefined
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

      // Otherwise use chip type
      return {
        color: '#A855F7',
        hasData: true,
        summary: {
          type: 'chip',
          title: 'Hours',
          subtitle: 'Direct tracking',
          content: formatHours(totalHours),
          icon: '⏱️',
          gradient: { from: '#A855F7', to: '#8B5CF6' },
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

      // Calculate daily hours
      const dailyHours = dates.map(date => {
        const dayData = data[date]
        if (!dayData) return 0
        const subjectHours = dayData.subjects?.reduce((sum, entry) => sum + (entry.hours || 0), 0) || 0
        return subjectHours > 0 ? subjectHours : (dayData.directHours || 0)
      })

      // Line chart: Hours per day
      charts.push({
        chartType: 'line' as const,
        title: 'Hours per Day',
        data: {
          labels: dates.map(d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
          datasets: [{
            label: 'Hours',
            data: dailyHours,
            color: '#007AFF',
          }],
        },
      })

      // Pie chart: Hours by subject
      const subjectTotals: Record<string, number> = {}
      Object.values(data).forEach(dayData => {
        if (dayData.subjects) {
          dayData.subjects.forEach(entry => {
            subjectTotals[entry.subject] = (subjectTotals[entry.subject] || 0) + (entry.hours || 0)
          })
        }
      })

      if (Object.keys(subjectTotals).length > 0) {
        const subjects = Object.keys(subjectTotals)
        const hours = subjects.map(s => subjectTotals[s])

        charts.push({
          chartType: 'pie' as const,
          title: 'Hours by Subject',
          data: {
            labels: subjects,
            datasets: [{
              label: 'Hours',
              data: hours,
              color: '#007AFF',
            }],
          },
        })
      }

      // Heat map: Daily hours
      const heatmapData: Record<string, number> = {}
      dates.forEach((date, index) => {
        heatmapData[date] = dailyHours[index]
      })

      charts.push({
        chartType: 'heatmap' as const,
        title: 'Hours Activity',
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

      return charts
    },
  },
}

export default HoursPlugin
