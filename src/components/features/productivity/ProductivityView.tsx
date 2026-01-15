'use client'

import { useMemo } from 'react'
import type { DayDetails } from '@/types'
import type { YearViewConfig } from '@/types/year-view-config'
import { Card } from '@/components/ui'
import { GenericYearView } from '../year-view/GenericYearView'
import { StatusSelector } from '../StatusSelector'
import { computeMonthInfo } from '@/utils'

interface ProductivityViewProps {
  year: number
  todayISO: string
  dayDetails: Record<string, DayDetails>
  onPrevYear: () => void
  onNextYear: () => void
  onUpdateDay: (iso: string, updates: Partial<DayDetails>) => Promise<void>
  onJumpToDay?: (iso: string) => void
  initialSelectedDay?: string | null
}

export function ProductivityView({
  year,
  todayISO,
  dayDetails,
  onPrevYear,
  onNextYear,
  onUpdateDay,
  onJumpToDay,
  initialSelectedDay,
}: ProductivityViewProps) {
  const yearPrefix = `${year}-`

  const months = useMemo(
    () => Array.from({ length: 12 }, (_, i) => computeMonthInfo(year, i + 1)),
    [year],
  )

  // Calculate stats for the year
  const yearStats = useMemo(() => {
    const entries = Object.entries(dayDetails).filter(([iso, details]) =>
      iso.startsWith(yearPrefix) && details.status !== null
    )

    const total = entries.length
    const high = entries.filter(([_, d]) => (d.status || 0) >= 7).length
    const medium = entries.filter(([_, d]) => {
      const s = d.status || 0
      return s >= 4 && s < 7
    }).length
    const low = entries.filter(([_, d]) => (d.status || 0) < 4 && (d.status || 0) > 0).length

    const average = total > 0
      ? entries.reduce((sum, [_, d]) => sum + (d.status || 0), 0) / total
      : 0

    return { total, high, medium, low, average }
  }, [dayDetails, yearPrefix])

  // Calculate monthly stats
  const monthlyStats = useMemo(() => {
    const stats: Record<number, { total: number; average: number }> = {}

    months.forEach((month) => {
      const entries = Object.entries(dayDetails).filter(([iso, details]) => {
        const [y, m] = iso.split('-')
        return (
          parseInt(y) === year &&
          parseInt(m) === month.month &&
          details.status !== null
        )
      })

      const total = entries.length
      const average = total > 0
        ? entries.reduce((sum, [_, d]) => sum + (d.status || 0), 0) / total
        : 0

      stats[month.month] = { total, average }
    })

    return stats
  }, [dayDetails, year, months])

  // Get color based on productivity score
  const getProductivityColor = (status: number | null) => {
    if (status === null || status === 0) return undefined
    if (status >= 7) return 'rgba(48, 209, 88, 0.8)' // Green
    if (status >= 4) return 'rgba(255, 149, 0, 0.8)' // Orange
    return 'rgba(255, 69, 58, 0.8)' // Red
  }

  const config: YearViewConfig = useMemo(
    () => ({
      year,
      todayISO,
      onDaySelect: (date: string | null) => {
        if (date && onJumpToDay) {
          onJumpToDay(date)
        }
      },
      header: {
        icon: '📊',
        title: 'Productivity Year:',
        stats: [
          { label: 'Tracked days', value: yearStats.total },
          { label: 'High days', value: yearStats.high, color: '#30D158' },
          { label: 'Average', value: yearStats.average.toFixed(1), color: '#FF9500' },
        ],
        legends: [
          { label: 'High (7-10)', color: 'rgb(48, 209, 88)' },
          { label: 'OK (4-6)', color: 'rgb(255, 149, 0)' },
          { label: 'Low (1-3)', color: 'rgb(255, 69, 58)' },
        ],
        actions: [],
      },
      months: months.map((month) => {
        const stats = monthlyStats[month.month]

        return {
          month: month.month,
          year: month.year,
          headerRight: (
            <div className="text-xs text-white/50">
              {stats.total > 0 ? (
                <>
                  {stats.total} day{stats.total === 1 ? '' : 's'} •{' '}
                  <span style={{ color: getProductivityColor(stats.average) }}>
                    {stats.average.toFixed(1)}
                  </span>
                </>
              ) : (
                'No data'
              )}
            </div>
          ),
          days: month.days.map((day) => {
            const status = dayDetails[day.iso]?.status
            return {
              iso: day.iso,
              dayOfMonth: day.dayOfMonth,
              weekdayIndex: day.weekdayIndex,
              highlighted: status !== null && status !== undefined,
              highlightColor: getProductivityColor(status),
              indicators: [],
            }
          }),
          footer: [],
        }
      }),
      modal: {
        getSections: (date: string) => {
          const details = dayDetails[date] || { status: null, subject: '', topic: '', note: '' }

          return [
            {
              id: 'productivity',
              type: 'custom' as const,
              content: (
                <StatusSelector
                  value={details.status}
                  onChange={async (newStatus) => {
                    await onUpdateDay(date, { status: newStatus })
                  }}
                />
              ),
            },
            {
              id: 'notes',
              type: 'custom' as const,
              content: (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-white/60">
                    Notes
                  </label>
                  <textarea
                    value={details.note || ''}
                    onChange={(e) => {
                      onUpdateDay(date, { note: e.target.value })
                    }}
                    placeholder="Add notes about your day..."
                    className="
                      w-full min-h-[100px] px-4 py-3
                      bg-white/5 border border-white/10
                      rounded-xl text-white placeholder-white/30
                      focus:outline-none focus:ring-2 focus:ring-[#007AFF]/50
                      resize-none
                    "
                  />
                </div>
              ),
            },
          ]
        },
        getActions: (date: string) => {
          return []
        },
      },
      onPrevYear,
      onNextYear,
    }),
    [year, todayISO, yearStats, monthlyStats, months, dayDetails, onUpdateDay, onPrevYear, onNextYear, onJumpToDay],
  )

  return <GenericYearView config={config} initialSelectedDay={initialSelectedDay} />
}
