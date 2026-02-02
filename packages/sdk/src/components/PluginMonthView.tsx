'use client'

import { useMemo, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MonthCalendar } from '../ui/MonthCalendar'
import { useMonthCalendar } from '../hooks/useMonthCalendar'
import type { Plugin } from '../interfaces/plugin.interface'
import type { PluginDayData } from '../types'
import type { DayCustomization } from '../ui/MonthCalendar'
import { Card } from '../ui/Card'
import { ButtonRenderer } from '../year-view/renderers/ButtonRenderer'
import { MONTH_NAMES } from '../constants/calendar'

export interface PluginMonthViewProps<TDayData extends PluginDayData = any> {
  /** The plugin configuration */
  plugin: Plugin

  /** Initial year to display */
  year: number

  /** Initial month to display (1-12) */
  month: number

  /** Goal ID */
  goalId: string

  /** Today's date in ISO format */
  todayISO: string

  /** Plugin day data (all dates) */
  dayData: Record<string, TDayData>

  /** Selected date from URL (optional) */
  initialSelectedDate?: string | null

  /** Update day data callback */
  onUpdateDay: (iso: string, updates: Partial<TDayData>) => Promise<void>

  /** Navigation back to year view */
  onBackToYear: () => void

  /** Function to build day customizations from plugin data */
  buildDayCustomization?: (
    date: string,
    data: TDayData | null,
  ) => DayCustomization | null

  /** Optional context to pass to detail provider */
  detailContext?: any

  /** Footer content to display below the calendar (e.g., summary chips, legend) */
  footerContent?: React.ReactNode
}

/**
 * Reusable month view component for plugins
 *
 * This component provides:
 * - Month calendar using the new MonthCalendar component
 * - Day details panel on the right (when a day is selected)
 * - Plugin-specific day rendering via buildDayCustomization
 * - Navigation between months
 */
export function PluginMonthView<TDayData extends PluginDayData = any>({
  plugin,
  year: initialYear,
  month: initialMonth,
  goalId,
  todayISO,
  dayData,
  initialSelectedDate,
  onUpdateDay,
  onBackToYear,
  buildDayCustomization,
  detailContext,
  footerContent,
}: PluginMonthViewProps<TDayData>) {
  const router = useRouter()
  const detailPanelRef = useRef<HTMLDivElement>(null)

  const {
    year,
    month,
    monthInfo,
    selectedDate,
    prevMonth,
    nextMonth,
    setSelectedDate,
  } = useMonthCalendar({
    initialYear,
    initialMonth,
    initialSelectedDate, // Pass the initial selected date
  })

  // Scroll to detail panel on mobile when there's an initial selected date
  useEffect(() => {
    if (initialSelectedDate && detailPanelRef.current) {
      // Small delay to ensure layout is complete
      const timer = setTimeout(() => {
        // Only scroll on mobile (< 1024px which is lg breakpoint)
        if (window.innerWidth < 1024) {
          detailPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [initialSelectedDate])

  // Handle day click - update both local state AND URL
  const handleDayClick = useCallback(
    (date: string) => {
      setSelectedDate(date)
      // Update URL without causing navigation/reload
      const currentPath = window.location.pathname
      router.replace(`${currentPath}?date=${date}`, { scroll: false })
    },
    [setSelectedDate, router],
  )

  // Build day customizations using plugin data
  const dayCustomizations = useMemo(() => {
    if (!buildDayCustomization) return {}

    const customizations: Record<string, DayCustomization> = {}
    monthInfo.days.forEach((day) => {
      const data = dayData[day.iso] || null
      const customization = buildDayCustomization(day.iso, data)
      if (customization) {
        customizations[day.iso] = customization
      }
    })

    return customizations
  }, [monthInfo.days, dayData, buildDayCustomization])

  // Get selected day data
  const selectedDayData = selectedDate ? dayData[selectedDate] : null

  // Render detail panel using plugin's detail provider
  const renderDetailPanel = () => {
    if (!selectedDate) {
      return (
        <Card className="p-6 h-full flex items-center justify-center">
          <div className="text-center text-white/40">
            <div className="text-4xl mb-3">📅</div>
            <p>Select a date to view details</p>
          </div>
        </Card>
      )
    }

    // Use plugin's detail provider if available
    if (plugin.detailProvider) {
      const DetailComponent = plugin.detailProvider.renderDetail(
        selectedDayData,
        selectedDate,
        (updates) => onUpdateDay(selectedDate, updates),
        detailContext,
      )

      if (DetailComponent) {
        return (
          <Card className="p-6">
            <div className="mb-4 pb-4 border-b border-white/10">
              <h3 className="text-lg font-semibold text-white/90">
                {new Date(selectedDate + 'T00:00:00').toLocaleDateString(
                  'en-US',
                  {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  },
                )}
              </h3>
            </div>
            {DetailComponent}
          </Card>
        )
      }
    }

    // Default detail panel if no provider
    return (
      <Card className="p-6">
        <div className="mb-4 pb-4 border-b border-white/10">
          <h3 className="text-lg font-semibold text-white/90">
            {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </h3>
        </div>
        {selectedDayData ? (
          <pre className="text-xs text-white/60 overflow-auto">
            {JSON.stringify(selectedDayData, null, 2)}
          </pre>
        ) : (
          <p className="text-white/40 text-sm">No data for this day</p>
        )}
      </Card>
    )
  }

  // Navigate to calendar
  const handleBackToCalendar = useCallback(() => {
    router.push(
      `/goal/${goalId}/calendar/${initialYear}/${initialMonth}?date=${
        selectedDate || ''
      }`,
    )
  }, [router, goalId, initialYear, initialMonth, selectedDate])

  return (
    <div className="space-y-4">
      {/* Navigation buttons */}
      <div className="flex items-center gap-2">
        <ButtonRenderer
          config={{
            id: 'back-to-year',
            label: 'Back to Year View',
            icon: '←',
            variant: 'ghost',
            onClick: onBackToYear,
          }}
        />
        <ButtonRenderer
          config={{
            id: 'view-in-calendar',
            label: 'View in Calendar',
            icon: '📅',
            variant: 'ghost',
            onClick: handleBackToCalendar,
          }}
        />
      </div>

      {/* Two-column layout: Calendar + Detail Panel (Equal halves) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Month Calendar (1 column on large screens) */}
        <div className="lg:col-span-1">
          <MonthCalendar
            year={year}
            month={month}
            monthInfo={monthInfo}
            todayISO={todayISO}
            selectedDate={selectedDate}
            dayCustomizations={dayCustomizations}
            onPrevMonth={prevMonth}
            onNextMonth={nextMonth}
            onDayClick={handleDayClick}
            testIdPrefix={`${plugin.id}-month`}
            footerContent={footerContent}
          />
        </div>

        {/* Right: Detail Panel (1 column on large screens) */}
        <div ref={detailPanelRef} className="lg:col-span-1">{renderDetailPanel()}</div>
      </div>
    </div>
  )
}
