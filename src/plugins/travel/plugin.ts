import type { Plugin, PluginAnalyticsChartData } from '@/sdk'
import { generateDateRange, formatDateLabel } from '@/sdk'
import { TravelDataProvider } from './data-provider'
import { TravelDetailProviderImpl } from './detail-provider'
import TravelPage from './pages/TravelPage'
import type { TravelPlan } from './types'
import { buildPluginUrl } from '@/lib/plugin-url-utils'

export const TravelPlugin: Plugin = {
  id: 'travel',
  
  metadata: { 
    name: 'Travel', 
    icon: '✈️', 
    description: 'Travel plans and itineraries', 
    version: '1.0.0', 
    isPrimary: false 
  },
  
  routes: [
    { 
      path: '{year}', 
      component: TravelPage, 
      requiresYear: true 
    }
  ],
  
  dataProvider: new TravelDataProvider(),
  
  detailProvider: new TravelDetailProviderImpl(),

  // Calendar integration
  calendar: {
    getDaySummary: (date, data, context) => {
      // Data is now day-based with travelPlans array
      const plans: TravelPlan[] = data?.travelPlans || []
      
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
            pluginId: 'travel',
            year,
            month,
            date,
          })
        : undefined

      // If multiple plans, show as list
      if (activePlans.length > 1) {
        return {
          color: '#F97316',
          hasData: true,
          summary: {
            type: 'list',
            title: 'Travel',
            subtitle: `${activePlans.length} active trip${activePlans.length !== 1 ? 's' : ''}`,
            icon: '✈️',
            badge: `${activePlans.length}`,
            gradient: { from: '#F97316', to: '#EA580C' },
            items: activePlans.slice(0, 5).map(plan => {
              const startDate = new Date(plan.startDate)
              const endDate = new Date(plan.endDate)
              const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
              
              return {
                id: plan.id,
                label: plan.destination || plan.title,
                value: `${days} day${days !== 1 ? 's' : ''}`,
                icon: '🗺️',
                color: plan.color || '#F97316',
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

      return {
        color: plan.color || '#F97316',
        hasData: true,
        summary: {
          type: 'card',
          title: 'Travel',
          subtitle: plan.destination || plan.title,
          icon: '✈️',
          badge: `Day ${currentDay}/${days}`,
          gradient: { from: plan.color || '#F97316', to: '#EA580C' },
          content: {
            'Destination': plan.destination || plan.title,
            'Duration': `${days} day${days !== 1 ? 's' : ''}`,
            'Dates': `${plan.startDate} to ${plan.endDate}`,
            'Status': currentDay === 1 ? 'Starting' : currentDay === days ? 'Ending' : 'Ongoing'
          },
          actions: [
            {
              label: 'View Itinerary',
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

      // Extract unique travel plans from day-based data
      const allPlans: TravelPlan[] = []
      Object.values(data).forEach(dayData => {
        const plans: TravelPlan[] = dayData?.travelPlans || []
        if (Array.isArray(plans)) {
          plans.forEach(plan => {
            if (!allPlans.find(p => p.id === plan.id)) {
              allPlans.push(plan)
            }
          })
        }
      })

      // Count travel days in range
      let travelDaysCount = 0
      dates.forEach(date => {
        const isTravel = allPlans.some(plan => 
          date >= plan.startDate && date <= plan.endDate
        )
        if (isTravel) travelDaysCount++
      })

      // Calculate total days for all trips
      const totalTripDays = allPlans.reduce((sum, plan) => {
        const start = new Date(plan.startDate)
        const end = new Date(plan.endDate)
        return sum + Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
      }, 0)

      // Metric cards
      charts.push({
        chartType: 'metric',
        title: 'Total Trips',
        metricData: {
          label: 'Total Trips',
          value: allPlans.length,
          icon: '✈️',
          color: '#F97316',
          subtitle: 'In date range',
        },
      })

      charts.push({
        chartType: 'metric',
        title: 'Travel Days',
        metricData: {
          label: 'Days Traveling',
          value: travelDaysCount,
          unit: 'days',
          icon: '🗓️',
          color: '#EA580C',
          subtitle: `Out of ${dates.length} days`,
        },
      })

      if (allPlans.length > 0) {
        // Average trip duration
        const avgTripDuration = totalTripDays / allPlans.length
        charts.push({
          chartType: 'metric',
          title: 'Avg Trip Duration',
          metricData: {
            label: 'Avg Duration',
            value: avgTripDuration.toFixed(1),
            unit: 'days',
            icon: '⏱️',
            color: '#D97706',
            subtitle: 'Per trip',
          },
        })

        // Unique destinations
        const uniqueDestinations = new Set(allPlans.map(p => p.destination || p.title))
        charts.push({
          chartType: 'metric',
          title: 'Destinations',
          metricData: {
            label: 'Destinations',
            value: uniqueDestinations.size,
            icon: '🗺️',
            color: '#F59E0B',
            subtitle: 'Unique places',
          },
        })
      }

      if (allPlans.length === 0) {
        return charts
      }

      // Pie chart: Destinations (show first for visual variety)
      const destinationCounts: Record<string, number> = {}
      allPlans.forEach(plan => {
        const dest = plan.destination || plan.title || 'Unknown'
        destinationCounts[dest] = (destinationCounts[dest] || 0) + 1
      })

      if (Object.keys(destinationCounts).length > 0) {
        const destinations = Object.keys(destinationCounts)
        const counts = destinations.map(d => destinationCounts[d])

        charts.push({
          chartType: 'pie',
          title: 'Trips by Destination',
          size: 'medium',
          data: {
            labels: destinations,
            datasets: [{
              label: 'Trips',
              data: counts,
              color: '#F97316',
            }],
          },
        })
      }

      // Bar chart: Trip durations
      const durations = allPlans.map(plan => {
        const start = new Date(plan.startDate)
        const end = new Date(plan.endDate)
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
        return days
      })

      const tripNames = allPlans.map(plan => plan.destination || plan.title || 'Trip')

      charts.push({
        chartType: 'bar',
        title: 'Trip Duration (Days)',
        size: 'medium',
        data: {
          labels: tripNames,
          datasets: [{
            label: 'Days',
            data: durations,
            color: '#F97316',
          }],
        },
      })

      // Heat map: Days traveled
      const heatmapData: Record<string, number> = {}
      dates.forEach(date => {
        const isTravel = allPlans.some(plan => 
          date >= plan.startDate && date <= plan.endDate
        )
        if (isTravel) {
          heatmapData[date] = 1
        }
      })

      charts.push({
        chartType: 'heatmap',
        title: 'Travel Days',
        size: 'large',
        heatmapData,
        dateRange: {
          start: startDate,
          end: endDate,
        },
      })

      return charts
    },
  },
}

export default TravelPlugin
