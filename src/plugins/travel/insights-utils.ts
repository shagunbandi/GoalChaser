/**
 * Travel Insights Utilities
 * 
 * Helper functions for calculating travel insights
 */

import type { TravelDayData, TravelPlan } from './types'
import type { BreakdownItem } from '@/sdk'

// ============================================================================
// Trip Calculation Functions
// ============================================================================

/**
 * Get all unique trips from data (excluding sub-trips)
 */
export function getAllTrips(allData: Record<string, TravelDayData>): TravelPlan[] {
  const tripMap = new Map<string, TravelPlan>()
  
  Object.values(allData).forEach(dayData => {
    if (dayData?.travelPlans) {
      dayData.travelPlans.forEach(trip => {
        // Skip sub-trips (they have a parentTravelId)
        if (trip.parentTravelId) {
          return
        }
        
        // Use a combination of title, startDate, and destination as unique key
        const key = `${trip.title}-${trip.startDate}-${trip.destination || ''}`
        if (!tripMap.has(key)) {
          tripMap.set(key, trip)
        }
      })
    }
  })
  
  return Array.from(tripMap.values())
}

/**
 * Count total unique trips
 */
export function countTotalTrips(allData: Record<string, TravelDayData>): number {
  return getAllTrips(allData).length
}

/**
 * Count unique destinations (places)
 */
export function countUniquePlaces(allData: Record<string, TravelDayData>): number {
  const placeSet = new Set<string>()
  
  Object.values(allData).forEach(dayData => {
    if (dayData?.travelPlans) {
      dayData.travelPlans.forEach(trip => {
        if (trip.placeId) {
          placeSet.add(trip.placeId)
        } else if (trip.destination) {
          placeSet.add(trip.destination)
        }
      })
    }
  })
  
  return placeSet.size
}

/**
 * Calculate total days traveled
 */
export function calculateTotalDaysTraveled(allData: Record<string, TravelDayData>): number {
  const trips = getAllTrips(allData)
  
  return trips.reduce((total, trip) => {
    const start = new Date(trip.startDate)
    const end = new Date(trip.endDate)
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
    return total + days
  }, 0)
}

/**
 * Get top 3 most visited destinations (excluding sub-trips, deduplicated by trip ID)
 */
export function getTopVisitedDestinations(
  allData: Record<string, TravelDayData>
): Array<{ name: string; visits: number; days: number; rank: number }> {
  const destinationMap = new Map<string, { visits: Set<string>; days: number }>()
  
  // First pass: collect unique trip IDs per destination
  Object.values(allData).forEach(dayData => {
    if (dayData?.travelPlans) {
      dayData.travelPlans.forEach(trip => {
        // Skip sub-trips (they have a parentTravelId)
        if (trip.parentTravelId) {
          return
        }
        
        const dest = trip.destination || trip.title
        
        if (!destinationMap.has(dest)) {
          destinationMap.set(dest, { visits: new Set(), days: 0 })
        }
        
        const stat = destinationMap.get(dest)!
        // Add trip ID to Set (automatically deduplicates)
        stat.visits.add(trip.id)
      })
    }
  })
  
  if (destinationMap.size === 0) return []
  
  // Second pass: calculate total days per destination
  const processedTrips = new Set<string>()
  Object.values(allData).forEach(dayData => {
    if (dayData?.travelPlans) {
      dayData.travelPlans.forEach(trip => {
        // Skip sub-trips and already processed trips
        if (trip.parentTravelId || processedTrips.has(trip.id)) {
          return
        }
        
        processedTrips.add(trip.id)
        const dest = trip.destination || trip.title
        const stat = destinationMap.get(dest)
        
        if (stat) {
          // Calculate trip duration in days
          const start = new Date(trip.startDate)
          const end = new Date(trip.endDate)
          const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
          stat.days += days
        }
      })
    }
  })
  
  // Convert to array and sort by visits (descending), then by days (descending)
  const sorted = Array.from(destinationMap.entries())
    .map(([name, stat]) => ({
      name,
      visits: stat.visits.size,
      days: stat.days,
    }))
    .sort((a, b) => {
      // Sort by visits first, then by days
      if (b.visits !== a.visits) return b.visits - a.visits
      return b.days - a.days
    })
  
  // Return top 3 with rank
  return sorted.slice(0, 3).map((dest, index) => ({
    ...dest,
    rank: index + 1,
  }))
}

/**
 * Get most visited destination (legacy - kept for compatibility)
 */
export function getMostVisitedDestination(
  allData: Record<string, TravelDayData>
): { name: string; visits: number; days: number } | null {
  const top = getTopVisitedDestinations(allData)
  return top.length > 0 ? top[0] : null
}

// ============================================================================
// Period Analysis Functions
// ============================================================================

/**
 * Count trips in a specific period
 */
export function countTripsInPeriod(data: Record<string, TravelDayData>): number {
  return getAllTrips(data).length
}

/**
 * Calculate days traveled in period
 */
export function calculateDaysTraveledInPeriod(data: Record<string, TravelDayData>): number {
  const dateSet = new Set<string>()
  
  Object.keys(data).forEach(date => {
    if (data[date]?.travelPlans && data[date].travelPlans!.length > 0) {
      dateSet.add(date)
    }
  })
  
  return dateSet.size
}

/**
 * Calculate average trip duration
 */
export function calculateAverageTripDuration(data: Record<string, TravelDayData>): number {
  const trips = getAllTrips(data)
  
  if (trips.length === 0) return 0
  
  const totalDays = trips.reduce((total, trip) => {
    const start = new Date(trip.startDate)
    const end = new Date(trip.endDate)
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
    return total + days
  }, 0)
  
  return Math.round(totalDays / trips.length)
}

/**
 * Build destination breakdown including sub-trips (deduplicated by trip ID)
 */
export function buildDestinationBreakdown(
  data: Record<string, TravelDayData>
): BreakdownItem[] {
  // Build a map of all trips (both parent and sub-trips)
  const tripMap = new Map<string, TravelPlan>()
  
  Object.values(data).forEach(dayData => {
    if (dayData?.travelPlans) {
      dayData.travelPlans.forEach(trip => {
        if (!tripMap.has(trip.id)) {
          tripMap.set(trip.id, trip)
        }
      })
    }
  })
  
  if (tripMap.size === 0) return []
  
  // Build parent-child relationships
  const parentMap = new Map<string, TravelPlan[]>() // parentId -> children
  const parentTrips: TravelPlan[] = []
  
  tripMap.forEach(trip => {
    if (!trip.parentTravelId) {
      parentTrips.push(trip)
    } else {
      if (!parentMap.has(trip.parentTravelId)) {
        parentMap.set(trip.parentTravelId, [])
      }
      parentMap.get(trip.parentTravelId)!.push(trip)
    }
  })
  
  // Helper to calculate trip days
  const getTripDays = (trip: TravelPlan): number => {
    const start = new Date(trip.startDate)
    const end = new Date(trip.endDate)
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
  }
  
  // Build breakdown items with parent and sub-trip structure
  const items: BreakdownItem[] = []
  
  // Count parent trips per destination
  const destMap = new Map<string, { trips: TravelPlan[]; days: number }>()
  
  parentTrips.forEach(trip => {
    const dest = trip.destination || trip.title
    if (!destMap.has(dest)) {
      destMap.set(dest, { trips: [], days: 0 })
    }
    const stat = destMap.get(dest)!
    stat.trips.push(trip)
    stat.days += getTripDays(trip)
  })
  
  // Sort destinations by trip count
  const sortedDests = Array.from(destMap.entries()).sort((a, b) => b[1].trips.length - a[1].trips.length)
  
  // Calculate max count for percentage
  const maxCount = Math.max(...sortedDests.map(([_, stat]) => stat.trips.length))
  
  // Build items with sub-trips
  sortedDests.forEach(([dest, stat]) => {
    const count = stat.trips.length
    
    // Add parent destination item
    items.push({
      label: dest,
      value: `${count} trip${count !== 1 ? 's' : ''}`,
      count,
      details: `${stat.days} day${stat.days !== 1 ? 's' : ''}`,
      percentage: maxCount > 0 ? (count / maxCount) * 100 : 0,
      color: '#3B82F6',
    })
    
    // Add sub-trips for this destination
    stat.trips.forEach(parentTrip => {
      const subTrips = parentMap.get(parentTrip.id) || []
      subTrips.forEach(subTrip => {
        const subDest = subTrip.destination || subTrip.title
        const subDays = getTripDays(subTrip)
        
        items.push({
          label: subDest,
          value: '1 trip',
          count: 1,
          details: `${subDays} day${subDays !== 1 ? 's' : ''}`,
          percentage: maxCount > 0 ? (1 / maxCount) * 100 : 0,
          color: '#60A5FA', // Lighter blue for sub-trips
          isSubItem: true, // Mark as sub-item for indentation
        })
      })
    })
  })
  
  return items
}

/**
 * Calculate trips per month average
 */
export function calculateTripsPerMonth(allData: Record<string, TravelDayData>): number {
  const trips = getAllTrips(allData)
  
  if (trips.length === 0) return 0
  
  // Get unique months with trips
  const monthSet = new Set<string>()
  
  trips.forEach(trip => {
    const date = new Date(trip.startDate)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    monthSet.add(monthKey)
  })
  
  return monthSet.size > 0 ? trips.length / monthSet.size : 0
}

/**
 * Count trips with attachments
 */
export function countTripsWithAttachments(allData: Record<string, TravelDayData>): number {
  const trips = getAllTrips(allData)
  
  return trips.filter(trip => trip.files && trip.files.length > 0).length
}

/**
 * Marker shape for SDK InsightsMap (data-driven)
 */
export interface TravelMapMarker {
  lat: number
  lng: number
  label: string
  id: string
}

/**
 * Get markers for the insights map. If travelId is set, returns only that parent trip
 * and its sub-trips (with placeCoordinates). Otherwise returns all plans with coordinates.
 */
export function getTravelMapMarkers(
  pluginData: Record<string, TravelDayData>,
  options: { travelId?: string } = {}
): TravelMapMarker[] {
  const tripMap = new Map<string, TravelPlan>()
  const parentMap = new Map<string, TravelPlan[]>()

  Object.values(pluginData).forEach((dayData) => {
    if (dayData?.travelPlans) {
      dayData.travelPlans.forEach((trip) => {
        if (!tripMap.has(trip.id)) {
          tripMap.set(trip.id, trip)
        }
        if (trip.parentTravelId) {
          if (!parentMap.has(trip.parentTravelId)) {
            parentMap.set(trip.parentTravelId, [])
          }
          parentMap.get(trip.parentTravelId)!.push(trip)
        }
      })
    }
  })

  let plansToConsider: TravelPlan[]
  if (options.travelId) {
    const parent = tripMap.get(options.travelId)
    if (!parent) return []
    const subTrips = parentMap.get(options.travelId) || []
    // Dedupe by id (same plan can appear on multiple days)
    const byId = new Map<string, TravelPlan>()
    byId.set(parent.id, parent)
    subTrips.forEach((t) => byId.set(t.id, t))
    plansToConsider = Array.from(byId.values())
  } else {
    plansToConsider = Array.from(tripMap.values())
  }

  const markers: TravelMapMarker[] = []
  for (const plan of plansToConsider) {
    if (!plan.placeCoordinates) continue
    markers.push({
      lat: plan.placeCoordinates.lat,
      lng: plan.placeCoordinates.lng,
      label: plan.destination || plan.title || 'Trip',
      id: plan.id,
    })
  }
  return markers
}

/**
 * Polyline shape for SDK InsightsMap (sequence of points)
 */
export type TravelMapPolyline = Array<{ lat: number; lng: number }>

/** Base location (e.g. home) or parent trip location for inserting between travels when there's a gap */
export interface TravelMapBaseLocation {
  placeCoordinates?: { lat: number; lng: number }
}

/** Days between endDate and startDate (e.g. end 12th, start 13th => 1). Insert base only when > 1 (2+ days between). */
function gapDaysBetween(endDate: string, startDate: string): number {
  const end = new Date(endDate).getTime()
  const start = new Date(startDate).getTime()
  return (start - end) / (24 * 60 * 60 * 1000)
}

/** Get the trip (parent) id for a plan: parent plan = self, sub-trip = parentTravelId */
function getTripId(plan: TravelPlan): string {
  return plan.parentTravelId ?? plan.id
}

/**
 * Get polylines for the insights map. Line goes: base → locations in date order
 * (inserting "base between gaps" when 2+ days gap) → base.
 *
 * - includeBaseLocation: if true, start/end at global base and insert base between different trips; if false, just trip locations (sub-trips always shown).
 * - Within a trip: always insert main trip location between sub-trips when 2+ days gap (regardless of includeBaseLocation).
 *
 * Example (includeBaseLocation true, base=Amsterdam, main=Indore):
 *   Amsterdam → Indore → Nagpur → Jagdalpur → Indore → Bangalore → Amsterdam
 * Example (includeBaseLocation false): Indore → Nagpur → Jagdalpur → Indore → Bangalore
 */
export function getTravelMapPolylines(
  pluginData: Record<string, TravelDayData>,
  options: {
    travelId?: string
    baseLocation?: TravelMapBaseLocation
    /** If false, no start/end at base and no base between different trips; sub-trips and main-location-between-gaps still apply. */
    includeBaseLocation?: boolean
  } = {},
): TravelMapPolyline[] {
  const tripMap = new Map<string, TravelPlan>()
  const parentMap = new Map<string, TravelPlan[]>()

  Object.values(pluginData).forEach((dayData) => {
    if (dayData?.travelPlans) {
      dayData.travelPlans.forEach((trip) => {
        if (!tripMap.has(trip.id)) {
          tripMap.set(trip.id, trip)
        }
        if (trip.parentTravelId) {
          if (!parentMap.has(trip.parentTravelId)) {
            parentMap.set(trip.parentTravelId, [])
          }
          parentMap.get(trip.parentTravelId)!.push(trip)
        }
      })
    }
  })

  let plansToConsider: TravelPlan[]
  let singleTripParent: TravelPlan | null = null
  if (options.travelId) {
    const parent = tripMap.get(options.travelId)
    if (!parent) return []
    const subTrips = parentMap.get(options.travelId) || []
    const byId = new Map<string, TravelPlan>()
    byId.set(parent.id, parent)
    subTrips.forEach((t) => byId.set(t.id, t))
    plansToConsider = Array.from(byId.values())
    singleTripParent = parent
  } else {
    plansToConsider = Array.from(tripMap.values())
  }

  const withCoords = plansToConsider
    .filter((p) => p.placeCoordinates)
    .sort(
      (a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
    )

  if (withCoords.length === 0) return []

  const line: TravelMapPolyline = []
  const includeBase = options.includeBaseLocation !== false
  const startEndBase = includeBase ? options.baseLocation?.placeCoordinates : undefined

  // Start at base (e.g. Amsterdam) when includeBaseLocation is on
  if (startEndBase) {
    line.push({ lat: startEndBase.lat, lng: startEndBase.lng })
  }

  for (let i = 0; i < withCoords.length; i++) {
    const plan = withCoords[i]
    const point = {
      lat: plan.placeCoordinates!.lat,
      lng: plan.placeCoordinates!.lng,
    }
    // Between consecutive locations: if 2+ days gap, insert the right "base between" (within trip = main location; between trips = global base only when includeBaseLocation)
    if (i > 0 && gapDaysBetween(withCoords[i - 1].endDate, plan.startDate) > 1) {
      let gapBaseCoords: { lat: number; lng: number } | undefined
      if (singleTripParent?.placeCoordinates) {
        // One trip: always insert main trip location (e.g. Indore) — sub-trips always shown with main between gaps
        gapBaseCoords = singleTripParent.placeCoordinates
      } else {
        // All travels: same trip → insert that trip's main location; different trip → global base only if includeBaseLocation
        const prevPlan = withCoords[i - 1]
        const prevTripId = getTripId(prevPlan)
        const currTripId = getTripId(plan)
        if (prevTripId === currTripId) {
          const tripParent = tripMap.get(prevTripId)
          gapBaseCoords = tripParent?.placeCoordinates
        } else if (includeBase) {
          gapBaseCoords = options.baseLocation?.placeCoordinates
        }
      }
      if (gapBaseCoords) {
        line.push({ lat: gapBaseCoords.lat, lng: gapBaseCoords.lng })
      }
    }
    line.push(point)
  }

  // End at base (e.g. Amsterdam) when includeBaseLocation is on
  if (startEndBase) {
    line.push({ lat: startEndBase.lat, lng: startEndBase.lng })
  }

  return [line]
}
