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

  if (isLoading) return <LoadingState />
  if (!goal) return <NotFoundState />

  return (
    <div className="space-y-6">
      {/* Shared Header Component */}
      <TravelHeader
        year={currentYear}
        dayData={pluginDayData}
        onPrevYear={navigateToPrevYear}
        onNextYear={navigateToNextYear}
      />

      {/* Conditionally render Month or Year view */}
      {month ? (
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

