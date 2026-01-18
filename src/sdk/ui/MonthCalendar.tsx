'use client'

import type { MonthInfo, DayInfo } from '@/types'
import { Card } from '@/components/ui/Card'
import { WEEKDAY_LABELS, MONTH_NAMES } from '@/constants'

/**
 * Indicator dot for calendar days (e.g., for plugins)
 */
export interface CalendarIndicator {
  id: string
  label: string
  color: string
}

/**
 * Custom day renderer function
 */
export interface DayRenderInfo {
  day: DayInfo
  isToday: boolean
  isSelected: boolean
  isInRange: boolean
  hasData: boolean
}

export interface DayCustomization {
  /** Background color for the day cell */
  backgroundColor?: string
  /** Border color */
  borderColor?: string
  /** Text content to display (in addition to day number) */
  content?: React.ReactNode
  /** Indicator dots to show at the bottom */
  indicators?: CalendarIndicator[]
  /** Custom CSS classes */
  className?: string
  /** Whether this day is disabled */
  disabled?: boolean
}

export interface MonthCalendarProps {
  /** Current year being displayed */
  year: number
  /** Current month being displayed (1-12) */
  month: number
  /** Month information with day data */
  monthInfo: MonthInfo
  /** ISO date string of today */
  todayISO: string
  /** Currently selected date (ISO string) */
  selectedDate?: string | null
  /** Date range constraints (optional) */
  startDate?: string
  endDate?: string
  /** Customization per day (keyed by ISO date) */
  dayCustomizations?: Record<string, DayCustomization>
  /** Navigation handlers */
  onPrevMonth: () => void
  onNextMonth: () => void
  onDayClick: (iso: string) => void
  /** Whether to render without card wrapper */
  noCard?: boolean
  /** Custom header content */
  headerContent?: React.ReactNode
  /** Footer content (e.g., legend) */
  footerContent?: React.ReactNode
  /** Test ID prefix for e2e tests */
  testIdPrefix?: string
}

export function MonthCalendar({
  year,
  month,
  monthInfo,
  todayISO,
  selectedDate,
  startDate,
  endDate,
  dayCustomizations = {},
  onPrevMonth,
  onNextMonth,
  onDayClick,
  noCard = false,
  headerContent,
  footerContent,
  testIdPrefix = 'month-calendar',
}: MonthCalendarProps) {
  const firstDayWeekdayIndex = monthInfo.days[0]?.weekdayIndex || 0
  const emptyCells = Array(firstDayWeekdayIndex).fill(null)

  // Check if a date is within the allowed date range
  const isDateInRange = (iso: string): boolean => {
    if (!startDate && !endDate) return true
    if (startDate && iso < startDate) return false
    if (endDate && iso > endDate) return false
    return true
  }

  const getDayClasses = (
    iso: string,
    isToday: boolean,
    isSelected: boolean,
    isInRange: boolean,
    customization?: DayCustomization,
  ): string => {
    const bg = customization?.backgroundColor || 'bg-white/[0.15]'
    const border = customization?.borderColor
      ? `border border-[${customization.borderColor}]`
      : 'border border-white/[0.08]'

    const todayRing = isToday
      ? 'ring-2 ring-[#007AFF] ring-offset-1 ring-offset-[#0a0a12]'
      : ''
    const selectedRing = isSelected
      ? 'ring-2 ring-[#AF52DE] ring-offset-2 ring-offset-[#0a0a12] shadow-[0_0_20px_rgba(175,82,222,0.3)]'
      : ''

    const outOfRange =
      !isInRange || customization?.disabled
        ? 'opacity-30 cursor-not-allowed'
        : 'cursor-pointer hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:scale-[1.05]'

    const customClasses = customization?.className || ''

    return `
      ${bg} ${border} ${todayRing} ${selectedRing} ${outOfRange} ${customClasses}
      aspect-square rounded-xl
      transition-all duration-200
      flex flex-col items-start justify-start p-2
      backdrop-blur-sm
    `
  }

  /**
   * Render indicator dots at the bottom of a day cell
   */
  const renderIndicators = (indicators?: CalendarIndicator[]) => {
    if (!indicators || indicators.length === 0) return null

    return (
      <div className="mt-auto w-full flex justify-center gap-1">
        {indicators.map((indicator) => (
          <div
            key={indicator.id}
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: indicator.color }}
            title={indicator.label}
          />
        ))}
      </div>
    )
  }

  const content = (
    <>
      {/* Month Navigation Header */}
      <div
        className="relative flex items-center justify-between pb-5 mb-5 gap-2"
        data-testid={`${testIdPrefix}-header`}
      >
        <button
          data-testid={`${testIdPrefix}-prev-month`}
          onClick={onPrevMonth}
          className="
            px-3 py-2
            bg-white/5 hover:bg-white/10
            border border-white/8 hover:border-white/15
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
          <h2
            className="text-base sm:text-lg font-semibold text-white/90 tracking-wide truncate"
            data-testid={`${testIdPrefix}-month-year`}
          >
            {MONTH_NAMES[month - 1]} {year}
          </h2>
        </div>
        <button
          data-testid={`${testIdPrefix}-next-month`}
          onClick={onNextMonth}
          className="
            px-3 py-2
            bg-white/5 hover:bg-white/10
            border border-white/8 hover:border-white/15
            text-white/70 hover:text-white
            rounded-xl font-medium text-sm
            transition-all duration-200
            hover:translate-x-0.5
          "
        >
          →
        </button>

        {/* Glass divider */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-white/10 to-transparent" />
      </div>

      {/* Custom header content (if provided) */}
      {headerContent && <div className="mb-4">{headerContent}</div>}

      {/* Weekday Labels */}
      <div
        className="grid grid-cols-7 gap-2 mb-3"
        data-testid={`${testIdPrefix}-weekdays`}
      >
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
      <div
        className="grid grid-cols-7 gap-2"
        data-testid={`${testIdPrefix}-days-grid`}
      >
        {emptyCells.map((_, index) => (
          <div key={`empty-${index}`} className="aspect-square" />
        ))}
        {monthInfo.days.map((day) => {
          const isToday = day.iso === todayISO
          const isSelected = day.iso === selectedDate
          const isInRange = isDateInRange(day.iso)
          const customization = dayCustomizations[day.iso]

          // Check if backgroundColor is a CSS color (hex, rgb, rgba) or a Tailwind class
          const bgColor = customization?.backgroundColor
          const isCssColor =
            bgColor?.startsWith('#') || bgColor?.startsWith('rgb')
          const bgClass = isCssColor ? '' : bgColor || 'bg-white/[0.15]'
          const bgStyle = isCssColor ? { backgroundColor: bgColor } : {}

          return (
            <div
              key={day.iso}
              data-testid={`${testIdPrefix}-day-${day.dayOfMonth}`}
              data-date={day.iso}
              data-selected={isSelected}
              data-today={isToday}
              onClick={() =>
                isInRange && !customization?.disabled && onDayClick(day.iso)
              }
              className={getDayClasses(
                day.iso,
                isToday,
                isSelected,
                isInRange,
                { ...customization, backgroundColor: bgClass },
              )}
              style={bgStyle}
            >
              <span className="text-sm font-medium">{day.dayOfMonth}</span>
              {customization?.content}
              {renderIndicators(customization?.indicators)}
            </div>
          )
        })}
      </div>

      {/* Footer content (e.g., legend) */}
      {footerContent && (
        <div className="mt-4 pt-3 border-t border-white/10">
          {footerContent}
        </div>
      )}
    </>
  )

  if (noCard) {
    return <div className="p-6">{content}</div>
  }

  return <Card className="p-6">{content}</Card>
}
