'use client'

import { useMemo, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MonthCalendar, useMonthCalendar } from '@/sdk'
import type { DayCustomization, CalendarIndicator } from '@/sdk'
import { CalendarDetailPanel } from './CalendarDetailPanel'
import {
  PluginSummaryAggregator,
  usePluginIndicators,
} from './PluginSummaryAggregator'
import { CalendarFilters } from './CalendarFilters'
import { useGoalData } from '@/hooks/useGoalData'
import { usePluginRegistry } from '@/core/plugin-registry/hooks'
import { useAddonsConfig } from '@/hooks/useAddonsConfig'
import { useAuth } from '@/hooks/useAuth'
import { getScoreColorClass } from '@/utils'
import {
  getStudyBackgroundColor,
  getFinanceBackgroundColor,
  getTravelBackgroundColor,
  getPeriodBackgroundColor,
} from '@/utils/plugin-colors'
import {
  loadCalendarFilters,
  saveCalendarFilters,
} from '@/lib/api/calendar-filters-api'
import { getFirestore } from 'firebase/firestore'
import { Card } from '@/components/ui/Card'

interface CalendarPageProps {
  context: any // PluginContext from SDK, but calendar is core so we just need minimal info
  year?: number
  month?: number
  initialSelectedDate?: string | null
}

export default function CalendarPage({
  context,
  year: initialYear,
  month: initialMonth,
  initialSelectedDate,
}: CalendarPageProps) {
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

  // Filter state - initialize all visible
  const [visibleIndicators, setVisibleIndicators] = useState<Set<string>>(
    () => new Set(plugins.map((p) => p.id)),
  )
  const [backgroundSource, setBackgroundSource] = useState<string | null>(
    'productivity',
  )
  const [filtersLoaded, setFiltersLoaded] = useState(false)

  // Load filters from Firestore
  useEffect(() => {
    if (!user?.uid || !goalId) return

    const loadFilters = async () => {
      try {
        const db = getFirestore()
        const saved = await loadCalendarFilters(db, user.uid, goalId)

        if (saved) {
          if (Array.isArray(saved.visibleIndicators)) {
            setVisibleIndicators(new Set(saved.visibleIndicators))
          }
          if (saved.backgroundSource !== undefined) {
            setBackgroundSource(saved.backgroundSource)
          }
        }
      } catch (error) {
        console.error('Failed to load calendar filters:', error)
      } finally {
        setFiltersLoaded(true)
      }
    }

    loadFilters()
  }, [user?.uid, goalId])

  // Save filters to Firestore (debounced)
  useEffect(() => {
    if (!user?.uid || !goalId || !filtersLoaded) return

    const timeoutId = setTimeout(async () => {
      try {
        const db = getFirestore()
        await saveCalendarFilters(db, user.uid, goalId, {
          visibleIndicators: Array.from(visibleIndicators),
          backgroundSource,
        })
      } catch (error) {
        console.error('Failed to save calendar filters:', error)
      }
    }, 500) // Debounce for 500ms

    return () => clearTimeout(timeoutId)
  }, [user?.uid, goalId, visibleIndicators, backgroundSource, filtersLoaded])

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
  } = useMonthCalendar({
    initialYear,
    initialMonth,
    initialSelectedDate,
  })

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

    monthInfo.days.forEach((day) => {
      const indicators = pluginIndicators[day.iso] || []

      // Filter indicators based on visibleIndicators state
      const activeIndicators = indicators
        .filter((ind) => ind.hasData && visibleIndicators.has(ind.pluginId))
        .map((ind) => ({
          id: ind.pluginId,
          label: ind.pluginName,
          color: ind.color,
        }))

      // Get background from selected plugin
      let bgColor: string | undefined = undefined

      if (backgroundSource === 'productivity') {
        const status = pluginData?.['productivity']?.[day.iso]?.status || null
        bgColor = getScoreColorClass(status)
      } else if (backgroundSource === 'study') {
        const studyData = pluginData?.['study']?.[day.iso] as any
        bgColor = getStudyBackgroundColor(studyData)
      } else if (backgroundSource === 'finance') {
        const financeData = pluginData?.['finance']?.[day.iso] as any
        bgColor = getFinanceBackgroundColor(financeData)
      } else if (backgroundSource === 'travel') {
        const travelData = pluginData?.['travel']?.[day.iso] as any
        bgColor = getTravelBackgroundColor(travelData)
      } else if (backgroundSource === 'period') {
        const periodData = pluginData?.['period']?.[day.iso] as any
        bgColor = getPeriodBackgroundColor(periodData)
      }
      // else: backgroundSource is null, no background

      customizations[day.iso] = {
        backgroundColor: bgColor,
        indicators: activeIndicators,
      }
    })

    return customizations
  }, [
    monthInfo.days,
    pluginData,
    pluginIndicators,
    visibleIndicators,
    backgroundSource,
  ])

  // Build legend for plugins - filter to only show visible indicators
  const pluginLegend = useMemo(() => {
    const pluginsMap = new Map<
      string,
      { id: string; name: string; color: string }
    >()

    Object.values(pluginIndicators).forEach((dayIndicators) => {
      dayIndicators.forEach((indicator) => {
        if (
          indicator.hasData &&
          visibleIndicators.has(indicator.pluginId) &&
          !pluginsMap.has(indicator.pluginId)
        ) {
          pluginsMap.set(indicator.pluginId, {
            id: indicator.pluginId,
            name: indicator.pluginName,
            color: indicator.color,
          })
        }
      })
    })

    return Array.from(pluginsMap.values())
  }, [pluginIndicators, visibleIndicators])

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

  // Handle day click - update URL with selected date
  const handleDayClick = (date: string) => {
    setSelectedDate(date)
    // Update URL with the selected date
    router.push(`/goal/${goalId}?date=${date}`, { scroll: false })
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
          onDayClick={handleDayClick}
          headerContent={
            <div className="mb-4">
              <CalendarFilters
                compact={true}
                availablePlugins={plugins.map((p) => ({
                  id: p.id,
                  name: p.metadata.name,
                  icon: p.metadata.icon || '📊',
                }))}
                visibleIndicators={visibleIndicators}
                backgroundSource={backgroundSource}
                onToggleIndicator={(id) => {
                  const newSet = new Set(visibleIndicators)
                  if (newSet.has(id)) {
                    newSet.delete(id)
                  } else {
                    newSet.add(id)
                  }
                  setVisibleIndicators(newSet)
                }}
                onChangeBackground={setBackgroundSource}
              />
            </div>
          }
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
                  allPluginData={pluginData || {}}
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
