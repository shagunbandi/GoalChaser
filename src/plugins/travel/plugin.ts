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
              
              // Show both title and destination if both exist
              const hasTitle = plan.title && plan.title.trim().length > 0
              const hasDestination = plan.destination && plan.destination.trim().length > 0
              let label = ''
              if (hasTitle && hasDestination && plan.title !== plan.destination) {
                label = `${plan.title} • ${plan.destination}`
              } else {
                label = plan.destination || plan.title || 'Trip'
              }
              
              return {
                id: plan.id,
                label,
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

      // Build subtitle showing both title and destination if both exist
      const hasTitle = plan.title && plan.title.trim().length > 0
      const hasDestination = plan.destination && plan.destination.trim().length > 0
      let subtitle = ''
      if (hasTitle && hasDestination && plan.title !== plan.destination) {
        subtitle = `${plan.title} • ${plan.destination}`
      } else {
        subtitle = plan.destination || plan.title || 'Trip'
      }

      // Build stats for expanded view
      const stats = []
      if (hasTitle && plan.title) {
        stats.push({
          label: 'Trip',
          value: plan.title,
          icon: '🏷️',
          color: '#F97316',
        })
      }
      if (hasDestination && plan.destination) {
        stats.push({
          label: 'Destination',
          value: plan.destination,
          icon: '📍',
          color: '#EA580C',
        })
      }
      stats.push({
        label: 'Duration',
        value: `${days} day${days !== 1 ? 's' : ''}`,
        icon: '⏱️',
        color: '#D97706',
      })
      stats.push({
        label: 'Status',
        value: currentDay === 1 ? 'Starting' : currentDay === days ? 'Ending' : 'Ongoing',
        icon: currentDay === 1 ? '🚀' : currentDay === days ? '🏁' : '✈️',
        color: '#F59E0B',
      })

      return {
        color: plan.color || '#F97316',
        hasData: true,
        summary: {
          type: 'stats',
          title: 'Travel',
          subtitle,
          icon: '✈️',
          badge: `Day ${currentDay}/${days}`,
          gradient: { from: plan.color || '#F97316', to: '#EA580C' },
          stats,
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

      // Calculate weekday vs weekend travel days
      let weekdayTravelDays = 0
      let weekendTravelDays = 0
      const heatmapData: Record<string, number> = {}
      
      dates.forEach(date => {
        const isTravel = allPlans.some(plan => 
          date >= plan.startDate && date <= plan.endDate
        )
        if (isTravel) {
          heatmapData[date] = 1
          const dayOfWeek = new Date(date).getDay()
          if (dayOfWeek === 0 || dayOfWeek === 6) {
            weekendTravelDays++
          } else {
            weekdayTravelDays++
          }
        }
      })

      // Weekday vs Weekend metrics
      charts.push({
        chartType: 'metric',
        title: 'Weekday Travel',
        metricData: {
          label: 'Weekday Days',
          value: weekdayTravelDays,
          unit: 'days',
          icon: '💼',
          color: '#3B82F6',
          subtitle: 'Mon-Fri travel',
        },
      })

      charts.push({
        chartType: 'metric',
        title: 'Weekend Travel',
        metricData: {
          label: 'Weekend Days',
          value: weekendTravelDays,
          unit: 'days',
          icon: '🏖️',
          color: '#8B5CF6',
          subtitle: 'Sat-Sun travel',
        },
      })

      // Longest and shortest trip
      const tripDurations = allPlans.map(plan => {
        const start = new Date(plan.startDate)
        const end = new Date(plan.endDate)
        return {
          name: plan.title || plan.destination || 'Trip',
          days: Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
        }
      })

      if (tripDurations.length > 0) {
        const longestTrip = tripDurations.reduce((max, t) => t.days > max.days ? t : max, tripDurations[0])
        const shortestTrip = tripDurations.reduce((min, t) => t.days < min.days ? t : min, tripDurations[0])

        charts.push({
          chartType: 'metric',
          title: 'Longest Trip',
          metricData: {
            label: 'Longest Trip',
            value: longestTrip.days,
            unit: 'days',
            icon: '🏆',
            color: '#10B981',
            subtitle: longestTrip.name,
          },
        })

        if (allPlans.length > 1) {
          charts.push({
            chartType: 'metric',
            title: 'Shortest Trip',
            metricData: {
              label: 'Shortest Trip',
              value: shortestTrip.days,
              unit: 'days',
              icon: '⚡',
              color: '#F59E0B',
              subtitle: shortestTrip.name,
            },
          })
        }
      }

      // Bar chart: Travel by month
      const monthlyTravel: Record<string, number> = {}
      dates.forEach(date => {
        const isTravel = allPlans.some(plan => 
          date >= plan.startDate && date <= plan.endDate
        )
        if (isTravel) {
          const monthKey = date.substring(0, 7) // YYYY-MM
          const monthName = new Date(date).toLocaleDateString('en-US', { month: 'short' })
          monthlyTravel[monthName] = (monthlyTravel[monthName] || 0) + 1
        }
      })

      if (Object.keys(monthlyTravel).length > 1) {
        charts.push({
          chartType: 'bar',
          title: 'Travel Days by Month',
          size: 'medium',
          data: {
            labels: Object.keys(monthlyTravel),
            datasets: [{
              label: 'Days',
              data: Object.values(monthlyTravel),
              color: '#F97316',
            }],
          },
        })
      }

      // Heat map: Days traveled
      charts.push({
        chartType: 'heatmap',
        title: 'Travel Activity',
        size: 'small',
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
