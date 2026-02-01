'use client'

import { useMemo } from 'react'
import type { PluginPageProps } from '@/sdk'
import { usePluginPage, LoadingState, NotFoundState, ContentLoader } from '@/sdk'
import { useAuth } from '@/hooks/useAuth'
import { TravelHeader, YearView, TravelMonthView } from '../components'
import { enumerateDateRange } from '@/utils'
import type { TravelPlan, TravelPlanInput, TravelDayData, TravelConfig } from '../types'
import { TravelPlugin } from '../plugin'

export default function TravelPage({ params, year, month }: PluginPageProps) {
  const { user } = useAuth()
  const userId = user?.uid
  const {
    goal,
    goalId,
    isLoading,
    todayISO,
    pluginDayData,
    pluginConfig,
    initialSelectedDay,
    updateDayData,
    updateDayDataBatch,
    updateConfig,
    navigateToPrevYear,
    navigateToNextYear,
    navigateToYear,
    navigateToMonth,
    jumpToMonth,
    hasData,
    year: currentYear,
  } = usePluginPage<TravelDayData, TravelConfig>({
    pluginId: 'travel',
    params,
    year,
  })

  // Extract all unique travels for parent selection
  const allTravels = useMemo(() => {
    const planMap = new Map<string, TravelPlan>()
    Object.values(pluginDayData).forEach((data) => {
      data?.travelPlans?.forEach((plan) => {
        if (!planMap.has(plan.id)) {
          planMap.set(plan.id, plan)
        }
      })
    })
    return Array.from(planMap.values())
  }, [pluginDayData])

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
      ...(travel.parentTravelId && { parentTravelId: travel.parentTravelId }),
      ...(travel.placeId && { placeId: travel.placeId }),
      ...(travel.placeCoordinates && { placeCoordinates: travel.placeCoordinates }),
      ...(travel.placeAddress && { placeAddress: travel.placeAddress }),
    }

    const batch = dates.map((date) => {
      const existing = (pluginDayData[date]?.travelPlans as TravelPlan[]) || []
      return {
        date,
        updates: { travelPlans: [...existing, travelWithId] } as Partial<TravelDayData>,
      }
    })
    await updateDayDataBatch(batch)
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

    const oldDates = enumerateDateRange(oldTravel.startDate, oldTravel.endDate)
    const newDates = enumerateDateRange(
      updatedTravel.startDate,
      updatedTravel.endDate,
    )
    const allDates = Array.from(
      new Set([...oldDates, ...newDates]),
    )

    const batch = allDates.map((date) => {
      const existing = (pluginDayData[date]?.travelPlans as TravelPlan[]) || []
      const filtered = existing.filter((p) => p.id !== updatedTravel.id)
      const isInNewRange = newDates.includes(date)
      const travelPlans = isInNewRange ? [...filtered, updatedTravel] : filtered
      return {
        date,
        updates: { travelPlans } as Partial<TravelDayData>,
      }
    })
    await updateDayDataBatch(batch)
  }

  const handleDeleteTravel = async (travelId: string) => {
    let travel: TravelPlan | null = null
    for (const data of Object.values(pluginDayData)) {
      const found = data?.travelPlans?.find((p) => p.id === travelId)
      if (found) {
        travel = found
        break
      }
    }

    if (!travel) return

    const dates = enumerateDateRange(travel.startDate, travel.endDate)
    const batch = dates.map((date) => {
      const existing = (pluginDayData[date]?.travelPlans as TravelPlan[]) || []
      return {
        date,
        updates: {
          travelPlans: existing.filter((p) => p.id !== travelId),
        } as Partial<TravelDayData>,
      }
    })
    await updateDayDataBatch(batch)
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
        allTravels={allTravels}
        userId={userId}
        goalId={goalId}
        pluginConfig={pluginConfig}
        onUpdateConfig={updateConfig}
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
          allTravels={allTravels}
          userId={userId}
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
          onUpdateDaysBatch={updateDayDataBatch}
          onJumpToDay={jumpToMonth}
          onMonthClick={navigateToMonth}
          initialSelectedDay={initialSelectedDay}
          allTravels={allTravels}
        />
      )}
    </div>
  )
}
