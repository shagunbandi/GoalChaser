'use client'

import type { PluginPageProps } from '@/sdk'
import { YearView } from '../components'
import { useGoalData } from '@/hooks/useGoalData'
import { useRouter, useSearchParams } from 'next/navigation'
import { enumerateDateRange } from '@/utils'
import type { TravelPlan, TravelPlanInput } from '../types'

export default function TravelPage({
  params,
  year = new Date().getFullYear(),
}: PluginPageProps) {
  const goalId = params.id
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialSelectedDay = searchParams.get('date')

  const { goal, isLoading, todayISO, pluginData, handleUpdateData } =
    useGoalData(goalId, year)

  // Extract travel-specific data (day-based storage)
  const travelData = pluginData?.['travel'] || {}

  // Wrapper functions for travel-specific updates
  const handleUpdateDetails = async (
    iso: string,
    updates: Record<string, unknown>,
  ) => {
    await handleUpdateData('travel', iso, updates)
  }

  const handleAddTravel = async (travel: TravelPlanInput) => {
    // Generate the date range from startDate to endDate
    const dates = enumerateDateRange(
      travel.startDate as string,
      travel.endDate as string,
    )

    // Generate a unique ID for this travel plan
    // Filter out undefined and empty values - Firestore doesn't accept undefined
    const trimmedNote = travel.note?.trim()
    const trimmedDestination = travel.destination?.trim()
    
    const travelWithId: TravelPlan = {
      id: `travel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: travel.title,
      startDate: travel.startDate,
      endDate: travel.endDate,
      ...(trimmedNote && { note: trimmedNote }),
      ...(travel.color && { color: travel.color }),
      ...(trimmedDestination && { destination: trimmedDestination }),
    }

    // Add the travel plan to each date in the range
    for (const date of dates) {
      const existing = (travelData[date]?.travelPlans as TravelPlan[]) || []
      await handleUpdateData('travel', date, {
        travelPlans: [...existing, travelWithId],
      })
    }
  }

  const handleJumpToDay = (iso: string) => {
    // Update URL with selected date
    const url = new URL(window.location.href)
    url.searchParams.set('date', iso)
    window.history.replaceState({}, '', url.toString())
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white/60">Loading...</div>
      </div>
    )
  }

  if (!goal) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white/60">Goal not found</div>
      </div>
    )
  }

  return (
    <main className="container mx-auto px-4 py-6 space-y-4">
      <YearView
        year={year}
        todayISO={todayISO}
        dayDetails={travelData}
        onPrevYear={() => router.push(`/goal/${goalId}/travel/${year - 1}`)}
        onNextYear={() => router.push(`/goal/${goalId}/travel/${year + 1}`)}
        onAddTravel={handleAddTravel}
        onUpdateDay={handleUpdateDetails}
        onJumpToDay={handleJumpToDay}
        initialSelectedDay={initialSelectedDay}
      />
    </main>
  )
}
