/**
 * Productivity Plugin
 */

import React from 'react'
import type { Plugin, PluginAnalyticsChartData, PluginAISchema, AIWizardFlowProps } from '@/sdk'
import { calculateStreak, calculateAverage, generateDateRange } from '@/sdk'
import { ProductivityDataProvider } from './data-provider'
import { ProductivityDetailProviderImpl } from './detail-provider'
import ProductivityPage from './pages/ProductivityPage'
import { ProductivityWizardFlow } from './components'
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

  // AI integration for natural language data extraction
  aiIntegration: {
    getSchema: (config: ProductivityConfig | null): PluginAISchema => {
      // Build detailed area information for AI matching
      const areaDetails = config?.areas?.map(area => {
        const topicsList = area.topics.length > 0 
          ? ` (topics: ${area.topics.join(', ')})`
          : ''
        return `- "${area.name}"${topicsList}`
      }).join('\n') || 'No existing areas configured'

      const areasHint = config?.areas && config.areas.length > 0
        ? `IMPORTANT: You MUST match user mentions to existing areas when possible. For example:
- "running" or "went for a run" → use existing area "run" (if it exists)
- "snowboarding" → use existing area "snowboard" (if it exists)  
- "reading" → use existing area "Reading" (if it exists)
- Match similar words: "coding" → "Coding", "exercise" → "Exercise", etc.

Existing areas configured:
${areaDetails}

When the user mentions an activity that matches an existing area (even if worded differently), use the EXACT existing area name. Only create new area names if no similar existing area is found.`
        : 'Any work areas or categories the user mentions. Extract the area name as mentioned by the user.'

      return {
        pluginId: 'productivity',
        description: 'Tracks daily productivity score (1-10 scale) and work areas/topics covered during the day',
        fields: [
          {
            key: 'status',
            type: 'number',
            label: 'Productivity Score',
            aiHint: 'A score from 1-10 indicating how productive the day was. 1=very unproductive, 5=average, 10=extremely productive. Look for phrases like "productive day", "got a lot done", "felt lazy", or explicit ratings.',
            validation: { min: 1, max: 10 },
          },
          {
            key: 'areas',
            type: 'array',
            label: 'Work Areas',
            aiHint: `Work areas or categories the user worked on. ${areasHint}

For topics: If the user mentions a topic that matches an existing topic in an area, use the EXACT existing topic name. Otherwise, extract the topic as mentioned.`,
            itemSchema: {
              fields: [
                {
                  key: 'area',
                  type: 'string',
                  label: 'Area Name',
                  aiHint: 'The name of the work area. MUST use existing area names when a match is found (even if worded differently).',
                },
                {
                  key: 'topics',
                  type: 'array',
                  label: 'Topics',
                  aiHint: 'Specific topics or tasks within this area. Use existing topic names when they match.',
                },
              ],
            },
          },
          {
            key: 'directHours',
            type: 'number',
            label: 'Hours Worked',
            aiHint: 'Total hours worked or spent on productive activities. Look for mentions like "worked 8 hours", "spent 3 hours on..."',
            validation: { min: 0, max: 24 },
          },
        ],
        examples: [
          {
            input: 'Had a really productive day today, maybe 8/10. Worked on the frontend project for about 4 hours, mainly React components and styling.',
            output: {
              status: 8,
              areas: [{ area: 'Frontend', topics: ['React components', 'styling'] }],
              directHours: 4,
            },
          },
          {
            input: 'Not a great day, felt distracted. Only managed to do some reading and a bit of coding.',
            output: {
              status: 4,
              areas: [
                { area: 'Reading', topics: [] },
                { area: 'Coding', topics: [] },
              ],
            },
          },
          {
            input: 'I did running today, also did some snowboarding. I read for half an hour and spent around 50 mins on Sapiens.',
            output: {
              areas: [
                { area: 'run', topics: [] }, // "running" matched to existing "run"
                { area: 'snowboard', topics: [] }, // "snowboarding" matched to existing "snowboard"
                { area: 'Reading', topics: ['Sapiens'] }, // "read" matched to existing "Reading"
              ],
            },
          },
        ],
      }
    },

    parseAIData: (
      extracted: Record<string, unknown>,
      existingData: ProductivityDayData | null,
      _config: ProductivityConfig | null
    ): Partial<ProductivityDayData> => {
      const result: Partial<ProductivityDayData> = {}

      // Parse status (productivity score)
      if (extracted.status !== undefined && extracted.status !== null) {
        const status = Number(extracted.status)
        if (!isNaN(status) && status >= 1 && status <= 10) {
          result.status = Math.round(status)
        }
      }

      // Parse areas
      if (Array.isArray(extracted.areas) && extracted.areas.length > 0) {
        result.areas = extracted.areas
          .filter((item): item is Record<string, unknown> => 
            typeof item === 'object' && item !== null && 'area' in item
          )
          .map(item => ({
            area: String(item.area || ''),
            topics: Array.isArray(item.topics)
              ? item.topics.map(t => String(t))
              : [],
          }))
          .filter(a => a.area.trim() !== '')
      }

      // Parse direct hours
      if (extracted.directHours !== undefined && extracted.directHours !== null) {
        const hours = Number(extracted.directHours)
        if (!isNaN(hours) && hours >= 0 && hours <= 24) {
          result.directHours = hours
        }
      }

      // Preserve existing data for fields not extracted
      if (existingData) {
        if (result.status === undefined && existingData.status !== undefined) {
          result.status = existingData.status
        }
        if (!result.areas && existingData.areas) {
          result.areas = existingData.areas
        }
        if (result.directHours === undefined && existingData.directHours !== undefined) {
          result.directHours = existingData.directHours
        }
      }

      return result
    },

    renderWizard: (props: AIWizardFlowProps<ProductivityDayData, ProductivityConfig>) => {
      return React.createElement(ProductivityWizardFlow, props)
    },
  },
}

export default ProductivityPlugin
