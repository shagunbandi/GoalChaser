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
