import type { Plugin } from '@/sdk'
import { FinanceDataProvider } from './data-provider'
import { FinanceDetailProviderImpl } from './detail-provider'
import FinancePage from './pages/FinancePage'
import type { FinanceTransactionData } from './types'
import { buildPluginUrl } from '@/lib/plugin-url-utils'

export const FinancePlugin: Plugin<FinanceTransactionData> = {
  id: 'finance',
  
  metadata: { 
    name: 'Finance', 
    icon: '💰', 
    description: 'Budget tracking and financial planning', 
    version: '1.0.0', 
    isPrimary: false 
  },
  
  routes: [
    { 
      path: '{year}', 
      component: FinancePage, 
      requiresYear: true 
    }
  ],
  
  dataProvider: new FinanceDataProvider(),
  
  detailProvider: new FinanceDetailProviderImpl(),

  // Calendar integration
  calendar: {
    getDaySummary: (date, data, context) => {
      if (!data || (!data.expenses?.length && !data.income?.length)) {
        return null
      }

      const totalExpenses = data.expenses?.reduce((sum, e) => sum + e.amount, 0) || 0
      const totalIncome = data.income?.reduce((sum, i) => sum + i.amount, 0) || 0
      const netAmount = totalIncome - totalExpenses

      const expenseCount = data.expenses?.length || 0
      const incomeCount = data.income?.length || 0

      if (expenseCount === 0 && incomeCount === 0) {
        return null
      }

      // Build navigation URL
      const dateObj = new Date(date)
      const year = dateObj.getFullYear()
      const month = dateObj.getMonth() + 1 // 1-indexed
      const url = context?.goalId
        ? buildPluginUrl({
            goalId: context.goalId,
            pluginId: 'finance',
            year,
            month,
            date,
          })
        : undefined

      // Use stats to show breakdown
      const stats = []
      if (totalIncome > 0) {
        stats.push({
          label: 'Income',
          value: `₹${totalIncome.toLocaleString('en-IN')}`,
          icon: '💰',
          color: '#22C55E',
          subtitle: `${incomeCount} transaction${incomeCount !== 1 ? 's' : ''}`
        })
      }
      if (totalExpenses > 0) {
        stats.push({
          label: 'Expenses',
          value: `₹${totalExpenses.toLocaleString('en-IN')}`,
          icon: '💸',
          color: '#EF4444',
          subtitle: `${expenseCount} transaction${expenseCount !== 1 ? 's' : ''}`
        })
      }
      if (netAmount !== 0) {
        stats.push({
          label: 'Net',
          value: `₹${netAmount.toLocaleString('en-IN')}`,
          icon: netAmount > 0 ? '📈' : '📉',
          color: netAmount > 0 ? '#22C55E' : '#EF4444',
          subtitle: netAmount > 0 ? 'Surplus' : 'Deficit'
        })
      }

      return {
        color: netAmount >= 0 ? '#22C55E' : '#EF4444',
        hasData: true,
        summary: {
          type: 'stats',
          title: 'Finance',
          subtitle: `${expenseCount + incomeCount} transaction${expenseCount + incomeCount !== 1 ? 's' : ''}`,
          icon: '💰',
          badge: netAmount >= 0 ? 'Surplus' : 'Deficit',
          gradient: netAmount >= 0 
            ? { from: '#22C55E', to: '#10B981' }
            : { from: '#EF4444', to: '#DC2626' },
          stats,
          actions: [
            {
              label: 'View Details',
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

      // Calculate daily income and expenses
      const dailyIncome = dates.map(date => {
        const dayData = data[date]
        return dayData?.income?.reduce((sum, i) => sum + i.amount, 0) || 0
      })

      const dailyExpenses = dates.map(date => {
        const dayData = data[date]
        return dayData?.expenses?.reduce((sum, e) => sum + e.amount, 0) || 0
      })

      const hasData = dailyIncome.some(v => v > 0) || dailyExpenses.some(v => v > 0)

      if (hasData) {
        // Line chart: Income vs Expenses
        charts.push({
          chartType: 'line' as const,
          title: 'Income vs Expenses',
          data: {
            labels: dates.map(d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
            datasets: [
              {
                label: 'Income',
                data: dailyIncome,
                color: '#34C759',
              },
              {
                label: 'Expenses',
                data: dailyExpenses,
                color: '#FF3B30',
              },
            ],
          },
        })

        // Bar chart: Net savings per day
        const dailyNet = dates.map((_, i) => dailyIncome[i] - dailyExpenses[i])
        charts.push({
          chartType: 'bar' as const,
          title: 'Daily Net (Income - Expenses)',
          data: {
            labels: dates.map(d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
            datasets: [{
              label: 'Net Amount',
              data: dailyNet,
              color: '#007AFF',
            }],
          },
        })

        // Pie chart: Expenses by category
        const categoryTotals: Record<string, number> = {}
        Object.values(data).forEach(dayData => {
          if (dayData.expenses) {
            dayData.expenses.forEach(expense => {
              const category = expense.categoryId || 'Uncategorized'
              categoryTotals[category] = (categoryTotals[category] || 0) + expense.amount
            })
          }
        })

        if (Object.keys(categoryTotals).length > 0) {
          const categories = Object.keys(categoryTotals)
          const amounts = categories.map(c => categoryTotals[c])

          charts.push({
            chartType: 'pie' as const,
            title: 'Expenses by Category',
            data: {
              labels: categories,
              datasets: [{
                label: 'Amount',
                data: amounts,
                color: '#FF9500',
              }],
            },
          })
        }

        // Heat map: Transaction activity
        const heatmapData: Record<string, number> = {}
        dates.forEach((date, index) => {
          const totalActivity = dailyIncome[index] + dailyExpenses[index]
          if (totalActivity > 0) {
            heatmapData[date] = totalActivity
          }
        })

        charts.push({
          chartType: 'heatmap' as const,
          title: 'Transaction Activity',
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

export default FinancePlugin
