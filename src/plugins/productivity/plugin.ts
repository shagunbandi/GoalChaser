/**
 * Productivity Plugin
 */

import React from 'react'
import type { Plugin, PluginAISchema, AIWizardFlowProps, PluginQuickStats, PluginPeriodInsights } from '@/sdk'
import { getScoreColorClass } from '@/utils/score-utils'
import { generateDateRange } from '@/sdk'
import { ProductivityDataProvider } from './data-provider'
import { ProductivityDetailProviderImpl } from './detail-provider'
import ProductivityPage from './pages/ProductivityPage'
import { ProductivityWizardFlow } from './components'
import type { ProductivityDayData, ProductivityConfig } from './types'
import { buildPluginUrl } from '@/lib/plugin-url-utils'
import {
  calculateAreaStreaks,
  calculateAllTimeAverage,
  countUniqueAreas,
  calculatePeriodAverage,
  countHighDays,
  buildAreaBreakdown,
} from './insights-utils'


export const ProductivityPlugin: Plugin<ProductivityDayData, ProductivityConfig> = {
  id: 'productivity',
  
  metadata: {
    name: 'Productivity',
    icon: '📊',
    description: 'Track daily productivity (1-10 scale)',
    version: '1.0.0',
    isPrimary: false,
    enabledByDefault: true,
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
    getCalendarBackground: (data) => {
      if (!data || data.status === null || data.status === undefined) return null
      return { backgroundColor: getScoreColorClass(data.status) }
    },
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

  // Insights integration (new system)
  insights: {
    getQuickStats: (allData, config) => {
      // Calculate streaks per area with config
      const areaStreaks = calculateAreaStreaks(allData, config?.areas)
      
      // Calculate all-time metrics
      const totalDays = Object.keys(allData).filter(
        date => allData[date]?.status !== null || allData[date]?.areas?.length
      ).length
      const avgScore = calculateAllTimeAverage(allData)
      const totalAreas = countUniqueAreas(allData)
      
      const stats: PluginQuickStats = {
        streaks: areaStreaks,
        metrics: [
          {
            label: 'Total Days Tracked',
            value: totalDays,
            subtitle: 'Days with data',
            icon: '📅',
            color: '#06B6D4',
          },
          {
            label: 'All-Time Average',
            value: avgScore > 0 ? `${avgScore.toFixed(1)}/10` : 'N/A',
            subtitle: 'Overall score',
            icon: '📊',
            color: '#3B82F6',
          },
          {
            label: 'Areas Covered',
            value: totalAreas,
            subtitle: 'Unique areas',
            icon: '🎯',
            color: '#8B5CF6',
          },
        ],
      }
      
      return stats
    },
    
    getPeriodInsights: (startDate, endDate, data, config) => {
      const dates = generateDateRange(startDate, endDate)
      
      // Summary metrics
      const avgScore = calculatePeriodAverage(data)
      const daysTracked = Object.keys(data).filter(
        date => data[date]?.status !== null || data[date]?.areas?.length
      ).length
      const highDays = countHighDays(data)
      
      const insights: PluginPeriodInsights = {
        summary: [
          {
            label: 'Average Score',
            value: avgScore > 0 ? `${avgScore.toFixed(1)}/10` : 'N/A',
            subtitle: `${daysTracked} days tracked`,
            icon: '📊',
            color: avgScore >= 7 ? '#34C759' : avgScore >= 4 ? '#FF9500' : '#FF3B30',
          },
          {
            label: 'Days Tracked',
            value: daysTracked,
            subtitle: `${((daysTracked / dates.length) * 100).toFixed(0)}% of period`,
            icon: '📅',
            color: '#007AFF',
          },
          {
            label: 'High Days (7+)',
            value: highDays,
            subtitle: daysTracked > 0 ? `${((highDays / daysTracked) * 100).toFixed(0)}%` : '0%',
            icon: '🔥',
            color: '#34C759',
          },
        ],
        breakdown: buildAreaBreakdown(data),
      }
      
      return insights
    },
    
    defaultTimeRanges: [
      { label: 'Last 7 days', days: 7, id: 'last-7' },
      { label: 'Last 30 days', days: 30, id: 'last-30' },
      { label: 'Last 90 days', days: 90, id: 'last-90' },
    ],
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
