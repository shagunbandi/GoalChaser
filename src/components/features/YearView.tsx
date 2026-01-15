'use client'

import { useMemo, useState } from 'react'
import type { DayDetails, TravelPlan } from '@/types'
import { Card, Modal } from '@/components/ui'
import { YearViewHeader } from './YearViewHeader'
import { MonthCard } from './MonthCard'
import { TravelCard, TravelForm } from './travel'
import { WEEKDAY_LABELS } from '@/constants'
import {
  computeMonthInfo,
  enumerateDateRange,
  formatShortDate,
  formatDateDisplay,
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

interface TravelSummary extends TravelPlan {
  days: string[]
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

  const travelPlans: TravelSummary[] = useMemo(() => {
    const map = new Map<string, TravelSummary>()

    // Check ALL dayDetails, not just filtered travelEntries
    Object.entries(dayDetails).forEach(([iso, details]) => {
      const travels = details.travelPlans || []
      travels.forEach((travel) => {
        const existing = map.get(travel.id)
        if (existing) {
          existing.days.push(iso)
        } else {
          map.set(travel.id, {
            ...travel,
            days: [iso],
          })
        }
      })
    })

    // Filter to only show travel plans that have at least one day in current year
    const plans = Array.from(map.values())
      .filter((plan) => plan.days.some((iso) => iso.startsWith(yearPrefix)))
      .map((plan) => ({
        ...plan,
        days: plan.days.sort(),
      }))

    return plans
  }, [dayDetails, yearPrefix])

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
      const items = dayDetails[iso]?.agendaItems || dayDetails[iso]?.plannedItems || []
      const filtered = items.filter((item) => item.id !== planId)
      await onUpdateDay(iso, { agendaItems: filtered, plannedItems: filtered })
    } finally {
      setRemovingPlanId(null)
    }
  }

  return (
    <>
      <YearViewHeader
        icon="✈️"
        title="Travelling Year:"
        year={year}
        stats={[
          { label: 'Travel days', value: travelEntries.length },
          { label: 'Weekdays', value: weekdayTravelCount },
          { label: 'Weekends', value: weekendTravelCount },
        ]}
        actions={[{ label: '+ Add travel', onClick: handleAddNewTravel }]}
        onPrevYear={onPrevYear}
        onNextYear={onNextYear}
      />

      <Card className="p-6">
        {/* Calendar Grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 md:auto-rows-fr">
          {months.map((month) => {
            const monthTravel = travelCountByMonth[month.month] || 0
            const monthTravels = getMonthTravels(year, month.month)

            return (
              <MonthCard
                key={month.month}
                month={month}
                todayISO={todayISO}
                headerRight={
                  <div className="text-xs text-white/50">
                    {monthTravel} travel day{monthTravel === 1 ? '' : 's'}
                  </div>
                }
                renderDay={(day) => {
                  const travels = dayDetails[day.iso]?.travelPlans || []
                  const agendaCount =
                    (dayDetails[day.iso]?.agendaItems ||
                      dayDetails[day.iso]?.plannedItems ||
                      []).length
                  const isToday = day.iso === todayISO
                  const hasTravel = travels.length > 0
                  const hasMultipleTravels = travels.length > 1

                  return (
                    <button
                      key={day.iso}
                      onClick={() => setSelectedDay(day.iso)}
                      className={`
                        h-8 rounded-lg text-[11px] font-medium
                        border relative flex flex-col items-center justify-center gap-0.5 py-1
                        transition-all duration-150
                        ${
                          hasTravel
                            ? 'border-white/15 bg-white/8 text-white shadow-[0_0_8px_rgba(255,255,255,0.1)]'
                            : 'border-white/[0.07] bg-transparent text-white/70 hover:border-white/12 hover:bg-white/4'
                        }
                        ${
                          isToday
                            ? 'ring-2 ring-[#007AFF] ring-offset-1 ring-offset-[#1a1a2e]'
                            : ''
                        }
                        ${hasMultipleTravels ? 'ring-1 ring-yellow-500/40' : ''}
                      `}
                      title={
                        travels.length
                          ? travels.map((t) => t.title).join(' • ')
                          : undefined
                      }
                    >
                      <span>{day.dayOfMonth}</span>

                      {/* Travel dots below the number */}
                      {travels.length > 0 && (
                        <div className="flex gap-0.5 items-center">
                          {travels.slice(0, 3).map((t) => (
                            <span
                              key={t.id}
                              className="h-1 w-1 rounded-full ring-1 ring-black/20"
                              style={{
                                backgroundColor:
                                  t.color || 'rgba(14,165,233,0.9)',
                              }}
                              title={t.title}
                            />
                          ))}
                          {travels.length > 3 && (
                            <span className="text-[7px] font-bold text-white/80 leading-none ml-0.5">
                              +{travels.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Agenda items indicator at the bottom */}
                      {agendaCount > 0 && !hasTravel && (
                        <span
                          className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5"
                          title={`${agendaCount} agenda item${
                            agendaCount === 1 ? '' : 's'
                          }`}
                        >
                          {Array.from({
                            length: Math.min(agendaCount, 3),
                          }).map((_, idx) => (
                            <span
                              key={idx}
                              className="h-1 w-1 rounded-full bg-white/60"
                            />
                          ))}
                          {agendaCount > 3 && (
                            <span className="text-[7px] text-white/50 leading-none">
                              +
                            </span>
                          )}
                        </span>
                      )}
                    </button>
                  )
                }}
                footerContent={
                  monthTravels.length > 0 ? (
                    <div className="space-y-2">
                      <div className="text-[10px] text-white/50 mb-1.5 font-medium uppercase tracking-wide">
                        ✈️ Travel Plans
                      </div>
                      <div className="space-y-1.5">
                        {monthTravels.map((travel) => (
                          <div
                            key={travel.id}
                            className="flex items-center gap-2 text-[11px]"
                          >
                            <div
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                              style={{
                                backgroundColor:
                                  travel.color || 'rgba(14,165,233,0.9)',
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-white/80 truncate">
                                {travel.title}
                              </div>
                              <div className="text-[10px] text-white/60">
                                {travel.destination && (
                                  <span>{travel.destination} • </span>
                                )}
                                {formatShortDate(travel.startDate)} →{' '}
                                {formatShortDate(travel.endDate)}
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEditTravel(travel)
                              }}
                              className="p-1 rounded hover:bg-white/10 text-white/60 hover:text-white/90 transition-colors"
                              title="Edit Travel"
                            >
                              ✏️
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-[11px] text-white/40">
                      No travel plans
                    </div>
                  )
                }
              />
            )
          })}
        </div>
      </Card>

      <Modal
        open={!!selectedDay}
        onClose={() => setSelectedDay(null)}
        title={selectedDay ? formatDateDisplay(selectedDay) : 'Day details'}
      >
        {selectedDay && (
          <div className="space-y-3">
            {(dayDetails[selectedDay]?.travelPlans || []).length > 0 && (
              <div className="space-y-3">
                {(dayDetails[selectedDay]?.travelPlans || []).map((travel) => (
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
                          setSelectedDay(null)
                          handleEditTravel(travel)
                        }}
                        className="
                          px-3 py-1.5 rounded-lg border border-white/10
                          bg-white/5 text-white/80 hover:bg-white/10
                        "
                      >
                        Edit travel
                      </button>
                      <button
                        onClick={() =>
                          removeTravelForDay(selectedDay, travel.id)
                        }
                        disabled={isUpdating}
                        className="
                          px-3 py-1.5 rounded-lg border border-white/10
                          bg-white/5 text-white/80 hover:bg-white/10
                          disabled:opacity-50 disabled:cursor-not-allowed
                        "
                      >
                        Remove this day
                      </button>
                      <button
                        onClick={() => removeTravelForTrip(travel.id)}
                        disabled={isUpdating}
                        className="
                          px-3 py-1.5 rounded-lg border border-red-500/30
                          bg-red-500/10 text-red-200 hover:bg-red-500/20
                          disabled:opacity-50 disabled:cursor-not-allowed
                        "
                      >
                        Remove entire trip
                      </button>
                    </div>
                  </div>
                ))}
                {isUpdating && <span className="text-white/50">Updating…</span>}
              </div>
            )}

            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="text-sm font-semibold text-white mb-2">
                Agenda items
              </div>
              {(dayDetails[selectedDay]?.agendaItems || dayDetails[selectedDay]?.plannedItems)?.length ? (
                <ul className="space-y-1 text-xs text-white/80">
                  {(dayDetails[selectedDay]?.agendaItems || dayDetails[selectedDay]?.plannedItems)?.map((item) => (
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
                        onClick={() => removePlannedItem(selectedDay, item.id)}
                        disabled={removingPlanId === item.id}
                        className="
                          text-white/60 hover:text-white text-[11px]
                          px-2 py-1 rounded-lg hover:bg-white/10
                          disabled:opacity-50 disabled:cursor-not-allowed
                        "
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

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleAddTravelFromDay(selectedDay)}
                className="
                  flex-1 px-4 py-2 rounded-xl text-sm font-medium
                  bg-linear-to-r from-[#007AFF] to-[#AF52DE]
                  text-white hover:shadow-[0_0_20px_rgba(0,122,255,0.3)]
                  transition-all duration-150
                "
              >
                ✈️ Add travel plan
              </button>
              {onJumpToDay && (
                <button
                  onClick={() => selectedDay && onJumpToDay(selectedDay)}
                  className="
                    flex-1 px-4 py-2 rounded-xl text-sm font-medium
                    bg-white/10 text-white hover:bg-white/15
                    border border-white/15
                    transition-all duration-150
                  "
                >
                  Open day view
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

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
