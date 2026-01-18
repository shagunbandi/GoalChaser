/**
 * Period Plugin Page
 */

'use client'

import type { PluginPageProps } from '@/sdk'
import { usePluginPage, LoadingState, NotFoundState } from '@/sdk'
import {
  PeriodHeader,
  PeriodYearView,
  PeriodMonthView,
} from '../components'
import type { PeriodDayData, PeriodConfig } from '../types'
import { PeriodPlugin } from '../plugin'

export default function PeriodPage({
  params,
  year,
  month,
}: PluginPageProps) {
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
  } = usePluginPage<PeriodDayData, PeriodConfig>({
    pluginId: 'period',
    params,
    year,
  })

  const handleJumpToDay = (iso: string) => {
    const [y, m] = iso.split('-').map(Number)
    navigateToMonth(y, m, iso)
  }

  // Check if we have any data yet
  const hasData = Object.keys(pluginDayData).length > 0

  // Only show full-page loading on TRUE initial load
  if (!goal && isLoading && !hasData) return <LoadingState />
  if (!goal && !isLoading) return <NotFoundState />

  // Content loading indicator
  const ContentLoader = () => (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <PeriodHeader
        year={currentYear}
        dayData={pluginDayData}
        onPrevYear={navigateToPrevYear}
        onNextYear={navigateToNextYear}
      />

      {/* Content */}
      {isLoading && !hasData ? (
        <ContentLoader />
      ) : month ? (
        <PeriodMonthView
          plugin={PeriodPlugin}
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
        <PeriodYearView
          year={currentYear}
          todayISO={todayISO}
          dayData={pluginDayData}
          initialSelectedDay={initialSelectedDay}
          onPrevYear={navigateToPrevYear}
          onNextYear={navigateToNextYear}
          onJumpToDay={handleJumpToDay}
          onMonthClick={navigateToMonth}
        />
      )}
    </div>
  )
}
