'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { MonthCalendar, useMonthCalendar } from '@/sdk'
import type { DayCustomization, CalendarIndicator } from '@/sdk'
import { CalendarDetailPanel } from './CalendarDetailPanel'
import {
  PluginSummaryAggregator,
  usePluginIndicators,
} from './PluginSummaryAggregator'
import { useGoalData } from '@/hooks/useGoalData'
import { usePluginRegistry } from '@/core/plugin-registry/hooks'
import { useAddonsConfig } from '@/hooks/useAddonsConfig'
import { useAuth } from '@/hooks/useAuth'
import { getScoreColorClass } from '@/utils'
import { Card } from '@/components/ui/Card'

interface CalendarPageProps {
  context: any // PluginContext from SDK, but calendar is core so we just need minimal info
  year?: number
}

export default function CalendarPage({ context }: CalendarPageProps) {
  const { user } = useAuth()
  const router = useRouter()
  const goalId = context.goalId
  const {
    goal,
    isLoading: loading,
    pluginData,
    handleUpdateData,
  } = useGoalData(goalId)
  const { enabledAddons } = useAddonsConfig(user?.uid, goalId)
  const { registry } = usePluginRegistry()
  const plugins = registry.getAllPlugins()

  // Extract calendar-specific data
  const calendarData = pluginData?.['calendar'] || {}

  // Use the month calendar hook
  const {
    year,
    month,
    monthInfo,
    todayISO,
    selectedDate,
    prevMonth,
    nextMonth,
    setSelectedDate,
  } = useMonthCalendar()

  // Generate date range for the current month
  const dateRange = useMemo(() => {
    return monthInfo.days.map((d) => d.iso)
  }, [monthInfo])

  // Organize plugin data by date (aggregate all plugin data for each date)
  const pluginDataByDate: Record<string, Record<string, any>> = useMemo(() => {
    const data: Record<string, Record<string, any>> = {}
    if (pluginData) {
      dateRange.forEach((date) => {
        // Aggregate data from all plugins for this date
        const dayData: Record<string, any> = {}
        Object.keys(pluginData).forEach((pluginId) => {
          const pluginDayData = pluginData[pluginId]?.[date]
          if (pluginDayData) {
            dayData[pluginId] = pluginDayData
          }
        })
        data[date] = dayData
      })
    }
    return data
  }, [pluginData, dateRange])

  // Get plugin indicators (colored dots) for this month
  const pluginIndicators = usePluginIndicators(
    plugins,
    dateRange,
    pluginDataByDate,
    goalId,
  )

  // Build day customizations from productivity status and plugin indicators
  const dayCustomizations = useMemo(() => {
    const customizations: Record<string, DayCustomization> = {}
    const productivityData = pluginData?.['productivity'] || {}

    monthInfo.days.forEach((day) => {
      const status = productivityData[day.iso]?.status || null
      const indicators = pluginIndicators[day.iso] || []
      const activeIndicators = indicators.filter((ind) => ind.hasData)

      // Build customization for this day
      const bgColor = getScoreColorClass(status)

      customizations[day.iso] = {
        backgroundColor: bgColor,
        indicators: activeIndicators.map((ind) => ({
          id: ind.pluginId,
          label: ind.pluginName,
          color: ind.color,
        })),
      }
    })

    return customizations
  }, [monthInfo.days, pluginData, pluginIndicators])

  // Build legend for plugins
  const pluginLegend = useMemo(() => {
    const pluginsMap = new Map<
      string,
      { id: string; name: string; color: string }
    >()

    Object.values(pluginIndicators).forEach((dayIndicators) => {
      dayIndicators.forEach((indicator) => {
        if (indicator.hasData && !pluginsMap.has(indicator.pluginId)) {
          pluginsMap.set(indicator.pluginId, {
            id: indicator.pluginId,
            name: indicator.pluginName,
            color: indicator.color,
          })
        }
      })
    })

    return Array.from(pluginsMap.values())
  }, [pluginIndicators])

  // Compute values that depend on state
  const selectedDateNotes = selectedDate
    ? calendarData?.[selectedDate]?.notes || ''
    : ''

  const handleNotesUpdate = async (date: string, notes: string) => {
    // Update calendar notes
    await handleUpdateData('calendar', date, { notes })
  }

  const handleJumpToPlugin = (pluginId: string, date: string) => {
    // Navigate to plugin page with date context
    const dateObj = new Date(date)
    const year = dateObj.getFullYear()
    router.push(`/goal/${goalId}/${pluginId}/${year}?date=${date}`)
  }

  if (loading || !goal) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-white/60">Loading calendar...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calendar Month View */}
        <MonthCalendar
          year={year}
          month={month}
          monthInfo={monthInfo}
          todayISO={todayISO}
          selectedDate={selectedDate}
          startDate={goal.startDate}
          endDate={goal.endDate}
          dayCustomizations={dayCustomizations}
          onPrevMonth={prevMonth}
          onNextMonth={nextMonth}
          onDayClick={setSelectedDate}
          footerContent={
            pluginLegend.length > 0 ? (
              <div className="flex flex-wrap gap-4 text-xs text-white/60">
                {pluginLegend.map((plugin) => (
                  <div key={plugin.id} className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: plugin.color }}
                    />
                    <span>{plugin.name}</span>
                  </div>
                ))}
              </div>
            ) : undefined
          }
          testIdPrefix="calendar"
        />

        {/* Detail Panel */}
        <div className="glass-panel p-6 rounded-lg">
          {selectedDate ? (
            <CalendarDetailPanel
              selectedDate={selectedDate}
              notes={selectedDateNotes}
              onUpdateNotes={(notes) => handleNotesUpdate(selectedDate, notes)}
              pluginSummariesElement={
                <PluginSummaryAggregator
                  plugins={plugins}
                  date={selectedDate}
                  pluginData={pluginDataByDate[selectedDate] || {}}
                  goalId={goalId}
                  onActionClick={(pluginId) =>
                    handleJumpToPlugin(pluginId, selectedDate)
                  }
                />
              }
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-white/40">
                <div className="text-4xl mb-3">📅</div>
                <p>Select a date to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
