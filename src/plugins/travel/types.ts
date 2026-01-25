// Travel Plugin Types
import type { PluginDayData, ActivityItem } from '@/sdk'

export interface TravelPlan extends ActivityItem {
  title: string
  startDate: string
  endDate: string
  note?: string
  color?: string
  destination?: string
  parentTravelId?: string
  // Google Places data
  placeId?: string
  placeCoordinates?: {
    lat: number
    lng: number
  }
  placeAddress?: string
  // File attachments
  files?: TravelFile[]
}

export interface TravelFile {
  id: string
  name: string
  size: number
  type: string
  url: string
  uploadedAt: string
  storagePath: string
}

export interface TravelPlanInput {
  title: string
  startDate: string
  endDate: string
  note?: string
  color?: string
  destination?: string
  parentTravelId?: string
  // Google Places data
  placeId?: string
  placeCoordinates?: {
    lat: number
    lng: number
  }
  placeAddress?: string
}

export interface TravelDayData extends PluginDayData {
  travelPlans?: TravelPlan[]
  notes?: string
}
