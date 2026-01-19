'use client'

import type { PluginPageProps } from '@/sdk'
import { usePluginPage, LoadingState, NotFoundState, ContentLoader } from '@/sdk'
import { TravelHeader, YearView, TravelMonthView } from '../components'
import { enumerateDateRange } from '@/utils'
import type { TravelPlan, TravelPlanInput, TravelDayData } from '../types'
import { TravelPlugin } from '../plugin'

export default function TravelPage({ params, year, month }: PluginPageProps) {
  const {
    goal,
    goalId,
    isLoading,
    todayISO,
    pluginDayData,
    initialSelectedDay,
    updateDayData,
    navigateToPrevYear,
    navigateToNextYear,
    navigateToYear,
    navigateToMonth,
    jumpToMonth,
    hasData,
    year: currentYear,
  } = usePluginPage<TravelDayData>({
    pluginId: 'travel',
    params,
    year,
  })

  const handleAddTravel = async (travel: TravelPlanInput) => {
    const dates = enumerateDateRange(
      travel.startDate as string,
      travel.endDate as string,
    )

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

    for (const date of dates) {
      const existing = (pluginDayData[date]?.travelPlans as TravelPlan[]) || []
      await updateDayData(date, {
        travelPlans: [...existing, travelWithId],
      })
    }
  }

  const handleUpdateTravel = async (updatedTravel: TravelPlan) => {
    // Find the old travel to get its date range
    let oldTravel: TravelPlan | null = null
    for (const data of Object.values(pluginDayData)) {
      const found = data?.travelPlans?.find((p) => p.id === updatedTravel.id)
      if (found) {
        oldTravel = found
        break
      }
    }

    if (!oldTravel) return

    // Remove from old dates
    const oldDates = enumerateDateRange(oldTravel.startDate, oldTravel.endDate)
    for (const date of oldDates) {
      const existing = (pluginDayData[date]?.travelPlans as TravelPlan[]) || []
      await updateDayData(date, {
        travelPlans: existing.filter((p) => p.id !== updatedTravel.id),
      })
    }

    // Add to new dates
    const newDates = enumerateDateRange(
      updatedTravel.startDate,
      updatedTravel.endDate,
    )
    for (const date of newDates) {
      const existing = (pluginDayData[date]?.travelPlans as TravelPlan[]) || []
      // Filter out any existing with same ID (in case dates overlap)
      const filtered = existing.filter((p) => p.id !== updatedTravel.id)
      await updateDayData(date, {
        travelPlans: [...filtered, updatedTravel],
      })
    }
  }

  const handleDeleteTravel = async (travelId: string) => {
    // Find the travel to get its date range
    let travel: TravelPlan | null = null
    for (const data of Object.values(pluginDayData)) {
      const found = data?.travelPlans?.find((p) => p.id === travelId)
      if (found) {
        travel = found
        break
      }
    }

    if (!travel) return

    // Remove from all dates in the range
    const dates = enumerateDateRange(travel.startDate, travel.endDate)
    for (const date of dates) {
      const existing = (pluginDayData[date]?.travelPlans as TravelPlan[]) || []
      await updateDayData(date, {
        travelPlans: existing.filter((p) => p.id !== travelId),
      })
    }
  }

  // Only show full-page loading on TRUE initial load (no goal AND no cached data)
  if (!goal && isLoading && !hasData) return <LoadingState />
  if (!goal && !isLoading) return <NotFoundState />

  return (
    <div className="space-y-6">
      {/* Header - ALWAYS rendered, never unmounted */}
      <TravelHeader
        year={currentYear}
        dayData={pluginDayData}
        onPrevYear={navigateToPrevYear}
        onNextYear={navigateToNextYear}
        onAddTravel={handleAddTravel}
        onUpdateTravel={handleUpdateTravel}
        onDeleteTravel={handleDeleteTravel}
      />

      {/* Content - shows inline loader when switching years */}
      {isLoading && !hasData ? (
        <ContentLoader color="#007AFF" />
      ) : month ? (
        <TravelMonthView
          plugin={TravelPlugin}
          month={month}
          year={currentYear}
          goalId={goalId}
          todayISO={todayISO}
          dayData={pluginDayData}
          initialSelectedDate={initialSelectedDay}
          onUpdateDay={updateDayData}
          onBackToYear={() => navigateToYear(currentYear)}
          onEditTravel={handleUpdateTravel}
          onDeleteTravel={handleDeleteTravel}
          onAddTravel={handleAddTravel}
        />
      ) : (
        <YearView
          year={currentYear}
          todayISO={todayISO}
          dayDetails={pluginDayData}
          onPrevYear={navigateToPrevYear}
          onNextYear={navigateToNextYear}
          onAddTravel={handleAddTravel}
          onUpdateDay={updateDayData}
          onJumpToDay={jumpToMonth}
          onMonthClick={navigateToMonth}
          initialSelectedDay={initialSelectedDay}
        />
      )}
    </div>
  )
}
