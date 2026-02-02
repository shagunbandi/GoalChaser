import React from 'react'
import type { Plugin, PluginQuickStats, PluginPeriodInsights, PluginAISchema, AIWizardFlowProps } from '@/sdk'
import { generateDateRange } from '@/sdk'
import { TravelDataProvider } from './data-provider'
import { TravelDetailProviderImpl } from './detail-provider'
import TravelPage from './pages/TravelPage'
import { TravelWizardFlow, TravelInsightsCustomView } from './components'
import type { TravelPlan, TravelDayData, TravelConfig } from './types'
import { buildPluginUrl } from '@/lib/plugin-url-utils'
import {
  countTotalTrips,
  countUniquePlaces,
  calculateTotalDaysTraveled,
  getMostVisitedDestination,
  getTopVisitedDestinations,
  countTripsInPeriod,
  calculateDaysTraveledInPeriod,
  calculateAverageTripDuration,
  buildDestinationBreakdown,
  calculateTripsPerMonth,
} from './insights-utils'

export const TravelPlugin: Plugin<TravelDayData, TravelConfig> = {
  id: 'travel',
  
  metadata: { 
    name: 'Travel', 
    icon: '✈️', 
    description: 'Travel plans and itineraries', 
    version: '1.0.0', 
    isPrimary: false,
    enabledByDefault: true,
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
    getCalendarBackground: (data) => {
      if (!data || !data.travelPlans || data.travelPlans.length === 0) return null
      return { backgroundColor: 'bg-blue-500/20' }
    },
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

  // Insights integration (new system)
  insights: {
    getQuickStats: (allData) => {
      // Calculate all-time metrics
      const totalTrips = countTotalTrips(allData)
      const uniquePlaces = countUniquePlaces(allData)
      const totalDays = calculateTotalDaysTraveled(allData)
      const topDestinations = getTopVisitedDestinations(allData)
      const tripsPerMonth = calculateTripsPerMonth(allData)
      
      const rankEmojis = ['🥇', '🥈', '🥉']
      const rankColors = ['#F59E0B', '#D97706', '#B45309']
      
      const stats: PluginQuickStats = {
        metrics: [
          {
            label: 'Total Trips',
            value: totalTrips,
            subtitle: 'All-time',
            icon: '🌍',
            color: '#F97316',
          },
          {
            label: 'Unique Places',
            value: uniquePlaces,
            subtitle: 'Destinations visited',
            icon: '📍',
            color: '#EA580C',
          },
          {
            label: 'Days Traveled',
            value: totalDays,
            subtitle: 'Total days',
            icon: '🗓️',
            color: '#D97706',
          },
          // Top 3 visited destinations
          ...topDestinations.map((dest, index) => ({
            label: index === 0 ? 'Most Visited' : `${index + 1}${index === 1 ? 'nd' : 'rd'} Most Visited`,
            value: dest.name,
            subtitle: `${dest.visits} visit${dest.visits !== 1 ? 's' : ''} • ${dest.days} day${dest.days !== 1 ? 's' : ''}`,
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
      const tripsInPeriod = countTripsInPeriod(data)
      const daysTraveled = calculateDaysTraveledInPeriod(data)
      const uniquePlaces = countUniquePlaces(data)
      const avgDuration = calculateAverageTripDuration(data)
      
      const insights: PluginPeriodInsights = {
        summary: [
          {
            label: 'Trips',
            value: tripsInPeriod,
            subtitle: 'In this period',
            icon: '🌍',
            color: '#F97316',
          },
          {
            label: 'Days Traveled',
            value: daysTraveled,
            subtitle: `${((daysTraveled / dates.length) * 100).toFixed(0)}% of period`,
            icon: '📅',
            color: '#EA580C',
          },
          {
            label: 'Unique Places',
            value: uniquePlaces,
            subtitle: 'Destinations',
            icon: '📍',
            color: '#D97706',
          },
          {
            label: 'Avg Trip Duration',
            value: avgDuration > 0 ? `${avgDuration} day${avgDuration !== 1 ? 's' : ''}` : 'N/A',
            subtitle: 'Per trip',
            icon: '⏱️',
            color: '#F59E0B',
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
    customView: TravelInsightsCustomView,
  },

  // AI integration for natural language data extraction
  aiIntegration: {
    getSchema: (): PluginAISchema => {
      return {
        pluginId: 'travel',
        description: 'Tracks travel plans, trips, and itineraries with destinations, dates, and notes',
        fields: [
          {
            key: 'travelPlans',
            type: 'array',
            label: 'Travel Plans',
            aiHint: 'Travel plans or trips mentioned by the user. Look for mentions of travel, trips, vacations, flights, destinations, etc.',
            itemSchema: {
              fields: [
                {
                  key: 'title',
                  type: 'string',
                  label: 'Trip Title',
                  aiHint: 'A name or title for the trip (e.g., "Summer Vacation", "Business Trip")',
                },
                {
                  key: 'destination',
                  type: 'string',
                  label: 'Destination',
                  aiHint: 'The destination city, country, or place',
                },
                {
                  key: 'startDate',
                  type: 'date',
                  label: 'Start Date',
                  aiHint: 'When the trip starts (YYYY-MM-DD format). Use the context date if user says "today" or "tomorrow"',
                },
                {
                  key: 'endDate',
                  type: 'date',
                  label: 'End Date',
                  aiHint: 'When the trip ends (YYYY-MM-DD format). If not mentioned, assume same as start date for single-day trips',
                },
                {
                  key: 'note',
                  type: 'string',
                  label: 'Notes',
                  aiHint: 'Any additional notes about the trip',
                },
              ],
            },
          },
        ],
        examples: [
          {
            input: 'Flying to Paris tomorrow for a week-long vacation! So excited.',
            output: {
              travelPlans: [{
                title: 'Paris Vacation',
                destination: 'Paris',
                note: 'So excited!',
              }],
            },
          },
          {
            input: 'Had a great day trip to the mountains today.',
            output: {
              travelPlans: [{
                title: 'Mountain Day Trip',
                destination: 'Mountains',
              }],
            },
          },
        ],
      }
    },

    parseAIData: (
      extracted: Record<string, unknown>,
      existingData: TravelDayData | null,
    ): Partial<TravelDayData> => {
      const result: Partial<TravelDayData> = {}

      // Parse travel plans
      if (Array.isArray(extracted.travelPlans) && extracted.travelPlans.length > 0) {
        const newPlans: TravelPlan[] = extracted.travelPlans
          .filter((item): item is Record<string, unknown> =>
            typeof item === 'object' && item !== null
          )
          .map((item, index) => {
            // Generate a unique ID for new plans
            const id = `ai-${Date.now()}-${index}`
            
            return {
              id,
              title: String(item.title || item.destination || 'Trip'),
              destination: item.destination ? String(item.destination) : undefined,
              startDate: item.startDate ? String(item.startDate) : new Date().toISOString().split('T')[0],
              endDate: item.endDate ? String(item.endDate) : (item.startDate ? String(item.startDate) : new Date().toISOString().split('T')[0]),
              note: item.note ? String(item.note) : undefined,
            }
          })
          .filter(plan => plan.title.trim() !== '' || (plan.destination && plan.destination.trim() !== ''))

        // Merge with existing plans (avoid duplicates by checking title/destination)
        const existingPlans = existingData?.travelPlans || []
        const mergedPlans = [...existingPlans]

        for (const newPlan of newPlans) {
          const isDuplicate = existingPlans.some(
            existing =>
              (existing.title === newPlan.title && existing.destination === newPlan.destination) ||
              (existing.startDate === newPlan.startDate && existing.endDate === newPlan.endDate && existing.destination === newPlan.destination)
          )
          if (!isDuplicate) {
            mergedPlans.push(newPlan)
          }
        }

        result.travelPlans = mergedPlans
      } else if (existingData?.travelPlans) {
        // Preserve existing travel plans if no new ones extracted
        result.travelPlans = existingData.travelPlans
      }

      return result
    },

    renderWizard: (props: AIWizardFlowProps<TravelDayData, unknown>) => {
      return React.createElement(TravelWizardFlow, props)
    },
  },
}

export default TravelPlugin
