import type { Plugin, PluginAnalyticsChartData } from '@/sdk'
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
