'use client'

import { useMemo, useState, useEffect } from 'react'
import type { AreaConfig, AreaEntry, StreakType } from '../types'
import type { YearViewConfig } from '@goal-chaser/sdk'
import { GenericYearView } from '@goal-chaser/sdk'
import { StatusSelector } from './StatusSelector'
import { AreaEntries } from './AreaEntries'
import { AreaManager } from './AreaManager'
import { AreaFilter } from './AreaFilter'
import { computeMonthInfo } from '@goal-chaser/sdk'

interface ProductivityYearViewProps {
  year: number
  todayISO: string
  dayDetails: Record<string, any>
  areaConfigs: AreaConfig[]
  onPrevYear: () => void
  onNextYear: () => void
  onUpdateDay: (iso: string, updates: any) => Promise<void>
  onAddArea: (name: string) => void
  onRemoveArea: (id: string) => void
  onUpdateArea: (id: string, name: string) => void
  onToggleHasTopics: (id: string) => void
  onAddTopic: (areaId: string, topic: string) => void
  onRemoveTopic: (areaId: string, topic: string) => void
  onUpdateTopic: (areaId: string, oldTopic: string, newTopic: string) => void
  onUpdateAreaGoal: (id: string, streakType: StreakType, targetFrequency?: number) => void
  onToggleTrackStreaks: (id: string) => void
  isTopicInUse: (areaId: string, topic: string) => boolean
  onJumpToDay?: (iso: string) => void
  onMonthClick?: (year: number, month: number) => void
  initialSelectedDay?: string | null
  selectedAreas: Set<string>
  onToggleArea: (areaId: string) => void
  onSelectAllAreas: () => void
  onClearAllAreas: () => void
}

export function ProductivityYearView({
  year,
  todayISO,
  dayDetails,
  areaConfigs,
  onPrevYear,
  onNextYear,
  onUpdateDay,
  onAddArea,
  onRemoveArea,
  onUpdateArea,
  onToggleHasTopics,
  onAddTopic,
  onRemoveTopic,
  onUpdateTopic,
  onUpdateAreaGoal,
  onToggleTrackStreaks,
  isTopicInUse,
  onJumpToDay,
  onMonthClick,
  initialSelectedDay,
  selectedAreas,
  onToggleArea,
  onSelectAllAreas,
  onClearAllAreas,
}: ProductivityYearViewProps) {
  const [showAreaManager, setShowAreaManager] = useState(false)

  // Track currently selected day for modal
  const [selectedDay] = useState<string | null>(initialSelectedDay || null)

  // Draft state for modal editing
  const [draftData, setDraftData] = useState<{
    status: number | null
    areas: AreaEntry[]
    notes: string
  }>({
    status: null,
    areas: [],
    notes: '',
  })

  // Initialize draft data when modal opens with a new day
  useEffect(() => {
    if (selectedDay) {
      const details = dayDetails[selectedDay] || {
        status: null,
        areas: [],
        productivityNotes: '',
      }
      console.log(
        '[productivity] Initializing draft data for:',
        selectedDay,
        details,
      )
      setDraftData({
        status: details.status,
        areas: details.areas || [],
        notes: details.productivityNotes || '',
      })
    }
  }, [selectedDay, dayDetails])

  const yearPrefix = `${year}-`

  const months = useMemo(
    () => Array.from({ length: 12 }, (_, i) => computeMonthInfo(year, i + 1)),
    [year],
  )

  // Calculate stats for the year
  const yearStats = useMemo(() => {
    const entries = Object.entries(dayDetails).filter(
      ([iso, details]) => iso.startsWith(yearPrefix) && details.status !== null,
    )

    const total = entries.length
    const high = entries.filter(([_, d]) => (d.status || 0) >= 7).length
    const medium = entries.filter(([_, d]) => {
      const s = d.status || 0
      return s >= 4 && s < 7
    }).length
    const low = entries.filter(
      ([_, d]) => (d.status || 0) < 4 && (d.status || 0) > 0,
    ).length

    const average =
      total > 0
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
      const average =
        total > 0
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
        // Navigate directly to month view, don't open modal
        if (date && onJumpToDay) {
          onJumpToDay(date)
        }
      },
      showDayModal: false, // Don't show modal on day click, navigate to month view instead
      header: undefined, // Header is rendered at parent level
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
            const dayData = dayDetails[day.iso]
            const status = dayData?.status
            
            // Check if day has any selected areas (plugin logic)
            const hasSelectedArea = selectedAreas.size === areaConfigs.length || // All selected
              dayData?.areas?.some((entry: any) => {
                const areaConfig = areaConfigs.find(a => a.name === entry.area)
                return areaConfig && selectedAreas.has(areaConfig.id)
              })
            
            // Calculate opacity (plugin decides)
            const opacity = hasSelectedArea ? 1.0 : 0.3
            
            return {
              iso: day.iso,
              dayOfMonth: day.dayOfMonth,
              weekdayIndex: day.weekdayIndex,
              highlighted: status !== null && status !== undefined,
              highlightColor: getProductivityColor(status),
              style: { opacity, transition: 'opacity 0.2s ease-in-out' },
              indicators: [],
            }
          }),
          footer: [],
        }
      }),
      modal: {
        getSections: (date: string) => {
          return [
            {
              id: 'productivity',
              type: 'custom' as const,
              content: (
                <StatusSelector
                  value={draftData.status}
                  onChange={(newStatus) => {
                    console.log('[productivity] Status changed to:', newStatus)
                    setDraftData((prev) => ({ ...prev, status: newStatus }))
                  }}
                />
              ),
            },
            {
              id: 'areas',
              type: 'custom' as const,
              content: (
                <div className="space-y-3">
                  <AreaEntries
                    currentAreas={draftData.areas}
                    areaConfigs={areaConfigs}
                    availableAreas={areaConfigs.map((a) => a.name)}
                    selectedDate={date}
                    onUpdateAreas={(newAreas) => {
                      console.log('[productivity] Areas changed to:', newAreas)
                      setDraftData((prev) => ({ ...prev, areas: newAreas }))
                    }}
                    onAddArea={onAddArea}
                    onAddTopic={onAddTopic}
                    isTopicInUse={isTopicInUse}
                  />
                  <button
                    onClick={() => setShowAreaManager(true)}
                    className="w-full px-4 py-2.5 rounded-xl text-sm bg-white/[0.02] text-white/60 hover:bg-white/[0.05] hover:text-white/80 border border-dashed border-white/[0.1] hover:border-white/[0.2] transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <span>⚙️</span>
                    <span>Manage Areas & Topics</span>
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
                    value={draftData.notes}
                    onChange={(e) => {
                      console.log(
                        '[productivity] Notes changed, length:',
                        e.target.value.length,
                      )
                      setDraftData((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }}
                    placeholder="Add productivity notes for this day..."
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
            {
              id: 'actions',
              type: 'custom' as const,
              content: (
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      // Reset draft to current saved data
                      if (selectedDay) {
                        const details = dayDetails[selectedDay] || {
                          status: null,
                          areas: [],
                          productivityNotes: '',
                        }
                        setDraftData({
                          status: details.status,
                          areas: details.areas || [],
                          notes: details.productivityNotes || '',
                        })
                        console.log('[productivity] Changes cancelled')
                      }
                    }}
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm bg-white/[0.05] text-white/60 hover:bg-white/[0.08] hover:text-white/80 border border-white/10 transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      console.log('[productivity] Saving data:', {
                        date,
                        status: draftData.status,
                        areas: draftData.areas,
                        productivityNotes: draftData.notes,
                      })

                      await onUpdateDay(date, {
                        status: draftData.status,
                        areas: draftData.areas,
                        productivityNotes: draftData.notes,
                      })

                      console.log('[productivity] Save complete')
                    }}
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm bg-[#007AFF] text-white hover:bg-[#0066DD] border border-[#007AFF] transition-all duration-200 font-medium"
                  >
                    Save Changes
                  </button>
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
      onMonthClick, // Enable month header clicks to navigate to month view
    }),
    [
      year,
      todayISO,
      monthlyStats,
      months,
      dayDetails,
      areaConfigs,
      draftData,
      selectedDay,
      onUpdateDay,
      onAddArea,
      onAddTopic,
      isTopicInUse,
      onPrevYear,
      onNextYear,
      onJumpToDay,
      onMonthClick,
    ],
  )

  return (
    <>
      <GenericYearView
        config={config}
        initialSelectedDay={initialSelectedDay}
        filterComponent={
          <AreaFilter
            areas={areaConfigs}
            selectedAreas={selectedAreas}
            onToggleArea={onToggleArea}
            onSelectAllAreas={onSelectAllAreas}
            onClearAllAreas={onClearAllAreas}
          />
        }
      />

      {/* Area Manager Modal */}
      {showAreaManager && (
        <AreaManager
          isOpen={showAreaManager}
          areaConfigs={areaConfigs}
          onAddArea={onAddArea}
          onRemoveArea={onRemoveArea}
          onUpdateArea={onUpdateArea}
          onToggleHasTopics={onToggleHasTopics}
          onAddTopic={onAddTopic}
          onRemoveTopic={onRemoveTopic}
          onUpdateTopic={onUpdateTopic}
          onUpdateAreaGoal={onUpdateAreaGoal}
          onToggleTrackStreaks={onToggleTrackStreaks}
          isTopicInUse={isTopicInUse}
          onClose={() => setShowAreaManager(false)}
        />
      )}
    </>
  )
}
