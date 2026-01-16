// Travel Plugin Types
import type { PluginDayData, ActivityItem } from '@/sdk'

export interface TravelPlan extends ActivityItem {
  title: string
  startDate: string
  endDate: string
  note?: string
  color?: string
  destination?: string
}

export interface TravelPlanInput {
  title: string
  startDate: string
  endDate: string
  note?: string
  color?: string
  destination?: string
}

export interface TravelDayData extends PluginDayData {
  travelPlans?: TravelPlan[]
}
