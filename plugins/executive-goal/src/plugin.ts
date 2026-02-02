import React from 'react'
import type { Plugin, PluginQuickStats, PluginPeriodInsights, PluginAISchema, AIWizardFlowProps } from '@goal-chaser/sdk'
import { generateDateRange } from '@goal-chaser/sdk'
import { getCompletionBackgroundColor, createMultiGoalBorderStyle } from './calendar-utils'
import { ExecutiveGoalDataProvider } from './data-provider'
import { ExecutiveGoalDetailProviderImpl } from './detail-provider'
import ExecutiveGoalPage from './pages/ExecutiveGoalPage'
import { ExecutiveGoalWizardFlow } from './components'
import type { ExecutiveGoal, ExecutiveGoalDayData, ExecutiveGoalTask } from './types'
import { buildPluginUrl } from '@goal-chaser/sdk'
import { executiveGoalChat, generateTasks, summarizeProgress } from './actions'
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

  handlers: {
    chat: (payload) => executiveGoalChat(payload),
    generateTasks: (payload) => generateTasks(payload),
    summarizeProgress: (payload) => summarizeProgress(payload),
  },

  // Calendar integration
  calendar: {
    getCalendarBackground: (data) => {
      if (!data?.tasks || data.tasks.length === 0) return null
      const tasks = data.tasks as ExecutiveGoalTask[]
      const completedTasks = tasks.filter((t) => t.completed).length
      const totalTasks = tasks.length
      const completionPercent = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
      const goalColors = [...new Set(tasks.map((t) => t.color || '#8B5CF6'))]
      return {
        backgroundColor: totalTasks > 0 ? getCompletionBackgroundColor(completionPercent) : undefined,
        style: createMultiGoalBorderStyle(goalColors),
      }
    },
    getDaySummary: (date, data, context) => {
      const tasks: ExecutiveGoalTask[] = data?.tasks || []
      if (!Array.isArray(tasks) || tasks.length === 0) return null

      const dateObj = new Date(date)
      const year = dateObj.getFullYear()
      const month = dateObj.getMonth() + 1
      const url = context?.goalId
        ? buildPluginUrl({
            goalId: context.goalId,
            pluginId: 'executiveGoal',
            year,
            month,
            date,
          })
        : undefined

      const completed = tasks.filter((t) => t.completed).length
      const total = tasks.length

      if (tasks.length > 1) {
        return {
          color: '#8B5CF6',
          hasData: true,
          summary: {
            type: 'list',
            title: 'Executive Tasks',
            subtitle: `${completed}/${total} completed`,
            icon: '🎯',
            badge: `${total}`,
            gradient: { from: '#8B5CF6', to: '#7C3AED' },
            items: tasks.slice(0, 5).map((t) => ({
              id: t.id,
              label: t.title || 'Task',
              value: t.completed ? 'Done' : 'Pending',
              icon: '🎯',
              color: t.color || '#8B5CF6',
              subtitle: t.endDate,
            })),
            actions: [{ label: 'View Details', url, variant: 'primary' as const }],
          },
        }
      }

      const task = tasks[0]
      return {
        color: task.color || '#8B5CF6',
        hasData: true,
        summary: {
          type: 'stats',
          title: 'Executive Task',
          subtitle: task.title || 'Task',
          icon: '🎯',
          badge: task.completed ? 'Done' : 'Pending',
          gradient: { from: task.color || '#8B5CF6', to: '#7C3AED' },
          stats: [
            { label: 'Task', value: task.title || 'Task', icon: '🏷️', color: '#8B5CF6' },
            { label: 'Status', value: task.completed ? 'Completed' : 'Pending', icon: '📋', color: '#7C3AED' },
          ],
          actions: [{ label: 'View Details', url, variant: 'primary' as const }],
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
      _existingData: ExecutiveGoalDayData | null,
    ): Partial<ExecutiveGoalDayData> => {
      if (Array.isArray(extracted.executiveGoalPlans) && extracted.executiveGoalPlans.length > 0) {
        const goals: ExecutiveGoal[] = extracted.executiveGoalPlans
          .filter((item): item is Record<string, unknown> =>
            typeof item === 'object' && item !== null
          )
          .map((item, index) => {
            const id = `ai-${Date.now()}-${index}`
            const startDate = item.startDate ? String(item.startDate) : new Date().toISOString().split('T')[0]
            const endDate = item.endDate ? String(item.endDate) : startDate
            return {
              id,
              title: String(item.title || 'Goal'),
              startDate,
              endDate,
              plan: item.plan ? String(item.plan) : undefined,
              note: item.note ? String(item.note) : undefined,
            }
          })
          .filter((g) => g.title.trim() !== '')
        return { _extractedGoals: goals }
      }
      return {}
    },

    renderWizard: (props: AIWizardFlowProps<ExecutiveGoalDayData, unknown>) => {
      return React.createElement(ExecutiveGoalWizardFlow, props)
    },
  },
}

export default ExecutiveGoalPlugin
