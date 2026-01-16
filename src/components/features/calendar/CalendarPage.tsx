'use client'

import { useState, useMemo } from 'react'
import { Calendar, PluginIndicator } from '../Calendar'
import { CalendarDetailPanel } from './CalendarDetailPanel'
import { PluginSummaryAggregator, usePluginIndicators } from './PluginSummaryAggregator'
import { useGoalData } from '@/hooks/useGoalData'
import { usePluginRegistry } from '@/core/plugin-registry/hooks'
import { useAddonsConfig } from '@/hooks/useAddonsConfig'
import { useAuth } from '@/hooks/useAuth'
import type { MonthInfo, DayInfo, DayStatus } from '@/types'

interface CalendarPageProps {
  context: any // PluginContext from SDK, but calendar is core so we just need minimal info
  year?: number
}

export default function CalendarPage({ context }: CalendarPageProps) {
  const { user } = useAuth()
  const goalId = context.goalId
  const { goal, isLoading: loading, pluginData, handleUpdateData } = useGoalData(goalId)
  const { enabledAddons } = useAddonsConfig(user?.uid, goalId)
  const { registry } = usePluginRegistry()
  const plugins = registry.getAllPlugins()
  
  // Extract calendar-specific data
  const calendarData = pluginData?.['calendar'] || {}

  // Current month state
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth() + 1

  // Build monthInfo
  const monthInfo: MonthInfo = useMemo(() => {
    const daysInMonth = new Date(year, month, 0).getDate()
    const days: DayInfo[] = []
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day)
      const iso = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      days.push({
        date,
        iso,
        dayOfMonth: day,
        weekdayIndex: (date.getDay() + 6) % 7, // Convert Sunday=0 to Monday=0
      })
    }
    
    return { year, month, days }
  }, [year, month])

  // Generate date range for the current month
  const dateRange = useMemo(() => {
    return monthInfo.days.map(d => d.iso)
  }, [monthInfo])

  // Organize plugin data by date (aggregate all plugin data for each date)
  const pluginDataByDate: Record<string, Record<string, any>> = useMemo(() => {
    const data: Record<string, Record<string, any>> = {}
    if (pluginData) {
      dateRange.forEach(date => {
        // Aggregate data from all plugins for this date
        const dayData: Record<string, any> = {}
        Object.keys(pluginData).forEach(pluginId => {
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
  const pluginIndicators = usePluginIndicators(plugins, dateRange, pluginDataByDate)

  // Build dayStatuses from productivity plugin data
  const dayStatuses: Record<string, DayStatus> = useMemo(() => {
    const statuses: Record<string, DayStatus> = {}
    const productivityData = pluginData?.['productivity'] || {}
    Object.keys(productivityData).forEach(date => {
      statuses[date] = productivityData[date]?.status || null
    })
    return statuses
  }, [pluginData])

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 2, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month, 1))
  }

  const handleDayClick = (iso: string) => {
    setSelectedDate(iso)
  }

  const handleNotesUpdate = async (date: string, notes: string) => {
    // Update calendar notes
    await handleUpdateData('calendar', date, { notes })
  }

  const handleJumpToPlugin = (pluginId: string, date: string) => {
    // TODO: Implement navigation to plugin with date context
    console.log('Jump to plugin:', pluginId, date)
  }

  if (loading || !goal) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-white/60">Loading calendar...</div>
      </div>
    )
  }

  const selectedDateNotes = selectedDate ? (calendarData?.[selectedDate]?.notes || '') : ''

  // Convert enabledAddons array to object for PluginSummaryAggregator
  const enabledAddonsObj = Object.fromEntries(enabledAddons.map(id => [id, {}]))

  const todayISO = new Date().toISOString().split('T')[0]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calendar Month View */}
        <div className="glass-panel p-6 rounded-lg">
          <Calendar
            currentYear={year}
            currentMonth={month}
            monthInfo={monthInfo}
            dayStatuses={dayStatuses}
            dayDetails={pluginDataByDate}
            selectedDate={selectedDate}
            todayISO={todayISO}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
            onDayClick={handleDayClick}
            goalStartDate={goal.startDate}
            goalEndDate={goal.endDate}
            pluginIndicators={pluginIndicators}
          />
        </div>

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
                  onActionClick={(pluginId, actionLabel) => handleJumpToPlugin(pluginId, selectedDate)}
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
