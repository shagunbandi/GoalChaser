'use client'

import { useMemo, useState } from 'react'
import type { SubjectEntry, SubjectConfig } from '@/plugins/hours/types'
import type { YearViewConfig } from '@/types/year-view-config'
import { GenericYearView } from '@/components/features/year-view/GenericYearView'
import { HoursSummary } from './HoursSummary'
import { SubjectEntries } from './SubjectEntries'
import { SubjectManager } from './SubjectManager'
import { computeMonthInfo } from '@/utils'

interface HoursViewProps {
  year: number
  todayISO: string
  dayDetails: Record<string, any>
  subjectConfigs: SubjectConfig[]
  maxHours: 8 | 14 | 18
  onPrevYear: () => void
  onNextYear: () => void
  onUpdateDay: (iso: string, updates: any) => Promise<void>
  onAddSubject: (name: string) => void
  onRemoveSubject: (id: string) => void
  onUpdateSubject: (id: string, name: string) => void
  onToggleHasTopics: (id: string) => void
  onAddTopic: (subjectId: string, topic: string) => void
  onRemoveTopic: (subjectId: string, topic: string) => void
  onUpdateTopic: (subjectId: string, oldTopic: string, newTopic: string) => void
  isTopicInUse: (subjectId: string, topic: string) => boolean
  onJumpToDay?: (iso: string) => void
  onMonthClick?: (year: number, month: number) => void
  initialSelectedDay?: string | null
}

export function HoursView({
  year,
  todayISO,
  dayDetails,
  subjectConfigs,
  maxHours,
  onPrevYear,
  onNextYear,
  onMonthClick,
  onUpdateDay,
  onAddSubject,
  onRemoveSubject,
  onUpdateSubject,
  onToggleHasTopics,
  onAddTopic,
  onRemoveTopic,
  onUpdateTopic,
  isTopicInUse,
  onJumpToDay,
  initialSelectedDay,
}: HoursViewProps) {
  const [showSubjectManager, setShowSubjectManager] = useState(false)
  const yearPrefix = `${year}-`

  const months = useMemo(
    () => Array.from({ length: 12 }, (_, i) => computeMonthInfo(year, i + 1)),
    [year],
  )

  // Calculate total hours for a day
  const getTotalHours = (details: any): number => {
    const subjectHours = (details.subjects || []).reduce(
      (sum: number, entry: any) => sum + (entry.hours || 0),
      0,
    )
    return subjectHours > 0 ? subjectHours : details.directHours || 0
  }

  // Calculate stats for the year
  const yearStats = useMemo(() => {
    const entries = Object.entries(dayDetails).filter(([iso]) =>
      iso.startsWith(yearPrefix),
    )

    const daysWithHours = entries.filter(([_, d]) => getTotalHours(d) > 0)
    const totalHours = entries.reduce(
      (sum, [_, d]) => sum + getTotalHours(d),
      0,
    )
    const average =
      daysWithHours.length > 0 ? totalHours / daysWithHours.length : 0

    return {
      totalHours,
      daysWithHours: daysWithHours.length,
      average,
    }
  }, [dayDetails, yearPrefix])

  // Calculate monthly stats
  const monthlyStats = useMemo(() => {
    const stats: Record<number, { total: number; days: number }> = {}

    months.forEach((month) => {
      const entries = Object.entries(dayDetails).filter(([iso]) => {
        const [y, m] = iso.split('-')
        return parseInt(y) === year && parseInt(m) === month.month
      })

      const total = entries.reduce((sum, [_, d]) => sum + getTotalHours(d), 0)
      const days = entries.filter(([_, d]) => getTotalHours(d) > 0).length

      stats[month.month] = { total, days }
    })

    return stats
  }, [dayDetails, year, months])

  // Get color based on hours using VIBGYOR scale (same as month view)
  const getHoursColor = (hours: number) => {
    if (hours === 0) return undefined
    
    // Use VIBGYOR color scale
    const { getVibgyorColors } = require('@/utils')
    const vibgyorColors = getVibgyorColors()
    
    const ratio = Math.min(hours / maxHours, 1)
    const colorIndex = Math.min(
      Math.floor(ratio * vibgyorColors.length),
      vibgyorColors.length - 1
    )
    const hexColor = vibgyorColors[colorIndex].color
    
    // Return with 80% opacity (CC in hex)
    return `${hexColor}CC`
  }

  const config: YearViewConfig = useMemo(
    () => ({
      year,
      todayISO,
      onDaySelect: (date: string | null) => {
        // Navigate directly to month view, don't open modal
        if (date && onJumpToDay) {
          onJumpToDay(date)
        }
      },
      showDayModal: false, // Don't show modal on day click, navigate to month view instead
      header: {
        icon: '⏱️',
        title: 'Hours Year:',
        stats: [
          { label: 'Total hours', value: Math.round(yearStats.totalHours) },
          { label: 'Days tracked', value: yearStats.daysWithHours },
          {
            label: 'Avg/day',
            value: yearStats.average.toFixed(1) + 'h',
            color: '#5856D6',
          },
        ],
        legends: [
          { label: `Target: ${maxHours}h/day`, color: 'rgb(155, 89, 182)' },
          { label: 'Progress: VIBGYOR scale', color: 'rgb(52, 152, 219)' },
        ],
        actions: [
          {
            id: 'manage-subjects',
            label: 'Manage Subjects',
            icon: '⚙️',
            onClick: () => setShowSubjectManager(true),
          },
        ],
      },
      months: months.map((month) => {
        const stats = monthlyStats[month.month]

        return {
          month: month.month,
          year: month.year,
          onHeaderClick: () => onMonthClick?.(month.year, month.month), // Navigate to month view
          headerRight: (
            <div className="text-xs text-white/50">
              {stats.total > 0 ? (
                <>
                  {stats.days} day{stats.days === 1 ? '' : 's'} •{' '}
                  {Math.round(stats.total)}h
                </>
              ) : (
                'No data'
              )}
            </div>
          ),
          days: month.days.map((day) => {
            const details = dayDetails[day.iso]
            const hours = details ? getTotalHours(details) : 0
            return {
              iso: day.iso,
              dayOfMonth: day.dayOfMonth,
              weekdayIndex: day.weekdayIndex,
              highlighted: hours > 0,
              highlightColor: getHoursColor(hours),
              indicators: [],
            }
          }),
          footer: [],
        }
      }),
      modal: {
        getSections: (date: string) => {
          const details = dayDetails[date] || {
            status: null,
            subject: '',
            topic: '',
            note: '',
            subjects: [],
            directHours: 0,
          }

          const subjectHours = (details.subjects || []).reduce(
            (sum: number, entry: any) => sum + (entry.hours || 0),
            0,
          )
          const totalHours =
            subjectHours > 0 ? subjectHours : details.directHours || 0

          return [
            {
              id: 'hours',
              type: 'custom' as const,
              content: (
                <HoursSummary
                  totalHours={totalHours}
                  subjectHours={subjectHours}
                  directHours={details.directHours || 0}
                  maxHours={maxHours}
                  onDirectHoursChange={async (hours) => {
                    await onUpdateDay(date, { directHours: hours })
                  }}
                />
              ),
            },
            {
              id: 'subjects',
              type: 'custom' as const,
              content: (
                <div className="space-y-4">
                  <div className="text-sm font-medium text-white/60 mb-2">
                    Track by Subject
                  </div>
                  <SubjectEntries
                    currentSubjects={details.subjects || []}
                    subjectConfigs={subjectConfigs}
                    availableSubjects={subjectConfigs.map((s) => s.name)}
                    selectedDate={date}
                    totalHours={totalHours}
                    onUpdateSubjects={async (newSubjects: SubjectEntry[]) => {
                      await onUpdateDay(date, { subjects: newSubjects })
                    }}
                    onAddSubject={onAddSubject}
                    onAddTopic={onAddTopic}
                    isTopicInUse={isTopicInUse}
                  />
                  <button
                    onClick={() => setShowSubjectManager(true)}
                    className="
                      w-full px-4 py-2.5 rounded-xl text-sm
                      bg-white/[0.02] text-white/60
                      hover:bg-white/[0.05] hover:text-white/80
                      border border-dashed border-white/[0.1] hover:border-white/[0.2]
                      transition-all duration-200
                      flex items-center justify-center gap-2
                    "
                  >
                    <span>⚙️</span>
                    <span>Manage Subjects & Topics</span>
                  </button>
                </div>
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
      onMonthClick,
    }),
    [
      year,
      todayISO,
      yearStats,
      monthlyStats,
      months,
      dayDetails,
      subjectConfigs,
      maxHours,
      onUpdateDay,
      onAddSubject,
      onRemoveSubject,
      onUpdateSubject,
      onToggleHasTopics,
      onAddTopic,
      onRemoveTopic,
      onUpdateTopic,
      isTopicInUse,
      onPrevYear,
      onNextYear,
      onMonthClick,
      onJumpToDay,
      showSubjectManager,
    ],
  )

  return (
    <>
      <GenericYearView
        config={config}
        initialSelectedDay={initialSelectedDay}
      />
      {showSubjectManager && (
        <SubjectManager
          isOpen={showSubjectManager}
          subjectConfigs={subjectConfigs}
          onAddSubject={onAddSubject}
          onRemoveSubject={onRemoveSubject}
          onUpdateSubject={onUpdateSubject}
          onToggleHasTopics={onToggleHasTopics}
          onAddTopic={onAddTopic}
          onRemoveTopic={onRemoveTopic}
          onUpdateTopic={onUpdateTopic}
          isTopicInUse={isTopicInUse}
          onClose={() => setShowSubjectManager(false)}
        />
      )}
    </>
  )
}
