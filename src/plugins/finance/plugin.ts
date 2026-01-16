import type { Plugin } from '@/sdk'
import { FinanceDataProvider } from './data-provider'
import { FinanceDetailProviderImpl } from './detail-provider'
import FinancePage from './pages/FinancePage'
import type { FinanceTransactionData } from './types'

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
    getDaySummary: (date, data) => {
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

      // Format summary
      const transactions: Record<string, any> = {}
      if (expenseCount > 0) {
        transactions['Expenses'] = `₹${totalExpenses.toLocaleString('en-IN')}`
      }
      if (incomeCount > 0) {
        transactions['Income'] = `₹${totalIncome.toLocaleString('en-IN')}`
      }
      if (netAmount !== 0) {
        transactions['Net'] = `₹${netAmount.toLocaleString('en-IN')}`
      }

      return {
        color: netAmount >= 0 ? '#34C759' : '#FF3B30', // Green for positive, red for negative
        hasData: true,
        summary: {
          type: 'accordion',
          title: 'Finance',
          content: transactions,
          icon: '💰',
          actions: [
            {
              label: 'Add transaction',
              onClick: () => {
                console.log('Navigate to finance for', date)
              },
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
