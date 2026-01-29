import React from 'react'
import type { Plugin, PluginQuickStats, PluginPeriodInsights, PluginAISchema, AIWizardFlowProps } from '@/sdk'
import { generateDateRange } from '@/sdk'
import { ExecutiveGoalDataProvider } from './data-provider'
import { ExecutiveGoalDetailProviderImpl } from './detail-provider'
import ExecutiveGoalPage from './pages/ExecutiveGoalPage'
import { ExecutiveGoalWizardFlow } from './components'
import type { ExecutiveGoalPlan, ExecutiveGoalDayData } from './types'
import { buildPluginUrl } from '@/lib/plugin-url-utils'
import {
  countTotalPlans,
  countUniquePlaces,
  calculateTotalDaysOnGoals,
  getMostVisitedDestination,
  getTopVisitedDestinations,
  countPlansInPeriod,
  calculateDaysOnGoalsInPeriod,
  calculateAveragePlanDuration,
  buildDestinationBreakdown,
  calculatePlansPerMonth,
} from './insights-utils'

export const ExecutiveGoalPlugin: Plugin = {
  id: 'executiveGoal',
  
  metadata: { 
    name: 'Executive Goals', 
    icon: '🎯', 
    description: 'Executive goals and strategic initiatives', 
    version: '1.0.0', 
    isPrimary: false 
  },
  
  routes: [
    { 
      path: '{year}', 
      component: ExecutiveGoalPage, 
      requiresYear: true 
    }
  ],
  
  dataProvider: new ExecutiveGoalDataProvider(),
  
  detailProvider: new ExecutiveGoalDetailProviderImpl(),

  // Calendar integration
  calendar: {
    getDaySummary: (date, data, context) => {
      // Data is now day-based with executiveGoalPlans array
      const plans: ExecutiveGoalPlan[] = data?.executiveGoalPlans || []
      
      if (!Array.isArray(plans) || plans.length === 0) {
        return null
      }

      // Find plans that include this date
      const activePlans = plans.filter(plan => 
        date >= plan.startDate && date <= plan.endDate
      )

      if (activePlans.length === 0) {
        return null
      }

      // Build navigation URL
      const dateObj = new Date(date)
      const year = dateObj.getFullYear()
      const month = dateObj.getMonth() + 1 // 1-indexed
      const url = context?.goalId
        ? buildPluginUrl({
            goalId: context.goalId,
            pluginId: 'executiveGoal',
            year,
            month,
            date,
          })
        : undefined

      // If multiple plans, show as list
      if (activePlans.length > 1) {
        return {
          color: '#8B5CF6',
          hasData: true,
          summary: {
            type: 'list',
            title: 'Executive Goals',
            subtitle: `${activePlans.length} active goal${activePlans.length !== 1 ? 's' : ''}`,
            icon: '🎯',
            badge: `${activePlans.length}`,
            gradient: { from: '#8B5CF6', to: '#7C3AED' },
            items: activePlans.slice(0, 5).map(plan => {
              const startDate = new Date(plan.startDate)
              const endDate = new Date(plan.endDate)
              const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
              
              return {
                id: plan.id,
                label: plan.title || 'Goal',
                value: `${days} day${days !== 1 ? 's' : ''}`,
                icon: '🎯',
                color: plan.color || '#8B5CF6',
                subtitle: `${plan.startDate} to ${plan.endDate}`
              }
            }),
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

      // Single plan, use card
      const plan = activePlans[0]
      const startDate = new Date(plan.startDate)
      const endDate = new Date(plan.endDate)
      const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
      const currentDay = Math.ceil((new Date(date).getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1

      // Build stats for expanded view
      const stats = []
      if (plan.title) {
        stats.push({
          label: 'Goal',
          value: plan.title,
          icon: '🏷️',
          color: '#8B5CF6',
        })
      }
      if (plan.plan) {
        stats.push({
          label: 'Description',
          value: plan.plan,
          icon: '📋',
          color: '#7C3AED',
        })
      }
      stats.push({
        label: 'Duration',
        value: `${days} day${days !== 1 ? 's' : ''}`,
        icon: '⏱️',
        color: '#6D28D9',
      })
      stats.push({
        label: 'Status',
        value: currentDay === 1 ? 'Starting' : currentDay === days ? 'Ending' : 'Ongoing',
        icon: currentDay === 1 ? '🚀' : currentDay === days ? '🏁' : '🎯',
        color: '#A78BFA',
      })

      return {
        color: plan.color || '#8B5CF6',
        hasData: true,
        summary: {
          type: 'stats',
          title: 'Executive Goal',
          subtitle: plan.title || 'Goal',
          icon: '🎯',
          badge: `Day ${currentDay}/${days}`,
          gradient: { from: plan.color || '#8B5CF6', to: '#7C3AED' },
          stats,
          actions: [
            {
              label: 'View Progress',
              url,
              variant: 'primary',
            },
          ],
        },
      }
    },
  },

  // Insights integration (new system)
  insights: {
    getQuickStats: (allData) => {
      // Calculate all-time metrics
      const totalPlans = countTotalPlans(allData)
      const uniqueCategories = countUniquePlaces(allData)
      const totalDays = calculateTotalDaysOnGoals(allData)
      const topGoals = getTopVisitedDestinations(allData)
      const plansPerMonth = calculatePlansPerMonth(allData)
      
      const rankEmojis = ['🥇', '🥈', '🥉']
      const rankColors = ['#A78BFA', '#6D28D9', '#5B21B6']
      
      const stats: PluginQuickStats = {
        metrics: [
          {
            label: 'Total Goals',
            value: totalPlans,
            subtitle: 'All-time',
            icon: '🎯',
            color: '#8B5CF6',
          },
          {
            label: 'Goal Categories',
            value: uniqueCategories,
            subtitle: 'Different types',
            icon: '📂',
            color: '#7C3AED',
          },
          {
            label: 'Days on Goals',
            value: totalDays,
            subtitle: 'Total days',
            icon: '🗓️',
            color: '#6D28D9',
          },
          // Top 3 longest goals
          ...topGoals.map((goal, index) => ({
            label: index === 0 ? 'Longest Goal' : `${index + 1}${index === 1 ? 'nd' : 'rd'} Longest`,
            value: goal.name,
            subtitle: `${goal.days} day${goal.days !== 1 ? 's' : ''}`,
            icon: rankEmojis[index],
            color: rankColors[index],
          })),
        ],
      }
      
      return stats
    },
    
    getPeriodInsights: (startDate, endDate, data) => {
      const dates = generateDateRange(startDate, endDate)
      
      // Calculate period metrics
      const plansInPeriod = countPlansInPeriod(data)
      const daysOnGoals = calculateDaysOnGoalsInPeriod(data)
      const uniqueCategories = countUniquePlaces(data)
      const avgDuration = calculateAveragePlanDuration(data)
      
      const insights: PluginPeriodInsights = {
        summary: [
          {
            label: 'Goals',
            value: plansInPeriod,
            subtitle: 'In this period',
            icon: '🎯',
            color: '#8B5CF6',
          },
          {
            label: 'Days on Goals',
            value: daysOnGoals,
            subtitle: `${((daysOnGoals / dates.length) * 100).toFixed(0)}% of period`,
            icon: '📅',
            color: '#7C3AED',
          },
          {
            label: 'Goal Categories',
            value: uniqueCategories,
            subtitle: 'Different types',
            icon: '📂',
            color: '#6D28D9',
          },
          {
            label: 'Avg Goal Duration',
            value: avgDuration > 0 ? `${avgDuration} day${avgDuration !== 1 ? 's' : ''}` : 'N/A',
            subtitle: 'Per goal',
            icon: '⏱️',
            color: '#A78BFA',
          },
        ],
        breakdown: buildDestinationBreakdown(data),
      }
      
      return insights
    },
    
    defaultTimeRanges: [
      { label: 'Last 30 days', days: 30, id: 'last-30' },
      { label: 'Last 90 days', days: 90, id: 'last-90' },
      { label: 'Last 6 months', days: 180, id: 'last-180' },
      { label: 'Last year', days: 365, id: 'last-365' },
    ],
  },

  // AI integration for natural language data extraction
  aiIntegration: {
    getSchema: (): PluginAISchema => {
      return {
        pluginId: 'executiveGoal',
        description: 'Tracks executive goals, strategic initiatives, and business objectives with descriptions, dates, and notes',
        fields: [
          {
            key: 'executiveGoalPlans',
            type: 'array',
            label: 'Executive Goals',
            aiHint: 'Executive goals, strategic initiatives, or business objectives mentioned by the user. Look for mentions of goals, projects, initiatives, objectives, milestones, etc.',
            itemSchema: {
              fields: [
                {
                  key: 'title',
                  type: 'string',
                  label: 'Goal Title',
                  aiHint: 'A name or title for the goal (e.g., "Q1 Strategic Planning", "Product Launch")',
                },
                {
                  key: 'plan',
                  type: 'string',
                  label: 'Plan',
                  aiHint: 'Phase plan or key objectives for the goal',
                },
                {
                  key: 'startDate',
                  type: 'date',
                  label: 'Start Date',
                  aiHint: 'When the goal starts (YYYY-MM-DD format). Use the context date if user says "today" or "tomorrow"',
                },
                {
                  key: 'endDate',
                  type: 'date',
                  label: 'End Date',
                  aiHint: 'When the goal ends (YYYY-MM-DD format). If not mentioned, assume same as start date for single-day goals',
                },
                {
                  key: 'note',
                  type: 'string',
                  label: 'Notes',
                  aiHint: 'Any additional notes about the goal',
                },
              ],
            },
          },
        ],
        examples: [
          {
            input: 'Starting Q1 strategic planning tomorrow for a week. Need to review financial targets and set OKRs.',
            output: {
              executiveGoalPlans: [{
                title: 'Q1 Strategic Planning',
                plan: 'Review financial targets and set OKRs',
              }],
            },
          },
          {
            input: 'Product launch event today. Launching new mobile app version 2.0',
            output: {
              executiveGoalPlans: [{
                title: 'Product Launch',
                plan: 'Launching new mobile app version 2.0',
              }],
            },
          },
        ],
      }
    },

    parseAIData: (
      extracted: Record<string, unknown>,
      existingData: ExecutiveGoalDayData | null,
    ): Partial<ExecutiveGoalDayData> => {
      const result: Partial<ExecutiveGoalDayData> = {}

      // Parse executive goal plans
      if (Array.isArray(extracted.executiveGoalPlans) && extracted.executiveGoalPlans.length > 0) {
        const newPlans: ExecutiveGoalPlan[] = extracted.executiveGoalPlans
          .filter((item): item is Record<string, unknown> =>
            typeof item === 'object' && item !== null
          )
          .map((item, index) => {
            // Generate a unique ID for new plans
            const id = `ai-${Date.now()}-${index}`
            
            return {
              id,
              title: String(item.title || 'Goal'),
              plan: item.plan ? String(item.plan) : undefined,
              startDate: item.startDate ? String(item.startDate) : new Date().toISOString().split('T')[0],
              endDate: item.endDate ? String(item.endDate) : (item.startDate ? String(item.startDate) : new Date().toISOString().split('T')[0]),
              note: item.note ? String(item.note) : undefined,
            }
          })
          .filter(plan => plan.title.trim() !== '')

        // Merge with existing plans (avoid duplicates by checking title/destination)
        const existingPlans = existingData?.executiveGoalPlans || []
        const mergedPlans = [...existingPlans]

        for (const newPlan of newPlans) {
          const isDuplicate = existingPlans.some(
            existing =>
              (existing.title === newPlan.title && existing.startDate === newPlan.startDate && existing.endDate === newPlan.endDate)
          )
          if (!isDuplicate) {
            mergedPlans.push(newPlan)
          }
        }

        result.executiveGoalPlans = mergedPlans
      } else if (existingData?.executiveGoalPlans) {
        // Preserve existing executive goal plans if no new ones extracted
        result.executiveGoalPlans = existingData.executiveGoalPlans
      }

      return result
    },

    renderWizard: (props: AIWizardFlowProps<ExecutiveGoalDayData, unknown>) => {
      return React.createElement(ExecutiveGoalWizardFlow, props)
    },
  },
}

export default ExecutiveGoalPlugin
