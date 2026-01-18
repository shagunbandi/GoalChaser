/**
 * Study Plugin
 * 
 * Track study hours spent per day across different subjects and topics.
 */

import type { Plugin, PluginAnalyticsChartData } from '@/sdk'
import { calculateStreak, calculateSum, generateDateRange } from '@/sdk'
import { StudyDataProvider } from './data-provider'
import { StudyDetailProviderImpl } from './detail-provider'
import StudyPage from './pages/StudyPage'
import type { StudyDayData, StudyConfig } from './types'
import { buildPluginUrl } from '@/lib/plugin-url-utils'

// Helper to get total hours for a day
function getDayHours(dayData: StudyDayData | undefined): number {
  if (!dayData) return 0
  const subjectHours = dayData.subjects?.reduce((sum, entry) => sum + (entry.hours || 0), 0) || 0
  return subjectHours > 0 ? subjectHours : (dayData.directHours || 0)
}

// Helper to format hours
function formatHours(hours: number): string {
  if (hours === 0) return '0h'
  const totalMinutes = Math.round(hours * 60)
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

export const StudyPlugin: Plugin<StudyDayData, StudyConfig> = {
  id: 'study',
  
  metadata: {
    name: 'Study',
    icon: '📚',
    description: 'Track study hours per day',
    version: '1.0.0',
    isPrimary: false,
  },

  routes: [
    {
      path: '{year}',
      component: StudyPage,
      requiresYear: true,
    },
  ],

  dataProvider: new StudyDataProvider(),
  
  detailProvider: new StudyDetailProviderImpl(),

  // Calendar integration
  calendar: {
    getDaySummary: (date, data, context) => {
      if (!data || (!data.subjects?.length && !data.directHours)) {
        return null
      }

      // Calculate total hours
      const totalHours = getDayHours(data)

      if (totalHours === 0) {
        return null
      }

      // Build navigation URL
      const dateObj = new Date(date)
      const year = dateObj.getFullYear()
      const month = dateObj.getMonth() + 1 // 1-indexed
      const url = context?.goalId
        ? buildPluginUrl({
            goalId: context.goalId,
            pluginId: 'study',
            year,
            month,
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
            title: 'Study Hours Tracked',
            subtitle: formatHours(totalHours) + ' total',
            icon: '📚',
            badge: `${data.subjects.length} subject${data.subjects.length !== 1 ? 's' : ''}`,
            gradient: { from: '#A855F7', to: '#8B5CF6' },
            stats: data.subjects.slice(0, 4).map(s => ({
              label: s.subject,
              value: formatHours(s.hours),
              icon: '📖',
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
          title: 'Study',
          subtitle: 'Direct tracking',
          content: formatHours(totalHours),
          icon: '📚',
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
      const charts: PluginAnalyticsChartData[] = []
      const dates = generateDateRange(startDate, endDate)

      // Calculate totals
      const totalHours = calculateSum(data, getDayHours)
      const daysStudied = Object.values(data).filter(d => getDayHours(d) > 0).length

      // Calculate streak (consecutive study days)
      const studyStreak = calculateStreak(data, (d) => getDayHours(d) > 0)

      // Calculate daily hours for heatmap
      const dailyHours = dates.map(date => getDayHours(data[date]))

      // Calculate subject statistics
      const subjectStats: Record<string, { hours: number; days: number; topics: Set<string> }> = {}
      
      Object.values(data).forEach(dayData => {
        if (dayData.subjects) {
          dayData.subjects.forEach(entry => {
            const subject = entry.subject
            if (!subjectStats[subject]) {
              subjectStats[subject] = { hours: 0, days: 0, topics: new Set() }
            }
            subjectStats[subject].hours += entry.hours || 0
            subjectStats[subject].days++
            if (entry.topics) {
              entry.topics.forEach(topic => subjectStats[subject].topics.add(topic))
            }
          })
        }
      })

      const uniqueSubjects = Object.keys(subjectStats).length
      const uniqueTopics = Object.values(subjectStats).reduce((sum, s) => sum + s.topics.size, 0)

      // Metric cards
      if (totalHours > 0 || daysStudied > 0) {
        charts.push({
          chartType: 'metric',
          title: 'Total Study Hours',
          metricData: {
            label: 'Total Hours',
            value: formatHours(totalHours),
            icon: '📚',
            color: '#A855F7',
            subtitle: `Over ${dates.length} days`,
          },
        })

        charts.push({
          chartType: 'metric',
          title: 'Days Studied',
          metricData: {
            label: 'Days Studied',
            value: daysStudied,
            icon: '📅',
            color: '#8B5CF6',
            subtitle: `Out of ${dates.length} days`,
          },
        })

        // Average hours per study day
        const avgHoursPerStudyDay = daysStudied > 0 ? totalHours / daysStudied : 0
        charts.push({
          chartType: 'metric',
          title: 'Avg Hours/Day',
          metricData: {
            label: 'Avg per Day',
            value: formatHours(avgHoursPerStudyDay),
            icon: '⏱️',
            color: '#7C3AED',
            subtitle: 'When studying',
          },
        })

        // Subjects tracked
        if (uniqueSubjects > 0) {
          charts.push({
            chartType: 'metric',
            title: 'Subjects',
            metricData: {
              label: 'Subjects Studied',
              value: uniqueSubjects,
              icon: '📖',
              color: '#6366F1',
              subtitle: `${uniqueTopics} topics covered`,
            },
          })
        }
      }

      // Streak display
      if (studyStreak.longest > 0) {
        charts.push({
          chartType: 'streak',
          title: 'Study Streak',
          size: 'medium',
          streakData: {
            currentStreak: studyStreak.current,
            longestStreak: studyStreak.longest,
            unit: 'days',
            icon: '🔥',
            color: '#A855F7',
            description: 'Consecutive study days',
          },
        })
      }

      // Heat map: Daily study hours
      if (dailyHours.some(h => h > 0)) {
        const heatmapData: Record<string, number> = {}
        dates.forEach((date, index) => {
          if (dailyHours[index] > 0) {
            heatmapData[date] = dailyHours[index]
          }
        })

        charts.push({
          chartType: 'heatmap',
          title: 'Study Activity',
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

export default StudyPlugin
