/**
 * Period Plugin Page
 */

'use client'

import type { PluginPageProps } from '@/sdk'
import { usePluginPage, LoadingState, NotFoundState, ContentLoader } from '@/sdk'
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
    jumpToMonth,
    hasData,
    year: currentYear,
  } = usePluginPage<PeriodDayData, PeriodConfig>({
    pluginId: 'period',
    params,
    year,
  })

  // Only show full-page loading on TRUE initial load
  if (!goal && isLoading && !hasData) return <LoadingState />
  if (!goal && !isLoading) return <NotFoundState />

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
        <ContentLoader color="#F472B6" />
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
          onJumpToDay={jumpToMonth}
          onMonthClick={navigateToMonth}
        />
      )}
    </div>
  )
}
