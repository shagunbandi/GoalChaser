/**
 * Study Plugin
 * 
 * Track study hours spent per day across different subjects and topics.
 */

import type { Plugin, PluginQuickStats, PluginPeriodInsights } from '@/sdk'
import { getVibgyorColors } from '@/utils/score-utils'
import { generateDateRange } from '@/sdk'
import { StudyDataProvider } from './data-provider'
import { StudyDetailProviderImpl } from './detail-provider'
import StudyPage from './pages/StudyPage'
import type { StudyDayData, StudyConfig } from './types'
import { buildPluginUrl } from '@/lib/plugin-url-utils'
import {
  calculateSubjectStreaks,
  calculateAllTimeTotal,
  countUniqueSubjects,
  calculatePeriodTotal,
  calculatePeriodAverage,
  buildSubjectBreakdown,
  formatHours,
  calculateAvgHoursPerDay,
  calculateAvgHoursPerWeek,
  calculateAvgHoursPerMonth,
} from './insights-utils'

// Helper to get total hours for a day
function getDayHours(dayData: StudyDayData | undefined): number {
  if (!dayData) return 0
  const subjectHours = dayData.subjects?.reduce((sum, entry) => sum + (entry.hours || 0), 0) || 0
  return subjectHours > 0 ? subjectHours : (dayData.directHours || 0)
}

export const StudyPlugin: Plugin<StudyDayData, StudyConfig> = {
  id: 'study',
  
  metadata: {
    name: 'Study',
    icon: '📚',
    description: 'Track study hours per day',
    version: '1.0.0',
    isPrimary: false,
    enabledByDefault: true,
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
    getCalendarBackground: (data) => {
      if (!data) return null
      const totalHours = getDayHours(data)
      if (totalHours === 0) return null
      const maxHours = 14
      const vibgyorColors = getVibgyorColors()
      const ratio = Math.min(totalHours / maxHours, 1)
      const colorIndex = Math.min(
        Math.floor(ratio * vibgyorColors.length),
        vibgyorColors.length - 1
      )
      return { backgroundColor: `${vibgyorColors[colorIndex].color}CC` }
    },
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

  // Insights integration (new system)
  insights: {
    getQuickStats: (allData, config) => {
      // Calculate streaks per subject with config
      const subjectStreaks = calculateSubjectStreaks(allData, config?.subjects)
      
      // Calculate all-time metrics
      const totalDays = Object.keys(allData).filter(
        date => allData[date]?.subjects?.length || allData[date]?.directHours
      ).length
      const totalHours = calculateAllTimeTotal(allData)
      const totalSubjects = countUniqueSubjects(allData)
      const avgHoursPerDay = calculateAvgHoursPerDay(allData)
      const avgHoursPerWeek = calculateAvgHoursPerWeek(allData)
      const avgHoursPerMonth = calculateAvgHoursPerMonth(allData)
      
      const stats: PluginQuickStats = {
        streaks: subjectStreaks,
        metrics: [
          {
            label: 'Total Days Studied',
            value: totalDays,
            subtitle: 'Days with data',
            icon: '📅',
            color: '#A855F7',
          },
          {
            label: 'Total Hours',
            value: formatHours(totalHours),
            subtitle: 'All-time total',
            icon: '📚',
            color: '#8B5CF6',
          },
          {
            label: 'Subjects Covered',
            value: totalSubjects,
            subtitle: 'Unique subjects',
            icon: '📖',
            color: '#7C3AED',
          },
          {
            label: 'Average Hours',
            value: {
              daily: formatHours(avgHoursPerDay),
              weekly: formatHours(avgHoursPerWeek),
              monthly: formatHours(avgHoursPerMonth),
            },
            subtitle: 'Study time averages',
            icon: '📊',
            color: '#9333EA',
          },
        ],
      }
      
      return stats
    },
    
    getPeriodInsights: (startDate, endDate, data, config) => {
      const dates = generateDateRange(startDate, endDate)
      
      // Summary metrics
      const totalHours = calculatePeriodTotal(data)
      const avgHoursPerDay = calculatePeriodAverage(data)
      const daysStudied = Object.keys(data).filter(
        date => data[date]?.subjects?.length || data[date]?.directHours
      ).length
      
      // Calculate period-specific averages
      const avgHoursPerWeek = calculateAvgHoursPerWeek(data)
      const avgHoursPerMonth = calculateAvgHoursPerMonth(data)
      const uniqueSubjects = countUniqueSubjects(data)
      
      const insights: PluginPeriodInsights = {
        summary: [
          {
            label: 'Total Hours',
            value: formatHours(totalHours),
            subtitle: `${daysStudied} days studied`,
            icon: '📚',
            color: '#A855F7',
          },
          {
            label: 'Days Studied',
            value: daysStudied,
            subtitle: `${((daysStudied / dates.length) * 100).toFixed(0)}% of period`,
            icon: '📅',
            color: '#8B5CF6',
          },
          {
            label: 'Subjects Covered',
            value: uniqueSubjects,
            subtitle: 'Unique subjects',
            icon: '📖',
            color: '#7C3AED',
          },
          {
            label: 'Avg Hours/Day',
            value: formatHours(avgHoursPerDay),
            subtitle: daysStudied > 0 ? 'Per study day' : 'N/A',
            icon: '⏱️',
            color: '#9333EA',
          },
          {
            label: 'Avg Hours/Week',
            value: formatHours(avgHoursPerWeek),
            subtitle: 'Per week',
            icon: '📊',
            color: '#7E22CE',
          },
          {
            label: 'Avg Hours/Month',
            value: formatHours(avgHoursPerMonth),
            subtitle: 'Per month',
            icon: '📈',
            color: '#6B21A8',
          },
        ],
        breakdown: buildSubjectBreakdown(data),
      }
      
      return insights
    },
    
    defaultTimeRanges: [
      { label: 'Last 7 days', days: 7, id: 'last-7' },
      { label: 'Last 30 days', days: 30, id: 'last-30' },
      { label: 'Last 90 days', days: 90, id: 'last-90' },
    ],
  },
}

export default StudyPlugin
