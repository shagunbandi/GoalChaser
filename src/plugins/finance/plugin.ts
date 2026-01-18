import type { Plugin, PluginAnalyticsChartData } from '@/sdk'
import { generateDateRange, formatDateLabel, calculateSum } from '@/sdk'
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
    description: 'Track expenses, income, and investments', 
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
      // Calculate day totals
      const totalExpenses = data?.expenses?.reduce((sum, e) => sum + e.amount, 0) || 0
      const totalIncome = data?.income?.reduce((sum, i) => sum + i.amount, 0) || 0
      const totalInvestments = data?.investments?.reduce((sum, inv) => sum + inv.amount, 0) || 0
      const netAmount = totalIncome - totalExpenses - totalInvestments
      const expenseCount = data?.expenses?.length || 0
      const incomeCount = data?.income?.length || 0
      const investmentCount = data?.investments?.length || 0
      const hasDayData = expenseCount > 0 || incomeCount > 0 || investmentCount > 0

      // Calculate month totals from allMonthData
      const allMonthData = context?.allMonthData || {}
      const dateObj = new Date(date)
      const currentMonth = dateObj.getMonth()
      const currentYear = dateObj.getFullYear()

      let monthIncome = 0
      let monthExpenses = 0
      let monthInvestments = 0
      let monthTransactions = 0

      Object.entries(allMonthData).forEach(([dateKey, dayData]) => {
        const d = new Date(dateKey)
        if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
          const finData = dayData as FinanceTransactionData
          monthIncome += finData?.income?.reduce((sum, i) => sum + i.amount, 0) || 0
          monthExpenses += finData?.expenses?.reduce((sum, e) => sum + e.amount, 0) || 0
          monthInvestments += finData?.investments?.reduce((sum, inv) => sum + inv.amount, 0) || 0
          monthTransactions += (finData?.income?.length || 0) + (finData?.expenses?.length || 0) + (finData?.investments?.length || 0)
        }
      })
      
      const monthNet = monthIncome - monthExpenses - monthInvestments
      const hasMonthData = monthTransactions > 0

      // If no day data and no month data, return null
      if (!hasDayData && !hasMonthData) {
        return null
      }

      // Build navigation URL
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

      // Determine badge based on day data if available, otherwise month data
      const badgeNet = hasDayData ? netAmount : monthNet
      const dayTxCount = expenseCount + incomeCount + investmentCount
      const subtitle = hasDayData 
        ? `${dayTxCount} today, ${monthTransactions} this month`
        : `${monthTransactions} transaction${monthTransactions !== 1 ? 's' : ''} this month`

      // Format the net for compact display
      const formatNet = (amount: number) => {
        const sign = amount >= 0 ? '+' : ''
        return `${sign}₹${Math.abs(amount).toLocaleString('en-IN')}`
      }

      // Build stats for inline display (for chip type)
      const compactStats = []
      if (hasDayData) {
        if (totalIncome > 0) {
          compactStats.push({
            label: 'Income',
            value: `₹${totalIncome.toLocaleString('en-IN')}`,
            icon: '💰',
            color: '#22C55E',
          })
        }
        if (totalExpenses > 0) {
          compactStats.push({
            label: 'Expenses',
            value: `₹${totalExpenses.toLocaleString('en-IN')}`,
            icon: '💸',
            color: '#EF4444',
          })
        }
        if (totalInvestments > 0) {
          compactStats.push({
            label: 'Invested',
            value: `₹${totalInvestments.toLocaleString('en-IN')}`,
            icon: '📈',
            color: '#6366F1',
          })
        }
        compactStats.push({
          label: 'Net',
          value: formatNet(netAmount),
          icon: netAmount >= 0 ? '📊' : '📉',
          color: netAmount >= 0 ? '#22C55E' : '#EF4444',
        })
      } else {
        // Show month stats if no day data
        compactStats.push({
          label: 'Income',
          value: `₹${monthIncome.toLocaleString('en-IN')}`,
          icon: '💵',
          color: '#22C55E',
        })
        compactStats.push({
          label: 'Expenses',
          value: `₹${monthExpenses.toLocaleString('en-IN')}`,
          icon: '🛒',
          color: '#EF4444',
        })
        if (monthInvestments > 0) {
          compactStats.push({
            label: 'Invested',
            value: `₹${monthInvestments.toLocaleString('en-IN')}`,
            icon: '📈',
            color: '#6366F1',
          })
        }
        compactStats.push({
          label: 'Net',
          value: formatNet(monthNet),
          icon: monthNet >= 0 ? '📊' : '📉',
          color: monthNet >= 0 ? '#22C55E' : '#EF4444',
        })
      }

      return {
        color: badgeNet >= 0 ? '#22C55E' : '#EF4444',
        hasData: true,
        summary: {
          type: 'stats',
          title: 'Finance',
          subtitle,
          icon: '💰',
          badge: badgeNet >= 0 ? 'Surplus' : 'Deficit',
          gradient: badgeNet >= 0 
            ? { from: '#22C55E', to: '#10B981' }
            : { from: '#EF4444', to: '#DC2626' },
          stats: compactStats, // Single flat stats array instead of sections
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
      const charts: PluginAnalyticsChartData[] = []
      const dates = generateDateRange(startDate, endDate)

      // Calculate totals
      const totalIncome = calculateSum(data, (d) => d?.income?.reduce((sum, i) => sum + i.amount, 0) || 0)
      const totalExpenses = calculateSum(data, (d) => d?.expenses?.reduce((sum, e) => sum + e.amount, 0) || 0)
      const totalInvestments = calculateSum(data, (d) => d?.investments?.reduce((sum, inv) => sum + inv.amount, 0) || 0)
      const netSavings = totalIncome - totalExpenses - totalInvestments

      // Count transactions
      const totalTransactions = calculateSum(data, (d) => 
        (d?.income?.length || 0) + (d?.expenses?.length || 0) + (d?.investments?.length || 0)
      )

      // Calculate daily income, expenses, and investments for charts
      const dailyIncome = dates.map(date => {
        const dayData = data[date]
        return dayData?.income?.reduce((sum, i) => sum + i.amount, 0) || 0
      })

      const dailyExpenses = dates.map(date => {
        const dayData = data[date]
        return dayData?.expenses?.reduce((sum, e) => sum + e.amount, 0) || 0
      })

      const dailyInvestments = dates.map(date => {
        const dayData = data[date]
        return dayData?.investments?.reduce((sum, inv) => sum + inv.amount, 0) || 0
      })

      const hasData = totalIncome > 0 || totalExpenses > 0 || totalInvestments > 0

      // Always show basic metric cards (even with 0 values)
      charts.push({
        chartType: 'metric',
        title: 'Total Income',
        metricData: {
          label: 'Total Income',
          value: `₹${totalIncome.toLocaleString('en-IN')}`,
          icon: '💵',
          color: '#22C55E',
          subtitle: `${dates.length} days`,
        },
      })

      charts.push({
        chartType: 'metric',
        title: 'Total Expenses',
        metricData: {
          label: 'Total Expenses',
          value: `₹${totalExpenses.toLocaleString('en-IN')}`,
          icon: '💸',
          color: '#EF4444',
          subtitle: `${dates.length} days`,
        },
      })

      charts.push({
        chartType: 'metric',
        title: 'Total Investments',
        metricData: {
          label: 'Total Investments',
          value: `₹${totalInvestments.toLocaleString('en-IN')}`,
          icon: '📈',
          color: '#6366F1',
          subtitle: `${dates.length} days`,
        },
      })

      charts.push({
        chartType: 'metric',
        title: 'Net Savings',
        metricData: {
          label: 'Net Savings',
          value: `₹${netSavings.toLocaleString('en-IN')}`,
          icon: netSavings >= 0 ? '📊' : '📉',
          color: netSavings >= 0 ? '#22C55E' : '#EF4444',
          subtitle: netSavings >= 0 ? 'Surplus' : 'Deficit',
        },
      })

      // Calculate monthly data for comparisons and averages
      const monthlyData: Record<string, { income: number; expenses: number; investments: number }> = {}
      dates.forEach((date, index) => {
        const monthKey = date.substring(0, 7) // YYYY-MM
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { income: 0, expenses: 0, investments: 0 }
        }
        monthlyData[monthKey].income += dailyIncome[index]
        monthlyData[monthKey].expenses += dailyExpenses[index]
        monthlyData[monthKey].investments += dailyInvestments[index]
      })

      const monthCount = Object.keys(monthlyData).length
      const avgMonthlySavings = monthCount > 0 ? netSavings / monthCount : 0

      // Average Monthly Savings
      charts.push({
        chartType: 'metric',
        title: 'Avg Monthly Savings',
        metricData: {
          label: 'Avg Monthly Savings',
          value: `₹${Math.round(avgMonthlySavings).toLocaleString('en-IN')}`,
          icon: avgMonthlySavings >= 0 ? '💰' : '📉',
          color: avgMonthlySavings >= 0 ? '#10B981' : '#EF4444',
          subtitle: `Over ${monthCount} month${monthCount !== 1 ? 's' : ''}`,
        },
      })

      // Charts and extras only if there's data
      if (hasData) {
        // Calculate recurring totals and counts
        let recurringIncome = 0
        let recurringIncomeCount = 0
        let recurringExpenses = 0
        let recurringExpenseCount = 0
        let recurringInvestments = 0
        let recurringInvestmentCount = 0

        // Track unique series to count recurring items properly
        const incomeSeriesIds = new Set<string>()
        const expenseSeriesIds = new Set<string>()
        const investmentSeriesIds = new Set<string>()

        Object.values(data).forEach(dayData => {
          if (dayData?.income) {
            dayData.income.forEach(inc => {
              if (inc.isRecurring || inc.seriesId) {
                recurringIncome += inc.amount
                if (inc.seriesId && !incomeSeriesIds.has(inc.seriesId)) {
                  incomeSeriesIds.add(inc.seriesId)
                  recurringIncomeCount++
                } else if (!inc.seriesId) {
                  recurringIncomeCount++
                }
              }
            })
          }
          if (dayData?.expenses) {
            dayData.expenses.forEach(exp => {
              if (exp.isRecurring || exp.seriesId) {
                recurringExpenses += exp.amount
                if (exp.seriesId && !expenseSeriesIds.has(exp.seriesId)) {
                  expenseSeriesIds.add(exp.seriesId)
                  recurringExpenseCount++
                } else if (!exp.seriesId) {
                  recurringExpenseCount++
                }
              }
            })
          }
          if (dayData?.investments) {
            dayData.investments.forEach(inv => {
              if (inv.isRecurring || inv.seriesId) {
                recurringInvestments += inv.amount
                if (inv.seriesId && !investmentSeriesIds.has(inv.seriesId)) {
                  investmentSeriesIds.add(inv.seriesId)
                  recurringInvestmentCount++
                } else if (!inv.seriesId) {
                  recurringInvestmentCount++
                }
              }
            })
          }
        })

        // Calculate monthly amounts
        const recurringIncomePerMonth = monthCount > 0 ? Math.round(recurringIncome / monthCount) : recurringIncome
        const recurringExpensesPerMonth = monthCount > 0 ? Math.round(recurringExpenses / monthCount) : recurringExpenses
        const recurringInvestmentsPerMonth = monthCount > 0 ? Math.round(recurringInvestments / monthCount) : recurringInvestments

        // Recurring metrics
        if (recurringIncome > 0) {
          charts.push({
            chartType: 'metric',
            title: 'Recurring Income',
            metricData: {
              label: 'Recurring Income',
              value: `₹${recurringIncomePerMonth.toLocaleString('en-IN')}`,
              unit: '/month',
              icon: '🔄',
              color: '#22C55E',
              subtitle: `${incomeSeriesIds.size || recurringIncomeCount} recurring source${(incomeSeriesIds.size || recurringIncomeCount) !== 1 ? 's' : ''}`,
            },
          })
        }

        if (recurringExpenses > 0) {
          charts.push({
            chartType: 'metric',
            title: 'Recurring Expenses',
            metricData: {
              label: 'Recurring Expenses',
              value: `₹${recurringExpensesPerMonth.toLocaleString('en-IN')}`,
              unit: '/month',
              icon: '🔁',
              color: '#F59E0B',
              subtitle: `${expenseSeriesIds.size || recurringExpenseCount} recurring expense${(expenseSeriesIds.size || recurringExpenseCount) !== 1 ? 's' : ''}`,
            },
          })
        }

        if (recurringInvestments > 0) {
          charts.push({
            chartType: 'metric',
            title: 'Recurring Investments',
            metricData: {
              label: 'Recurring Investments',
              value: `₹${recurringInvestmentsPerMonth.toLocaleString('en-IN')}`,
              unit: '/month',
              icon: '📊',
              color: '#6366F1',
              subtitle: `${investmentSeriesIds.size || recurringInvestmentCount} SIP${(investmentSeriesIds.size || recurringInvestmentCount) !== 1 ? 's' : ''} & investments`,
            },
          })
        }

        // Pie chart: Expenses by category
        const categoryTotals: Record<string, number> = {}
        Object.values(data).forEach(dayData => {
          if (dayData.expenses) {
            dayData.expenses.forEach(expense => {
              const category = expense.categoryName || 'Uncategorized'
              categoryTotals[category] = (categoryTotals[category] || 0) + expense.amount
            })
          }
        })

        if (Object.keys(categoryTotals).length > 0) {
          const categories = Object.keys(categoryTotals)
          const amounts = categories.map(c => categoryTotals[c])

          charts.push({
            chartType: 'pie',
            title: 'Expenses by Category',
            size: 'medium',
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

      }

      return charts
    },
  },
}

export default FinancePlugin
