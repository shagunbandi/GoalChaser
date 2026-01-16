import type { Plugin, PluginAnalyticsChartData } from '@/sdk'
import { TravelDataProvider } from './data-provider'
import { TravelDetailProviderImpl } from './detail-provider'
import TravelPage from './pages/TravelPage'
import type { TravelPlan } from './types'

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
    getDaySummary: (date, data) => {
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

      const plan = activePlans[0] // Show first active plan
      const destination = plan.destination || plan.title

      // Build display content
      let content = destination
      if (activePlans.length > 1) {
        content += ` (+${activePlans.length - 1} more)`
      }

      return {
        color: plan.color || '#8E44AD', // Use plan color or default purple
        hasData: true,
        summary: {
          type: 'chip',
          title: 'Travel',
          content,
          icon: '✈️',
          actions: [
            {
              label: 'View details',
              onClick: () => {
                console.log('Navigate to travel for', date)
              },
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

      if (allPlans.length === 0) {
        return charts
      }

      // Generate date labels
      const dates: string[] = []
      const start = new Date(startDate)
      const end = new Date(endDate)
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        dates.push(d.toISOString().split('T')[0])
      }

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
        chartType: 'heatmap' as const,
        title: 'Travel Days',
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

      // Pie chart: Destinations
      const destinationCounts: Record<string, number> = {}
      allPlans.forEach(plan => {
        const dest = plan.destination || plan.title || 'Unknown'
        destinationCounts[dest] = (destinationCounts[dest] || 0) + 1
      })

      if (Object.keys(destinationCounts).length > 0) {
        const destinations = Object.keys(destinationCounts)
        const counts = destinations.map(d => destinationCounts[d])

        charts.push({
          chartType: 'pie' as const,
          title: 'Trips by Destination',
          data: {
            labels: destinations,
            datasets: [{
              label: 'Trips',
              data: counts,
              color: '#8E44AD',
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
        chartType: 'bar' as const,
        title: 'Trip Duration (Days)',
        data: {
          labels: tripNames,
          datasets: [{
            label: 'Days',
            data: durations,
            color: '#8E44AD',
          }],
        },
      })

      return charts
    },
  },
}

export default TravelPlugin
