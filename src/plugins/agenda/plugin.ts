import type { Plugin } from '@/sdk'
import { AgendaDataProvider } from './data-provider'
import { AgendaDetailProviderImpl } from './detail-provider'
import AgendaPage from './pages/AgendaPage'
import type { AgendaItem } from './types'
import { buildPluginUrl } from '@/lib/plugin-url-utils'

export const AgendaPlugin: Plugin = {
  id: 'agenda',
  
  metadata: { 
    name: 'Agenda', 
    icon: '📋', 
    description: 'Plan and track daily agenda items', 
    version: '1.0.0', 
    isPrimary: false 
  },
  
  routes: [
    { 
      path: '{year}', 
      component: AgendaPage, 
      requiresYear: true 
    }
  ],
  
  dataProvider: new AgendaDataProvider(),
  
  detailProvider: new AgendaDetailProviderImpl(),

  // Calendar integration
  calendar: {
    getDaySummary: (date, data, context) => {
      // Data expected to be array of agenda items
      const items: AgendaItem[] = data?.agendaItems || data || []
      
      if (!Array.isArray(items) || items.length === 0) {
        return null
      }

      const completedCount = items.filter(item => item.completed).length
      const totalCount = items.length

      // Build navigation URL
      const dateObj = new Date(date)
      const year = dateObj.getFullYear()
      const url = context?.goalId
        ? buildPluginUrl({
            goalId: context.goalId,
            pluginId: 'agenda',
            year,
            date,
          })
        : undefined

      return {
        color: '#FF9500', // Orange
        hasData: true,
        summary: {
          type: 'accordion',
          title: 'Agenda',
          content: `${completedCount}/${totalCount} completed`,
          icon: '📋',
          actions: [
            {
              label: 'Add item',
              url,
              variant: 'primary',
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

      // Calculate daily task metrics
      const dailyTotals = dates.map(date => {
        const items: AgendaItem[] = data[date]?.agendaItems || data[date] || []
        return Array.isArray(items) ? items.length : 0
      })

      const dailyCompleted = dates.map(date => {
        const items: AgendaItem[] = data[date]?.agendaItems || data[date] || []
        if (!Array.isArray(items)) return 0
        return items.filter(item => item.completed).length
      })

      const dailyCompletionRate = dates.map((date, i) => {
        const total = dailyTotals[i]
        const completed = dailyCompleted[i]
        return total > 0 ? Math.round((completed / total) * 100) : 0
      })

      const hasData = dailyTotals.some(v => v > 0)

      if (hasData) {
        // Line chart: Completion rate over time
        charts.push({
          chartType: 'line' as const,
          title: 'Daily Completion Rate',
          data: {
            labels: dates.map(d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
            datasets: [{
              label: 'Completion %',
              data: dailyCompletionRate,
              color: '#FF9500',
            }],
          },
        })

        // Bar chart: Tasks per day
        charts.push({
          chartType: 'bar' as const,
          title: 'Tasks per Day',
          data: {
            labels: dates.map(d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
            datasets: [
              {
                label: 'Total Tasks',
                data: dailyTotals,
                color: '#007AFF',
              },
              {
                label: 'Completed',
                data: dailyCompleted,
                color: '#34C759',
              },
            ],
          },
        })

        // Pie chart: Overall completion
        const totalTasks = dailyTotals.reduce((sum, v) => sum + v, 0)
        const totalCompleted = dailyCompleted.reduce((sum, v) => sum + v, 0)
        const totalPending = totalTasks - totalCompleted

        if (totalTasks > 0) {
          charts.push({
            chartType: 'pie' as const,
            title: 'Overall Task Status',
            data: {
              labels: ['Completed', 'Pending'],
              datasets: [{
                label: 'Tasks',
                data: [totalCompleted, totalPending],
                color: '#FF9500',
              }],
            },
          })
        }

        // Heat map: Task activity
        const heatmapData: Record<string, number> = {}
        dates.forEach((date, index) => {
          if (dailyTotals[index] > 0) {
            heatmapData[date] = dailyTotals[index]
          }
        })

        charts.push({
          chartType: 'heatmap' as const,
          title: 'Task Activity',
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

      return charts
    },
  },
}

export default AgendaPlugin
