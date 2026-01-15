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
}

export function GenericYearView({ config }: GenericYearViewProps) {
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  const modalSections = selectedDay ? config.modal.getSections(selectedDay) : []
  const modalActions = selectedDay ? config.modal.getActions(selectedDay) : []

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
                  <div className="text-sm font-semibold text-white/90">
                    {monthLabel}
                  </div>
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
                        onClick: () => setSelectedDay(dayConfig.iso),
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

      {/* Day Details Modal */}
      <ModalRenderer
        open={!!selectedDay}
        onClose={() => setSelectedDay(null)}
        date={selectedDay}
        sections={modalSections}
        actions={modalActions}
      />
    </>
  )
}
