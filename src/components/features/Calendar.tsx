'use client'

import type { DayStatus, MonthInfo, SuccessCriterion, DayDetails } from '@/types'
import { Card } from '@/components/ui/Card'
import { getScoreColorClass, getStatusColorStyle } from '@/lib/scoreUtils'
import { WEEKDAY_LABELS, MONTH_NAMES } from '@/constants'

interface CalendarProps {
  currentYear: number
  currentMonth: number
  monthInfo: MonthInfo
  dayStatuses: Record<string, DayStatus>
  dayDetails?: Record<string, DayDetails>
  selectedDate: string
  todayISO: string
  onPrevMonth: () => void
  onNextMonth: () => void
  onDayClick: (iso: string) => void
  noCard?: boolean
  // Goal date range (optional)
  goalStartDate?: string
  goalEndDate?: string
  // Success criterion for coloring
  successCriterion?: SuccessCriterion
}

export function Calendar({
  currentYear,
  currentMonth,
  monthInfo,
  dayStatuses,
  dayDetails = {},
  selectedDate,
  todayISO,
  onPrevMonth,
  onNextMonth,
  onDayClick,
  noCard = false,
  goalStartDate,
  goalEndDate,
  successCriterion,
}: CalendarProps) {
  const firstDayWeekdayIndex = monthInfo.days[0]?.weekdayIndex || 0
  const emptyCells = Array(firstDayWeekdayIndex).fill(null)

  // Check if a date is within the goal's date range
  const isDateInRange = (iso: string): boolean => {
    if (!goalStartDate && !goalEndDate) return true
    if (goalStartDate && iso < goalStartDate) return false
    if (goalEndDate && iso > goalEndDate) return false
    return true
  }

  // Calculate total hours for a day (subjects OR direct, not both)
  const getTotalHours = (iso: string): number => {
    const details = dayDetails[iso]
    if (!details) return 0
    const subjectHours = details.subjects?.reduce((sum, entry) => sum + (entry.hours || 0), 0) || 0
    const directHours = details.directHours || 0
    // Subject hours take priority over direct hours
    return subjectHours > 0 ? subjectHours : directHours
  }

  const getDayClasses = (
    status: DayStatus,
    isToday: boolean,
    isSelected: boolean,
    isInRange: boolean
  ): string => {
    // For productivity criterion or default, use the existing color class
    const useProductivityColors = !successCriterion || successCriterion.type === 'productivity'
    const bg = useProductivityColors ? getScoreColorClass(status) : ''
    
    const todayRing = isToday ? 'ring-2 ring-[#007AFF] ring-offset-1 ring-offset-[#0a0a12]' : ''
    const selectedRing = isSelected
      ? 'ring-2 ring-[#AF52DE] ring-offset-2 ring-offset-[#0a0a12] shadow-[0_0_20px_rgba(175,82,222,0.3)]'
      : ''
    const outOfRange = !isInRange ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:scale-[1.05]'
    
    return `
      ${bg} ${todayRing} ${selectedRing} ${outOfRange}
      aspect-square rounded-xl
      transition-all duration-200
      flex flex-col items-start justify-start p-2
      backdrop-blur-sm
    `
  }

  // Get inline style for hours-based coloring
  const getDayStyle = (iso: string): React.CSSProperties => {
    if (!successCriterion || successCriterion.type !== 'hours') return {}
    const totalHours = getTotalHours(iso)
    return getStatusColorStyle(successCriterion, null, totalHours)
  }

  const content = (
    <>
      {/* Month Navigation Header */}
      <div className="relative flex items-center justify-between pb-5 mb-5 gap-2">
        <button
          onClick={onPrevMonth}
          className="
            px-3 py-2
            bg-white/[0.05] hover:bg-white/[0.1]
            border border-white/[0.08] hover:border-white/[0.15]
            text-white/70 hover:text-white
            rounded-xl font-medium text-sm
            transition-all duration-200
            hover:-translate-x-0.5
          "
        >
          ←
        </button>
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg sm:text-xl opacity-80">📅</span>
          <h2 className="text-base sm:text-lg font-semibold text-white/90 tracking-wide truncate">
            {MONTH_NAMES[currentMonth - 1]} {currentYear}
          </h2>
        </div>
        <button
          onClick={onNextMonth}
          className="
            px-3 py-2
            bg-white/[0.05] hover:bg-white/[0.1]
            border border-white/[0.08] hover:border-white/[0.15]
            text-white/70 hover:text-white
            rounded-xl font-medium text-sm
            transition-all duration-200
            hover:translate-x-0.5
          "
        >
          →
        </button>
        
        {/* Glass divider */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 gap-2 mb-3">
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className="text-center text-xs font-medium text-white/40 uppercase tracking-wider py-2"
          >
            {label}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-2">
        {emptyCells.map((_, index) => (
          <div key={`empty-${index}`} className="aspect-square" />
        ))}
        {monthInfo.days.map((day) => {
          const status = dayStatuses[day.iso] || null
          const isToday = day.iso === todayISO
          const isSelected = day.iso === selectedDate
          const isInRange = isDateInRange(day.iso)
          return (
            <div
              key={day.iso}
              onClick={() => isInRange && onDayClick(day.iso)}
              className={getDayClasses(status, isToday, isSelected, isInRange)}
              style={isInRange ? getDayStyle(day.iso) : undefined}
            >
              <span className="text-sm font-medium">{day.dayOfMonth}</span>
            </div>
          )
        })}
      </div>
    </>
  )

  if (noCard) {
    return <div className="p-6">{content}</div>
  }

  return <Card className="p-6">{content}</Card>
}
