'use client'

import { useMemo, useState } from 'react'
import type { DayDetails, TravelPlan } from '@/types'
import type { YearViewConfig } from '@/types/year-view-config'
import { Modal } from '@/components/ui'
import { GenericYearView } from './year-view/GenericYearView'
import { TravelForm } from './travel'
import {
  computeMonthInfo,
  enumerateDateRange,
  formatShortDate,
  isWeekend,
} from '@/utils'

interface YearViewProps {
  year: number
  todayISO: string
  dayDetails: Record<string, DayDetails>
  onPrevYear: () => void
  onNextYear: () => void
  onAddTravel: (travel: Omit<TravelPlan, 'id'>) => void | Promise<void>
  onUpdateDay: (iso: string, updates: Partial<DayDetails>) => Promise<void>
  onJumpToDay?: (iso: string) => void
}

export function YearView({
  year,
  todayISO,
  dayDetails,
  onPrevYear,
  onNextYear,
  onAddTravel,
  onUpdateDay,
  onJumpToDay,
}: YearViewProps) {
  const [showTravelModal, setShowTravelModal] = useState(false)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [removingPlanId, setRemovingPlanId] = useState<string | null>(null)
  const [editingTravel, setEditingTravel] = useState<TravelPlan | null>(null)
  const [isSavingTravel, setIsSavingTravel] = useState(false)
  const [prefilledDates, setPrefilledDates] = useState<{
    startDate: string
    endDate: string
  } | null>(null)

  const yearPrefix = `${year}-`

  const months = useMemo(
    () =>
      Array.from({ length: 12 }, (_, index) =>
        computeMonthInfo(year, index + 1),
      ),
    [year],
  )

  const travelEntries = useMemo(() => {
    const entries = Object.entries(dayDetails).filter(
      ([iso, details]) =>
        iso.startsWith(yearPrefix) && (details.travelPlans?.length || 0) > 0,
    )

    return entries
  }, [dayDetails, yearPrefix])

  const weekdayTravelCount = useMemo(
    () => travelEntries.filter(([iso]) => !isWeekend(iso)).length,
    [travelEntries],
  )

  const weekendTravelCount = travelEntries.length - weekdayTravelCount

  // Get travel plans for a specific month
  const getMonthTravels = (year: number, month: number) => {
    const monthStart = `${year}-${String(month).padStart(2, '0')}-01`
    const daysInMonth = new Date(year, month, 0).getDate()
    const monthEnd = `${year}-${String(month).padStart(2, '0')}-${String(
      daysInMonth,
    ).padStart(2, '0')}`

    // Get unique travel plans that have at least one day in this month
    const monthTravelMap = new Map<string, TravelPlan>()

    Object.entries(dayDetails).forEach(([iso, details]) => {
      if (iso >= monthStart && iso <= monthEnd) {
        const travels = details.travelPlans || []
        travels.forEach((travel) => {
          if (!monthTravelMap.has(travel.id)) {
            monthTravelMap.set(travel.id, travel)
          }
        })
      }
    })

    return Array.from(monthTravelMap.values())
  }

  const handleSaveTravel = async (formData: {
    title: string
    destination: string
    startDate: string
    endDate: string
    color: string
    note: string
  }) => {
    setIsSavingTravel(true)
    try {
      const dates = enumerateDateRange(formData.startDate, formData.endDate)
      const normalizedStart = dates[0]
      const normalizedEnd = dates[dates.length - 1]

      if (editingTravel) {
        // Update existing travel
        const updatedTravel: TravelPlan = {
          ...editingTravel,
          title: formData.title,
          startDate: normalizedStart,
          endDate: normalizedEnd,
          note: formData.note || undefined,
          color: formData.color || undefined,
          destination: formData.destination || undefined,
        }

        const oldDates = enumerateDateRange(
          editingTravel.startDate,
          editingTravel.endDate,
        )
        const newDates = dates

        const updates: Promise<void>[] = []

        // Remove from old dates
        oldDates.forEach((iso) => {
          const existing = dayDetails[iso]?.travelPlans || []
          const filtered = existing.filter((t) => t.id !== editingTravel.id)
          updates.push(onUpdateDay(iso, { travelPlans: filtered }))
        })

        // Add to new dates
        newDates.forEach((iso) => {
          const existing = dayDetails[iso]?.travelPlans || []
          const filtered = existing.filter((t) => t.id !== updatedTravel.id)
          updates.push(
            onUpdateDay(iso, { travelPlans: [...filtered, updatedTravel] }),
          )
        })

        await Promise.all(updates)

        setSelectedDay(updatedTravel.startDate)
      } else {
        // Create new travel
        await onAddTravel({
          title: formData.title,
          startDate: normalizedStart,
          endDate: normalizedEnd,
          note: formData.note || undefined,
          color: formData.color || undefined,
          destination: formData.destination || undefined,
        })
      }

      setShowTravelModal(false)
      setEditingTravel(null)
    } finally {
      setIsSavingTravel(false)
    }
  }

  const travelCountByMonth = useMemo(() => {
    const counts: Record<number, number> = {}
    travelEntries.forEach(([iso]) => {
      const month = Number(iso.slice(5, 7))
      counts[month] = (counts[month] || 0) + 1
    })
    return counts
  }, [travelEntries])

  const handleEditTravel = (travel: TravelPlan) => {
    setEditingTravel(travel)
    setPrefilledDates(null)
    setShowTravelModal(true)
  }

  const handleAddNewTravel = () => {
    setEditingTravel(null)
    setPrefilledDates(null)
    setShowTravelModal(true)
  }

  const handleAddTravelFromDay = (startDate: string) => {
    // Pre-fill dates without setting editingTravel (so it's treated as new)
    setEditingTravel(null)
    setPrefilledDates({ startDate, endDate: startDate })
    setSelectedDay(null) // Close the day modal
    setShowTravelModal(true)
  }

  const handleCloseTravelModal = () => {
    setShowTravelModal(false)
    setEditingTravel(null)
    setPrefilledDates(null)
  }

  const removeTravelForDay = async (iso: string, travelId: string) => {
    setIsUpdating(true)
    try {
      const existing = dayDetails[iso]?.travelPlans || []
      const filtered = existing.filter((t) => t.id !== travelId)
      await onUpdateDay(iso, { travelPlans: filtered })
    } finally {
      setIsUpdating(false)
    }
  }

  const removeTravelForTrip = async (travelId: string) => {
    setIsUpdating(true)
    try {
      const updates = Object.entries(dayDetails)
        .filter(([, details]) =>
          (details.travelPlans || []).some((t) => t.id === travelId),
        )
        .map(([iso, details]) => {
          const filtered = (details.travelPlans || []).filter(
            (t) => t.id !== travelId,
          )
          return onUpdateDay(iso, { travelPlans: filtered })
        })
      await Promise.all(updates)
      setSelectedDay(null)
    } finally {
      setIsUpdating(false)
    }
  }

  const removePlannedItem = async (iso: string, planId: string) => {
    setRemovingPlanId(planId)
    try {
      const items =
        dayDetails[iso]?.agendaItems || dayDetails[iso]?.plannedItems || []
      const filtered = items.filter((item) => item.id !== planId)
      await onUpdateDay(iso, { agendaItems: filtered, plannedItems: filtered })
    } finally {
      setRemovingPlanId(null)
    }
  }

  // Build year view configuration
  const config: YearViewConfig = useMemo(
    () => ({
      year,
      todayISO,
      header: {
        icon: '✈️',
        title: 'Travelling Year:',
        stats: [
          { label: 'Travel days', value: travelEntries.length },
          { label: 'Weekdays', value: weekdayTravelCount },
          { label: 'Weekends', value: weekendTravelCount },
        ],
        actions: [
          {
            id: 'add-travel',
            label: '+ Add travel',
            onClick: handleAddNewTravel,
            color: 'info' as const,
          },
        ],
      },
      months: months.map((month) => {
        const monthTravel = travelCountByMonth[month.month] || 0
        const monthTravels = getMonthTravels(year, month.month)

        return {
          month: month.month,
          year: month.year,
          headerRight: (
            <div className="text-xs text-white/50">
              {monthTravel} travel day{monthTravel === 1 ? '' : 's'}
            </div>
          ),
          days: month.days.map((day) => {
            const travels = dayDetails[day.iso]?.travelPlans || []
            return {
              iso: day.iso,
              dayOfMonth: day.dayOfMonth,
              weekdayIndex: day.weekdayIndex,
              indicators: travels.map((travel) => ({
                type: 'travel' as const,
                color: travel.color,
              })),
            }
          }),
          footer: monthTravels.map((travel) => ({
            id: travel.id,
            type: 'travel' as const,
            title: travel.title,
            subtitle: `${travel.destination ? `${travel.destination} • ` : ''}${formatShortDate(
              travel.startDate,
            )} → ${formatShortDate(travel.endDate)}`,
            color: travel.color,
            actionButton: {
              icon: '✏️',
              onClick: () => handleEditTravel(travel),
            },
          })),
        }
      }),
      modal: {
        getSections: (date: string) => {
          const travels = dayDetails[date]?.travelPlans || []
          const agendaItems =
            dayDetails[date]?.agendaItems || dayDetails[date]?.plannedItems || []

          const sections = []

          // Travel plans section
          if (travels.length > 0) {
            sections.push({
              id: 'travel-plans',
              type: 'custom' as const,
              content: (
                <div className="space-y-3">
                  {travels.map((travel) => (
                    <div
                      key={travel.id}
                      className="rounded-xl border border-white/10 bg-white/5 p-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold text-white">
                          {travel.title}
                        </div>
                        <span
                          className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/15 text-sm"
                          style={{
                            backgroundColor:
                              travel.color || 'rgba(14,165,233,0.25)',
                          }}
                        >
                          ✈️
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-white/60">
                        {travel.destination && (
                          <span>{travel.destination} • </span>
                        )}
                        {formatShortDate(travel.startDate)} →{' '}
                        {formatShortDate(travel.endDate)}
                      </div>
                      {travel.note && (
                        <div className="mt-2 text-xs text-white/60">
                          {travel.note}
                        </div>
                      )}
                      <div className="mt-3 flex flex-wrap gap-2 text-xs">
                        <button
                          onClick={() => {
                            handleEditTravel(travel)
                          }}
                          className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-white/80 hover:bg-white/10"
                        >
                          Edit travel
                        </button>
                        <button
                          onClick={() => removeTravelForDay(date, travel.id)}
                          disabled={isUpdating}
                          className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Remove this day
                        </button>
                        <button
                          onClick={() => removeTravelForTrip(travel.id)}
                          disabled={isUpdating}
                          className="px-3 py-1.5 rounded-lg border border-red-500/30 bg-red-500/10 text-red-200 hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Remove entire trip
                        </button>
                      </div>
                    </div>
                  ))}
                  {isUpdating && <span className="text-white/50">Updating…</span>}
                </div>
              ),
            })
          }

          // Agenda items section
          sections.push({
            id: 'agenda-items',
            type: 'custom' as const,
            content: (
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="text-sm font-semibold text-white mb-2">
                  Agenda items
                </div>
                {agendaItems.length ? (
                  <ul className="space-y-1 text-xs text-white/80">
                    {agendaItems.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-center gap-2 rounded-lg border border-white/5 bg-white/3 px-3 py-2"
                      >
                        <span className="h-2 w-2 rounded-full bg-white/70" />
                        <div className="flex-1">
                          <div className="font-medium text-white">
                            {item.title}
                          </div>
                          {(item.startTime || item.endTime || item.note) && (
                            <div className="text-[11px] text-white/60">
                              {item.startTime && item.endTime
                                ? `${item.startTime}–${item.endTime}`
                                : item.startTime || item.endTime || ''}
                              {item.note ? ` • ${item.note}` : ''}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => removePlannedItem(date, item.id)}
                          disabled={removingPlanId === item.id}
                          className="text-white/60 hover:text-white text-[11px] px-2 py-1 rounded-lg hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {removingPlanId === item.id ? 'Removing…' : 'Remove'}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-xs text-white/60">
                    No plans for this day.
                  </div>
                )}
              </div>
            ),
          })

          return sections
        },
        getActions: (date: string) => {
          const actions = [
            {
              id: 'add-travel',
              label: 'Add travel plan',
              icon: '✈️',
              onClick: () => handleAddTravelFromDay(date),
              color: 'info' as const,
            },
          ]

          if (onJumpToDay) {
            actions.push({
              id: 'open-day',
              label: 'Open day view',
              onClick: () => onJumpToDay(date),
              color: 'secondary' as const,
            })
          }

          return actions
        },
      },
      onPrevYear,
      onNextYear,
    }),
    [
      year,
      todayISO,
      travelEntries.length,
      weekdayTravelCount,
      weekendTravelCount,
      months,
      travelCountByMonth,
      dayDetails,
      isUpdating,
      removingPlanId,
      onPrevYear,
      onNextYear,
      onJumpToDay,
    ],
  )

  return (
    <>
      <GenericYearView config={config} />


      <Modal
        open={showTravelModal}
        title={editingTravel ? 'Edit travel' : 'Add travel'}
        onClose={handleCloseTravelModal}
      >
        <TravelForm
          initialData={
            editingTravel
              ? editingTravel
              : prefilledDates
              ? {
                  startDate: prefilledDates.startDate,
                  endDate: prefilledDates.endDate,
                }
              : undefined
          }
          onSubmit={handleSaveTravel}
          onCancel={handleCloseTravelModal}
          isSubmitting={isSavingTravel}
        />
      </Modal>
    </>
  )
}
