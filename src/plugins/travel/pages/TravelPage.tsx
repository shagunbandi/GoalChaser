'use client'

import type { PluginPageProps } from '@/sdk'
import { usePluginPage, LoadingState, NotFoundState } from '@/sdk'
import { YearView } from '../components'
import { enumerateDateRange } from '@/utils'
import type { TravelPlan, TravelPlanInput, TravelDayData } from '../types'

export default function TravelPage({ params, year }: PluginPageProps) {
  const {
    goal,
    isLoading,
    todayISO,
    pluginDayData,
    initialSelectedDay,
    updateDayData,
    navigateToPrevYear,
    navigateToNextYear,
    jumpToDay,
    year: currentYear,
  } = usePluginPage<TravelDayData>({
    pluginId: 'travel',
    params,
    year,
  })

  const handleAddTravel = async (travel: TravelPlanInput) => {
    // Generate the date range from startDate to endDate
    const dates = enumerateDateRange(
      travel.startDate as string,
      travel.endDate as string,
    )

    // Generate a unique ID for this travel plan
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
      const existing = (pluginDayData[date]?.travelPlans as TravelPlan[]) || []
      await updateDayData(date, {
        travelPlans: [...existing, travelWithId],
      })
    }
  }

  if (isLoading) return <LoadingState />
  if (!goal) return <NotFoundState />

  return (
    <main className="container mx-auto px-4 py-6 space-y-4">
      <YearView
        year={currentYear}
        todayISO={todayISO}
        dayDetails={pluginDayData}
        onPrevYear={navigateToPrevYear}
        onNextYear={navigateToNextYear}
        onAddTravel={handleAddTravel}
        onUpdateDay={updateDayData}
        onJumpToDay={jumpToDay}
        initialSelectedDay={initialSelectedDay}
      />
    </main>
  )
}
