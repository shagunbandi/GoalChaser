'use client'

import type { PluginPageProps } from '@/sdk'
import { usePluginPage, LoadingState, NotFoundState } from '@/sdk'
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
    year: currentYear,
  } = usePluginPage<TravelDayData>({
    pluginId: 'travel',
    params,
    year,
  })

  const handleJumpToDay = (iso: string) => {
    const [y, m] = iso.split('-').map(Number)
    navigateToMonth(y, m, iso)
  }

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
    const newDates = enumerateDateRange(updatedTravel.startDate, updatedTravel.endDate)
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

  // Check if we have any data yet (for initial load vs navigation)
  const hasData = Object.keys(pluginDayData).length > 0

  // Only show full-page loading on TRUE initial load (no goal AND no cached data)
  // This prevents the header from disappearing during navigation
  if (!goal && isLoading && !hasData) return <LoadingState />
  if (!goal && !isLoading) return <NotFoundState />

  // Content loading indicator (shown inline when switching years)
  const ContentLoader = () => (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-[#007AFF] border-t-transparent rounded-full animate-spin" />
    </div>
  )

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
        <ContentLoader />
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
          onJumpToDay={handleJumpToDay}
          onMonthClick={navigateToMonth}
          initialSelectedDay={initialSelectedDay}
        />
      )}
    </div>
  )
}
