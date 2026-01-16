'use client'

import { useState } from 'react'
import { Card } from '@/components/ui'
import type { YearViewConfig } from '@/types/year-view-config'
import { HeaderRenderer } from './renderers/HeaderRenderer'
import { DayRenderer } from './renderers/DayRenderer'
import { FooterRenderer } from './renderers/FooterRenderer'
import { ModalRenderer } from './renderers/ModalRenderer'
import { MONTH_NAMES, WEEKDAY_LABELS } from '@/constants'

interface GenericYearViewProps {
  config: YearViewConfig
  initialSelectedDay?: string | null
}

export function GenericYearView({
  config,
  initialSelectedDay,
}: GenericYearViewProps) {
  const [selectedDay, setSelectedDay] = useState<string | null>(
    initialSelectedDay || null,
  )

  const handleDaySelect = (date: string | null) => {
    // If showDayModal is false, don't set selectedDay (which would open the modal)
    // Just call the onDaySelect callback directly
    if (config.showDayModal === false) {
      config.onDaySelect?.(date)
    } else {
      // Default behavior: show modal
      setSelectedDay(date)
      config.onDaySelect?.(date)
    }
  }

  const modalSections = selectedDay ? config.modal.getSections(selectedDay) : []
  const modalActions = selectedDay ? config.modal.getActions(selectedDay) : []

  // Only show modal if showDayModal is not explicitly set to false
  const shouldShowModal = config.showDayModal !== false

  return (
    <>
      {/* Header */}
      <HeaderRenderer
        config={config.header}
        year={config.year}
        onPrevYear={config.onPrevYear}
        onNextYear={config.onNextYear}
      />

      {/* Month Grid */}
      <Card className="p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 md:auto-rows-fr">
          {config.months.map((monthConfig) => {
            const offset = monthConfig.days[0]?.weekdayIndex || 0
            const monthLabel = MONTH_NAMES[monthConfig.month - 1]

            return (
              <div
                key={monthConfig.month}
                className="rounded-2xl border border-white/8 bg-white/3 p-4 flex flex-col"
              >
                {/* Month Header */}
                <div className="flex items-center justify-between mb-2">
                  <button
                    onClick={() => {
                      if (monthConfig.onHeaderClick) {
                        monthConfig.onHeaderClick()
                      } else if (config.onMonthClick) {
                        config.onMonthClick(monthConfig.year, monthConfig.month)
                      }
                    }}
                    className="text-sm font-semibold text-white/90 hover:text-white transition-colors cursor-pointer"
                  >
                    {monthLabel}
                  </button>
                  {monthConfig.headerRight}
                </div>

                {/* Weekday Labels */}
                <div className="grid grid-cols-7 gap-1 mb-1">
                  {WEEKDAY_LABELS.map((label) => (
                    <div
                      key={`${monthConfig.month}-${label}`}
                      className="text-[10px] text-center text-white/40"
                    >
                      {label}
                    </div>
                  ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1 flex-1 content-start">
                  {Array.from({ length: offset }).map((_, index) => (
                    <div
                      key={`empty-${monthConfig.month}-${index}`}
                      className="h-8"
                    />
                  ))}
                  {monthConfig.days.map((dayConfig) => (
                    <DayRenderer
                      key={dayConfig.iso}
                      config={{
                        ...dayConfig,
                        onClick: () => handleDaySelect(dayConfig.iso),
                      }}
                      isToday={dayConfig.iso === config.todayISO}
                    />
                  ))}
                </div>

                {/* Footer */}
                <div className="mt-3 pt-3 border-t border-white/10 min-h-[120px]">
                  <FooterRenderer items={monthConfig.footer} />
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Day Details Modal - Only show if showDayModal is not false */}
      {shouldShowModal && (
        <ModalRenderer
          open={!!selectedDay}
          onClose={() => handleDaySelect(null)}
          date={selectedDay}
          sections={modalSections}
          actions={modalActions}
        />
      )}
    </>
  )
}
