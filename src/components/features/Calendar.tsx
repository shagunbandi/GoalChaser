'use client'

import type {
  DayStatus,
  MonthInfo,
  SuccessCriterion,
  DayDetails,
} from '@/types'
import { Card } from '@/components/ui/Card'
import { getScoreColorClass, getStatusColorStyle } from '@/utils'
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
    const subjectHours =
      details.subjects?.reduce((sum, entry) => sum + (entry.hours || 0), 0) || 0
    const directHours = details.directHours || 0
    // Subject hours take priority over direct hours
    return subjectHours > 0 ? subjectHours : directHours
  }

  const getDayClasses = (
    status: DayStatus,
    isToday: boolean,
    isSelected: boolean,
    isInRange: boolean,
  ): string => {
    // For productivity criterion or default, use the existing color class
    const useProductivityColors =
      !successCriterion || successCriterion.type === 'productivity'
    const bg = useProductivityColors ? getScoreColorClass(status) : ''

    const todayRing = isToday
      ? 'ring-2 ring-[#007AFF] ring-offset-1 ring-offset-[#0a0a12]'
      : ''
    const selectedRing = isSelected
      ? 'ring-2 ring-[#AF52DE] ring-offset-2 ring-offset-[#0a0a12] shadow-[0_0_20px_rgba(175,82,222,0.3)]'
      : ''
    const outOfRange = !isInRange
      ? 'opacity-30 cursor-not-allowed'
      : 'cursor-pointer hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:scale-[1.05]'

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

  const getActivityIcons = (iso: string) => {
    const details = dayDetails?.[iso]
    const agendaItems = details?.agendaItems || details?.plannedItems || []
    const expenses = details?.expenses || []
    const income = details?.income || []
    const travelPlans = details?.travelPlans || []

    const icons = []
    
    // Agenda
    if (agendaItems.length > 0) {
      icons.push({
        emoji: '📝',
        tooltip: `${agendaItems.length} agenda item${agendaItems.length > 1 ? 's' : ''}: ${agendaItems.map(i => i.title).join(', ')}`
      })
    }
    
    // Expenses
    if (expenses.length > 0) {
      const total = expenses.reduce((sum, e) => sum + e.amount, 0)
      icons.push({
        emoji: '💸',
        tooltip: `${expenses.length} expense${expenses.length > 1 ? 's' : ''}: ₹${total.toLocaleString('en-IN')}`
      })
    }
    
    // Income
    if (income.length > 0) {
      const total = income.reduce((sum, i) => sum + i.amount, 0)
      icons.push({
        emoji: '💰',
        tooltip: `${income.length} income: ₹${total.toLocaleString('en-IN')}`
      })
    }
    
    // Travel
    if (travelPlans.length > 0) {
      icons.push({
        emoji: '✈️',
        tooltip: travelPlans.map(t => t.title).join(', ')
      })
    }

    if (icons.length === 0) return null

    return (
      <div className="mt-auto w-full flex justify-center gap-0.5">
        {icons.map((icon, idx) => (
          <span
            key={idx}
            className="text-[11px] opacity-80"
            title={icon.tooltip}
          >
            {icon.emoji}
          </span>
        ))}
      </div>
    )
  }

  const content = (
    <>
      {/* Month Navigation Header */}
      <div className="relative flex items-center justify-between pb-5 mb-5 gap-2" data-testid="calendar-header">
        <button
          data-testid="calendar-prev-month"
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
          <h2 className="text-base sm:text-lg font-semibold text-white/90 tracking-wide truncate" data-testid="calendar-month-year">
            {MONTH_NAMES[currentMonth - 1]} {currentYear}
          </h2>
        </div>
        <button
          data-testid="calendar-next-month"
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
      <div className="grid grid-cols-7 gap-2 mb-3" data-testid="calendar-weekdays">
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
      <div className="grid grid-cols-7 gap-2" data-testid="calendar-days-grid">
        {emptyCells.map((_, index) => (
          <div key={`empty-${index}`} className="aspect-square" />
        ))}
        {monthInfo.days.map((day) => {
          const status = dayStatuses[day.iso] || null
          const isToday = day.iso === todayISO
          const isSelected = day.iso === selectedDate
          const isInRange = isDateInRange(day.iso)
          const activityIcons = getActivityIcons(day.iso)
          return (
            <div
              key={day.iso}
              data-testid={`calendar-day-${day.dayOfMonth}`}
              data-selected={isSelected}
              data-today={isToday}
              onClick={() => isInRange && onDayClick(day.iso)}
              className={getDayClasses(status, isToday, isSelected, isInRange)}
              style={isInRange ? getDayStyle(day.iso) : undefined}
            >
              <span className="text-sm font-medium">{day.dayOfMonth}</span>
              {activityIcons}
            </div>
          )
        })}
      </div>

      {/* Activity Legend */}
      <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap gap-4 text-[11px] text-white/60">
        <div className="flex items-center gap-1.5">
          <span className="text-sm">📝</span>
          <span>Agenda</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-sm">💸</span>
          <span>Expense</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-sm">💰</span>
          <span>Income</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-sm">✈️</span>
          <span>Travel</span>
        </div>
      </div>
    </>
  )

  if (noCard) {
    return <div className="p-6">{content}</div>
  }

  return <Card className="p-6">{content}</Card>
}
