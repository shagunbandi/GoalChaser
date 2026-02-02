'use client'

import { useMemo, useCallback } from 'react'
import { useParams } from 'next/navigation'
import type { ViewType, Plugin, StatItem } from '@/sdk'
import { usePluginPage, LoadingState, NotFoundState, MonthCalendar } from '@/sdk'
import type { DayCustomization } from '@/sdk'
import { usePluginIndicators } from '@/components/features/calendar/PluginSummaryAggregator'
import { usePluginRegistry } from '@/core/plugin-registry/hooks'
// import { YearGrid } from './YearGrid'
// import { RightPanel } from './RightPanel'
// import { TopStatsBar } from './TopStatsBar'
// import { ViewNavigation } from './ViewNavigation'
import { computeMonthInfo } from '@/utils'

interface UnifiedViewProps {
  plugin: Plugin
  goalId: string
  viewType: ViewType
  year: number
  month?: number
  date?: string
}

/**
 * UnifiedView - Main container component that switches between year, month, and day views
 *
 * Layout modes:
 * 1. Year view: Full-width year grid with 12 months
 * 2. Month view: Two columns - month grid + month summary panel
 * 3. Day view: Two columns - month grid + day details panel
 *
 * This component handles all data loading and navigation internally using usePluginPage.
 */
export function UnifiedView({
  plugin,
  goalId,
  viewType,
  year,
  month,
  date,
}: UnifiedViewProps) {
  const rawParams = useParams()

  // Transform params to match expected shape
  const params = {
    id: goalId,
    plugin: (rawParams.plugin as string[]) || [],
  }

  // Get plugin registry to access all plugins for indicators
  const { registry } = usePluginRegistry()
  const allPlugins = registry.getAllPlugins()

  // Use the plugin hook to get all data and navigation helpers
  const {
    goal,
    isLoading,
    todayISO,
    pluginDayData,
    pluginConfig,
    updateDayData,
    updateConfig,
    // TODO: Add navigation helpers to usePluginPage
    // navigateToYear,
    // navigateToMonth,
    // navigateToDay,
  } = usePluginPage({
    pluginId: plugin.id,
    params,
    year,
  })

  // Temporary navigation stubs
  const navigateToYear = (year: number) =>
    console.log('Navigate to year:', year)
  const navigateToMonth = (year: number, month: number) =>
    console.log('Navigate to month:', year, month)
  const navigateToDay = (date: string) => console.log('Navigate to day:', date)

  // Compute month info if needed
  const currentMonthInfo = useMemo(() => {
    if (month) {
      return computeMonthInfo(year, month)
    }
    if (date) {
      const d = new Date(date + 'T00:00:00')
      return computeMonthInfo(d.getFullYear(), d.getMonth() + 1)
    }
    return null
  }, [year, month, date])

  // Get current month and year for Calendar component
  const currentMonth =
    month ||
    (date
      ? new Date(date + 'T00:00:00').getMonth() + 1
      : new Date().getMonth() + 1)
  const currentYear =
    year ||
    (date
      ? new Date(date + 'T00:00:00').getFullYear()
      : new Date().getFullYear())

  // Get stats from plugin based on view type
  const stats: StatItem[] = useMemo(() => {
    // TODO: Implement plugin.views interface
    // if (!plugin.views) return []
    //
    // if (viewType === 'year' && plugin.views.getYearStats) {
    //   return plugin.views.getYearStats(pluginDayData)
    // }
    //
    // if (viewType === 'month' && month && plugin.views.getMonthStats) {
    //   return plugin.views.getMonthStats(month, year, pluginDayData)
    // }
    //
    // if (viewType === 'day' && date && plugin.views.getMonthStats) {
    //   const d = new Date(date + 'T00:00:00')
    //   return plugin.views.getMonthStats(d.getMonth() + 1, d.getFullYear(), pluginDayData)
    // }

    return []
  }, [plugin, viewType, year, month, date, pluginDayData])

  // Build date range for the current month
  const dateRange = useMemo(() => {
    if (!currentMonthInfo) return []
    return currentMonthInfo.days.map((d) => d.iso)
  }, [currentMonthInfo])

  // Build pluginDataByDate structure for plugin indicators
  // This maps each date to all plugin data for that date
  const pluginDataByDate = useMemo(() => {
    const dataByDate: Record<string, Record<string, any>> = {}

    dateRange.forEach((date) => {
      // For the current plugin's data
      const dayData = pluginDayData[date]
      if (dayData) {
        dataByDate[date] = {
          [plugin.id]: dayData,
        }
      }
    })

    return dataByDate
  }, [dateRange, plugin.id, pluginDayData])

  // Use the hook to get plugin indicators from plugins' calendar integration
  // This properly queries each plugin's getDaySummary to get colors and hasData status
  const pluginIndicators = usePluginIndicators(
    allPlugins,
    dateRange,
    pluginDataByDate,
    goalId,
  )

  // Build day customizations from plugin data
  const dayCustomizations = useMemo(() => {
    const customizations: Record<string, DayCustomization> = {}

    dateRange.forEach((date) => {
      const data = pluginDayData[date]
      const indicators = pluginIndicators[date] || []
      const activeIndicators = indicators.filter((ind) => ind.hasData)

      let bgColor = 'bg-white/5'
      if (plugin.calendar?.getCalendarBackground) {
        const bg = plugin.calendar.getCalendarBackground(data ?? null)
        if (bg?.backgroundColor) bgColor = bg.backgroundColor
      }

      customizations[date] = {
        backgroundColor: bgColor,
        indicators: activeIndicators.map((ind) => ({
          id: ind.pluginId,
          label: ind.pluginName,
          color: ind.color,
        })),
      }
    })

    return customizations
  }, [plugin.id, pluginDayData, dateRange, pluginIndicators])

  // Navigation handlers for Calendar component
  const handlePrevMonth = useCallback(() => {
    const newMonth = currentMonth === 1 ? 12 : currentMonth - 1
    const newYear = currentMonth === 1 ? currentYear - 1 : currentYear
    navigateToMonth(newYear, newMonth)
  }, [currentMonth, currentYear, navigateToMonth])

  const handleNextMonth = useCallback(() => {
    const newMonth = currentMonth === 12 ? 1 : currentMonth + 1
    const newYear = currentMonth === 12 ? currentYear + 1 : currentYear
    navigateToMonth(newYear, newMonth)
  }, [currentMonth, currentYear, navigateToMonth])

  if (isLoading) return <LoadingState />
  if (!goal) return <NotFoundState />

  return (
    <div className="space-y-4">
      {/* TODO: Components commented out temporarily - need to implement */}
      {/* Navigation breadcrumbs */}
      {/* <ViewNavigation ... /> */}

      {/* Top stats bar */}
      {/* <TopStatsBar ... /> */}

      {/* Main content area */}
      {viewType === 'year' && <div>Year view - TODO: Implement YearGrid</div>}

      {(viewType === 'month' || viewType === 'day') && currentMonthInfo && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left: Month calendar */}
          <div className="lg:col-span-2">
            <MonthCalendar
              year={currentYear}
              month={currentMonth}
              monthInfo={currentMonthInfo}
              todayISO={todayISO}
              selectedDate={date || null}
              dayCustomizations={dayCustomizations}
              onPrevMonth={handlePrevMonth}
              onNextMonth={handleNextMonth}
              onDayClick={navigateToDay}
            />
          </div>

          {/* Right: Summary or details panel */}
          <div className="lg:col-span-1">
            {/* <RightPanel ... /> */}
            <div>Details panel - TODO: Implement RightPanel</div>
          </div>
        </div>
      )}
    </div>
  )
}
