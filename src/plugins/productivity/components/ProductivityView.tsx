'use client'

import { useMemo, useState, useEffect } from 'react'
import type { AreaConfig, AreaEntry } from '@/plugins/productivity/types'
import type { YearViewConfig } from '@/types/year-view-config'
import { Card } from '@/components/ui'
import { GenericYearView } from '@/components/features/year-view/GenericYearView'
import { StatusSelector } from './StatusSelector'
import { AreaEntries } from './AreaEntries'
import { AreaManager } from './AreaManager'
import { computeMonthInfo } from '@/utils'

interface ProductivityViewProps {
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
  isTopicInUse: (areaId: string, topic: string) => boolean
  onJumpToDay?: (iso: string) => void
  initialSelectedDay?: string | null
}

export function ProductivityView({
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
  isTopicInUse,
  onJumpToDay,
  initialSelectedDay,
}: ProductivityViewProps) {
  const [showAreaManager, setShowAreaManager] = useState(false)
  
  // Track currently selected day for modal
  const [selectedDay, setSelectedDay] = useState<string | null>(initialSelectedDay || null)
  
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
        productivityNotes: '' 
      }
      console.log('[productivity] Initializing draft data for:', selectedDay, details)
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
        setSelectedDay(date)
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
        actions: [
          {
            id: 'manage-areas',
            label: 'Manage Areas',
            icon: '⚙️',
            onClick: () => setShowAreaManager(true),
          },
        ],
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
          return [
            {
              id: 'productivity',
              type: 'custom' as const,
              content: (
                <StatusSelector
                  value={draftData.status}
                  onChange={(newStatus) => {
                    console.log('[productivity] Status changed to:', newStatus)
                    setDraftData(prev => ({ ...prev, status: newStatus }))
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
                      setDraftData(prev => ({ ...prev, areas: newAreas }))
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
                      console.log('[productivity] Notes changed, length:', e.target.value.length)
                      setDraftData(prev => ({ ...prev, notes: e.target.value }))
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
                          productivityNotes: '' 
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
    }),
    [year, todayISO, yearStats, monthlyStats, months, dayDetails, areaConfigs, draftData, selectedDay, onUpdateDay, onAddArea, onAddTopic, isTopicInUse, onPrevYear, onNextYear, onJumpToDay],
  )

  return (
    <>
      <GenericYearView config={config} initialSelectedDay={initialSelectedDay} />
      
      {/* Area Manager Modal */}
      {showAreaManager && (
        <AreaManager
          areaConfigs={areaConfigs}
          onAddArea={onAddArea}
          onRemoveArea={onRemoveArea}
          onUpdateArea={onUpdateArea}
          onToggleHasTopics={onToggleHasTopics}
          onAddTopic={onAddTopic}
          onRemoveTopic={onRemoveTopic}
          onUpdateTopic={onUpdateTopic}
          isTopicInUse={isTopicInUse}
          onClose={() => setShowAreaManager(false)}
        />
      )}
    </>
  )
}
