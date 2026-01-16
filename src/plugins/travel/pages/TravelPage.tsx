'use client'

import type { PluginPageProps } from '@/sdk'
import { usePluginPage, LoadingState, NotFoundState } from '@/sdk'
import { YearView, TravelMonthView } from '../components'
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
    jumpToDay,
    router,
    year: currentYear,
  } = usePluginPage<TravelDayData>({
    pluginId: 'travel',
    params,
    year,
  })
  
  // Handler to navigate to month view with selected day
  const handleJumpToDay = (iso: string) => {
    const [y, m] = iso.split('-').map(Number)
    navigateToMonth(y, m, iso)
  }

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

  // If month is specified, show month view
  if (month) {
    // Calculate month-specific stats
    const monthData = Object.entries(pluginDayData).filter(([date]) => {
      const [y, m] = date.split('-').map(Number)
      return y === currentYear && m === month
    })
    const travelDays = monthData.filter(([, data]) => data?.travelPlans && data.travelPlans.length > 0).length

    const monthHeaderConfig = {
      icon: '✈️',
      title: `Travel Month:`,
      stats: [
        { label: 'Travel days', value: travelDays },
      ],
      legends: [],
      actions: [],
    }

    return (
      <main className="container mx-auto px-4 py-6 space-y-4">
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
          headerConfig={monthHeaderConfig}
          onPrevYear={navigateToPrevYear}
          onNextYear={navigateToNextYear}
        />
      </main>
    )
  }

  // Otherwise show year view
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
        onJumpToDay={handleJumpToDay}
        onMonthClick={navigateToMonth}
        initialSelectedDay={initialSelectedDay}
      />
    </main>
  )
}
