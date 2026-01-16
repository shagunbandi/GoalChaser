'use client'

import { useMemo, useState, useEffect } from 'react'
import type { DayDetails, AgendaItem, SubjectConfig } from '@/types'
import { Card } from '@/components/ui'
import { AgendaDayModal } from './AgendaDayModal'
import { AgendaStats } from './AgendaStats'
import { computeMonthInfo } from '@/utils'

interface AgendaViewProps {
  year: number
  todayISO: string
  dayDetails: Record<string, DayDetails>
  subjectConfigs: SubjectConfig[]
  onUpdateDay: (iso: string, updates: Partial<DayDetails>) => Promise<void>
  onJumpToDay?: (iso: string) => void
  initialSelectedDay?: string | null
  onPrevYear: () => void
  onNextYear: () => void
}

type FilterStatus = 'all' | 'completed' | 'pending'

export function AgendaView({
  year,
  todayISO,
  dayDetails,
  subjectConfigs,
  onUpdateDay,
  onJumpToDay,
  initialSelectedDay,
  onPrevYear,
  onNextYear,
}: AgendaViewProps) {
  const [selectedDay, setSelectedDay] = useState<string | null>(
    initialSelectedDay || null,
  )
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [filterSubjects, setFilterSubjects] = useState<string[]>([])

  useEffect(() => {
    if (initialSelectedDay && initialSelectedDay !== selectedDay) {
      setSelectedDay(initialSelectedDay)
    }
  }, [initialSelectedDay, selectedDay])

  const yearPrefix = `${year}-`

  const months = useMemo(
    () =>
      Array.from({ length: 12 }, (_, index) =>
        computeMonthInfo(year, index + 1),
      ),
    [year],
  )

  // Get all available subjects from subjectConfigs
  const availableSubjects = useMemo(() => {
    return subjectConfigs.map((config) => config.name)
  }, [subjectConfigs])

  // Compute agenda data for the year
  const agendaData = useMemo(() => {
    const dayAgendas: Record<string, AgendaItem[]> = {}
    let totalItems = 0
    let completedItems = 0
    let recurringItems = 0

    Object.entries(dayDetails).forEach(([iso, details]) => {
      if (iso.startsWith(yearPrefix) && details.agendaItems?.length) {
        const items = details.agendaItems

        // Apply filters
        let filteredItems = items

        if (filterStatus !== 'all') {
          filteredItems = filteredItems.filter((item) =>
            filterStatus === 'completed' ? item.completed : !item.completed,
          )
        }

        if (filterSubjects.length > 0) {
          filteredItems = filteredItems.filter((item) =>
            item.subjects?.some((s) => filterSubjects.includes(s)),
          )
        }

        if (filteredItems.length > 0) {
          dayAgendas[iso] = filteredItems

          filteredItems.forEach((item) => {
            totalItems++
            if (item.completed) completedItems++
            if (item.recurrenceId) recurringItems++
          })
        }
      }
    })

    return {
      dayAgendas,
      totalItems,
      completedItems,
      recurringItems,
      completionPercentage:
        totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0,
    }
  }, [dayDetails, yearPrefix, filterStatus, filterSubjects])

  const handleDayClick = (iso: string) => {
    setSelectedDay(iso)
    onJumpToDay?.(iso)
  }

  const handleCloseModal = () => {
    setSelectedDay(null)
  }

  const toggleSubjectFilter = (subject: string) => {
    setFilterSubjects((prev) =>
      prev.includes(subject)
        ? prev.filter((s) => s !== subject)
        : [...prev, subject],
    )
  }

  const getDayColor = (iso: string): string => {
    const items = agendaData.dayAgendas[iso]
    if (!items || items.length === 0) return 'bg-white/5'

    const completedCount = items.filter((i) => i.completed).length
    const percentage = (completedCount / items.length) * 100

    if (percentage === 100) return 'bg-green-500/20 border-green-500/40'
    if (percentage >= 50) return 'bg-yellow-500/20 border-yellow-500/40'
    return 'bg-red-500/20 border-red-500/40'
  }

  const getDayItemCount = (iso: string): number => {
    return agendaData.dayAgendas[iso]?.length || 0
  }

  return (
    <div className="space-y-6">
      {/* Header with Year Navigation */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <button
            onClick={onPrevYear}
            className="
              px-4 py-2 rounded-lg text-sm font-medium
              bg-white/5 text-white/70
              hover:bg-white/10 hover:text-white
              transition-all duration-150
            "
          >
            ← {year - 1}
          </button>
          <h1 className="text-2xl font-bold text-white">{year} Agenda</h1>
          <button
            onClick={onNextYear}
            className="
              px-4 py-2 rounded-lg text-sm font-medium
              bg-white/5 text-white/70
              hover:bg-white/10 hover:text-white
              transition-all duration-150
            "
          >
            {year + 1} →
          </button>
        </div>
      </Card>

      {/* Filters and Stats */}
      <Card className="p-6 space-y-4">
        {/* Status Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-white/70">
            Filter by Status
          </label>
          <div className="flex gap-2 flex-wrap">
            {(['all', 'completed', 'pending'] as FilterStatus[]).map(
              (status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium
                    transition-all duration-150
                    ${
                      filterStatus === status
                        ? 'bg-purple-500/30 text-white border border-purple-500/50'
                        : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                    }
                  `}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ),
            )}
          </div>
        </div>

        {/* Subject Filter */}
        {availableSubjects.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/70">
              Filter by Subjects
            </label>
            <div className="flex gap-2 flex-wrap">
              {availableSubjects.map((subject) => (
                <button
                  key={subject}
                  onClick={() => toggleSubjectFilter(subject)}
                  className={`
                    px-3 py-1.5 rounded-lg text-xs font-medium
                    transition-all duration-150
                    ${
                      filterSubjects.includes(subject)
                        ? 'bg-blue-500/30 text-white border border-blue-500/50'
                        : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70'
                    }
                  `}
                >
                  {subject}
                </button>
              ))}
              {filterSubjects.length > 0 && (
                <button
                  onClick={() => setFilterSubjects([])}
                  className="
                    px-3 py-1.5 rounded-lg text-xs font-medium
                    bg-red-500/20 text-red-300
                    hover:bg-red-500/30
                    transition-all duration-150
                  "
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        )}

        {/* Stats */}
        <AgendaStats
          totalItems={agendaData.totalItems}
          completedItems={agendaData.completedItems}
          recurringItems={agendaData.recurringItems}
          completionPercentage={agendaData.completionPercentage}
        />
      </Card>

      {/* Month Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {months.map((monthInfo) => {
          const monthName = new Date(
            monthInfo.year,
            monthInfo.month - 1,
          ).toLocaleDateString('en-US', { month: 'long' })

          // Calculate offset for first day of month
          const firstDayWeekdayIndex = monthInfo.days[0]?.weekdayIndex || 0

          return (
            <Card key={monthInfo.month} className="p-4">
              <h3 className="text-lg font-semibold text-white mb-3 text-center">
                {monthName}
              </h3>

              {/* Weekday Headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
                  <div
                    key={idx}
                    className="text-center text-xs font-medium text-white/40 py-1"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-1">
                {/* Empty cells for offset */}
                {Array.from({ length: firstDayWeekdayIndex }).map((_, idx) => (
                  <div key={`empty-${idx}`} className="aspect-square" />
                ))}

                {/* Day cells */}
                {monthInfo.days.map((dayInfo) => {
                  const itemCount = getDayItemCount(dayInfo.iso)
                  const colorClass = getDayColor(dayInfo.iso)
                  const isToday = dayInfo.iso === todayISO
                  const isPast = dayInfo.iso < todayISO

                  return (
                    <button
                      key={dayInfo.iso}
                      onClick={() => handleDayClick(dayInfo.iso)}
                      disabled={isPast && itemCount === 0}
                      className={`
                        aspect-square rounded-lg relative
                        flex flex-col items-center justify-center
                        transition-all duration-150
                        ${colorClass}
                        ${
                          itemCount > 0
                            ? 'border hover:scale-105 cursor-pointer'
                            : 'cursor-default'
                        }
                        ${isToday ? 'ring-2 ring-blue-500' : ''}
                        ${isPast && itemCount === 0 ? 'opacity-30' : ''}
                        disabled:cursor-not-allowed
                      `}
                    >
                      <span
                        className={`
                          text-sm font-medium
                          ${itemCount > 0 ? 'text-white' : 'text-white/40'}
                        `}
                      >
                        {dayInfo.dayOfMonth}
                      </span>
                      {itemCount > 0 && (
                        <span className="text-[10px] font-bold text-white/80 mt-0.5">
                          {itemCount}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </Card>
          )
        })}
      </div>

      {/* Day Modal */}
      {selectedDay && (
        <AgendaDayModal
          selectedDate={selectedDay}
          todayISO={todayISO}
          dayDetails={dayDetails}
          availableSubjects={availableSubjects}
          onUpdateDetails={onUpdateDay}
          onClose={handleCloseModal}
        />
      )}
    </div>
  )
}
