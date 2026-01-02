'use client'

import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import type { AgendaItem, DayDetails, RepeatType } from '@/types'
import { Modal } from '@/components/ui'
import {
  toISODateString,
  generateRecurrenceDates,
  getWeekdayCode,
  WEEKDAY_CODES,
  addDays,
} from '@/utils'

interface AgendaManagerProps {
  selectedDate: string
  todayISO: string
  dayDetails: Record<string, DayDetails>
  agendaItems: AgendaItem[]
  availableSubjects: string[]
  onUpdateDetails: (iso: string, details: Partial<DayDetails>) => Promise<void>
  onStatus?: (status: {
    text: string
    tone?: 'info' | 'success' | 'error' | 'progress'
  }) => void
}

export function AgendaManager({
  selectedDate,
  todayISO,
  dayDetails,
  agendaItems,
  availableSubjects,
  onUpdateDetails,
  onStatus,
}: AgendaManagerProps) {
  const [agendaTitle, setAgendaTitle] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [agendaNote, setAgendaNote] = useState('')
  const [repeatType, setRepeatType] = useState<RepeatType>('none')
  const [repeatDays, setRepeatDays] = useState<string[]>([])
  const [showAgendaModal, setShowAgendaModal] = useState(false)
  const [selectedAgendaSubjects, setSelectedAgendaSubjects] = useState<
    string[]
  >([])
  const [endDateOverride, setEndDateOverride] = useState<string | ''>('')
  const [recurrenceStart, setRecurrenceStart] = useState<string>(selectedDate)
  const [editingAgendaId, setEditingAgendaId] = useState<string | null>(null)
  const [editingRecurrenceId, setEditingRecurrenceId] = useState<string | null>(
    null,
  )
  const typingTimer = useRef<NodeJS.Timeout | null>(null)

  const selectedWeekdayCode = useMemo(
    () => getWeekdayCode(selectedDate),
    [selectedDate],
  )

  const getDefaultEndDate = useCallback(() => {
    const base = selectedDate > todayISO ? selectedDate : todayISO
    const baseDate = new Date(`${base}T00:00:00`)
    return toISODateString(addDays(baseDate, 1)) // 1 day ahead - user must set end date for recurring
  }, [selectedDate, todayISO])

  const isPastOrToday = useMemo(
    () => selectedDate <= todayISO,
    [selectedDate, todayISO],
  )

  const sortedAgendaItems = useMemo(() => {
    const priority = (item: AgendaItem) => {
      const type = item.repeat?.type || 'none'
      if (type === 'weekly') return 0
      if (type === 'daily' || type === 'custom') return 1
      return 2
    }
    return [...agendaItems].sort((a, b) => {
      const p = priority(a) - priority(b)
      if (p !== 0) return p
      if (a.startTime && b.startTime)
        return a.startTime.localeCompare(b.startTime)
      return a.title.localeCompare(b.title)
    })
  }, [agendaItems])

  // Initialize repeat days when changing to weekly/custom mode
  useEffect(() => {
    if (
      (repeatType === 'weekly' || repeatType === 'custom') &&
      repeatDays.length === 0
    ) {
      // Use queueMicrotask to avoid synchronous state update warning
      queueMicrotask(() => setRepeatDays([selectedWeekdayCode]))
    }
  }, [repeatType, repeatDays.length, selectedWeekdayCode])

  // Sync form with selected date (but preserve saved values when editing)
  useEffect(() => {
    queueMicrotask(() => {
      // Only update dates if we're NOT currently editing
      if (!editingAgendaId) {
        setRecurrenceStart(selectedDate)
        setEndDateOverride(getDefaultEndDate())
      }
    })
  }, [selectedDate, getDefaultEndDate, editingAgendaId])

  const toggleRepeatDay = (code: string) => {
    setRepeatDays((prev) =>
      prev.includes(code) ? prev.filter((d) => d !== code) : [...prev, code],
    )
  }

  const resetAgendaForm = () => {
    setAgendaTitle('')
    setStartTime('')
    setEndTime('')
    setAgendaNote('')
    setRepeatType('none')
    setRepeatDays([])
    setShowAgendaModal(false)
    setSelectedAgendaSubjects([])
    setEndDateOverride(getDefaultEndDate())
    setEditingAgendaId(null)
    setEditingRecurrenceId(null)
  }

  const handleAddAgendaItem = async () => {
    if (!agendaTitle.trim()) {
      onStatus?.({ text: 'Agenda title required', tone: 'error' })
      return
    }

    onStatus?.({ text: 'Adding agenda…', tone: 'progress' })

    try {
      const recurrenceStartISO = editingRecurrenceId
        ? recurrenceStart
        : selectedDate
      const recurrenceEndISO = endDateOverride || undefined

      // Editing existing
      if (editingAgendaId) {
        if (editingRecurrenceId) {
          // Series edit
          const recId = editingRecurrenceId
          const recurrenceDates = generateRecurrenceDates(
            recurrenceStartISO,
            repeatType,
            repeatDays,
            recurrenceEndISO,
          )
          const futureRecurrenceDates = recurrenceDates.filter(
            (iso) => iso >= todayISO,
          )

          // Collect all dates to update
          const datesToUpdate = Object.keys(dayDetails)

          // Perform all updates in parallel using Promise.all
          const results = await Promise.all(
            datesToUpdate.map(async (iso) => {
              const items = dayDetails[iso]?.agendaItems || []
              const isPast = iso < todayISO
              const withoutSeries = isPast
                ? items
                : items.filter((i) => i.recurrenceId !== recId)
              const shouldAdd = !isPast && futureRecurrenceDates.includes(iso)
              const newItem: AgendaItem = {
                id: `agenda_${Date.now()}_${Math.random()
                  .toString(36)
                  .slice(2, 8)}`,
                title: agendaTitle.trim(),
                startTime: startTime || undefined,
                endTime: endTime || undefined,
                note: agendaNote.trim() ? agendaNote.trim() : undefined,
                recurrenceId: recId,
                repeat:
                  repeatType === 'none'
                    ? null
                    : {
                        type: repeatType,
                        days:
                          repeatType === 'daily'
                            ? undefined
                            : repeatDays.length
                            ? repeatDays
                            : [selectedWeekdayCode],
                      },
                subjects: selectedAgendaSubjects,
                completed: false,
                recurrenceStart: recurrenceStartISO,
                recurrenceEnd: recurrenceEndISO,
              }
              const nextItems = shouldAdd
                ? [...withoutSeries, newItem]
                : withoutSeries
              if (JSON.stringify(nextItems) !== JSON.stringify(items)) {
                try {
                  await onUpdateDetails(iso, { agendaItems: nextItems })
                  return { success: true, iso }
                } catch (err) {
                  console.error(`❌ Failed to update ${iso}:`, err)
                  return { success: false, iso, error: err }
                }
              }
              return { success: true, iso, skipped: true }
            }),
          )

          const successCount = results.filter((r) => r.success).length
          const failCount = results.length - successCount

          onStatus?.({ text: 'Series updated', tone: 'success' })
          resetAgendaForm()
          return
        } else {
          // Single occurrence edit - update all days that have this plan
          const datesToUpdate = Object.keys(dayDetails)

          const results = await Promise.all(
            datesToUpdate.map(async (iso) => {
              const items = dayDetails[iso]?.agendaItems || []
              const updatedItems = items.map((item) => {
                if (item.id === editingAgendaId) {
                  const updated: AgendaItem = {
                    ...item,
                    title: agendaTitle.trim(),
                    subjects: selectedAgendaSubjects,
                  }
                  // Only include optional fields if they have values
                  if (startTime) updated.startTime = startTime
                  if (endTime) updated.endTime = endTime
                  if (agendaNote.trim()) updated.note = agendaNote.trim()
                  return updated
                }
                return item
              })
              if (JSON.stringify(updatedItems) !== JSON.stringify(items)) {
                try {
                  await onUpdateDetails(iso, { agendaItems: updatedItems })
                  return { success: true, iso }
                } catch (err) {
                  console.error(`❌ Failed to update ${iso}:`, err)
                  return { success: false, iso, error: err }
                }
              }
              return { success: true, iso, skipped: true }
            }),
          )

          const successCount = results.filter((r) => r.success).length
          const failCount = results.length - successCount

          onStatus?.({
            text: '✅ Plan updated • Firebase synced',
            tone: 'success',
          })
          resetAgendaForm()
          return
        }
      }

      // Creating new
      const recurrenceId =
        repeatType === 'none'
          ? null
          : `rec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

      const recurrenceDates = generateRecurrenceDates(
        recurrenceStartISO,
        repeatType,
        repeatDays,
        recurrenceEndISO,
      )
      const futureRecurrenceDates = recurrenceDates.filter(
        (iso) => iso >= todayISO,
      )
      if (futureRecurrenceDates.length === 0) {
        onStatus?.({ text: 'No future dates to add', tone: 'info' })
        resetAgendaForm()
        return
      }

      const repeat =
        repeatType === 'none'
          ? null
          : {
              type: repeatType,
              days:
                repeatType === 'daily'
                  ? undefined
                  : repeatDays.length
                  ? repeatDays
                  : [selectedWeekdayCode],
            }

      for (const iso of futureRecurrenceDates) {
        const existingItems = dayDetails[iso]?.agendaItems || []
        const newItem: AgendaItem = {
          id: `agenda_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          title: agendaTitle.trim(),
          recurrenceId,
          sequenceId: recurrenceId || `seq_${Date.now()}`,
          repeat,
          subjects: selectedAgendaSubjects,
          completed: false,
          recurrenceStart: recurrenceStartISO,
          recurrenceEnd: recurrenceEndISO,
        }
        // Only include optional fields if they have values
        if (startTime) newItem.startTime = startTime
        if (endTime) newItem.endTime = endTime
        if (agendaNote.trim()) newItem.note = agendaNote.trim()

        // Show progress for multi-day operations
        if (
          futureRecurrenceDates.length > 3 &&
          futureRecurrenceDates.indexOf(iso) === 0
        ) {
          onStatus?.({
            text: `Saving to ${futureRecurrenceDates.length} days...`,
            tone: 'progress',
          })
        }

        await onUpdateDetails(iso, {
          agendaItems: [...existingItems, newItem],
        })
      }

      onStatus?.({
        text:
          futureRecurrenceDates.length > 1
            ? `✅ Plan saved to ${futureRecurrenceDates.length} day(s) • Firebase synced`
            : '✅ Plan saved • Firebase synced',
        tone: 'success',
      })
    } catch (error) {
      console.error('Failed to add agenda', error)
      onStatus?.({ text: 'Failed to add agenda', tone: 'error' })
      return
    }

    resetAgendaForm()
  }

  const handleDeleteAgendaItem = (iso: string, id: string) => {
    try {
      const existingItems = dayDetails[iso]?.agendaItems || []
      const filtered = existingItems.filter((item) => item.id !== id)
      onUpdateDetails(iso, { agendaItems: filtered })
      onStatus?.({ text: '🗑️ Plan deleted • Firebase synced', tone: 'info' })
    } catch (error) {
      console.error('Failed to delete agenda', error)
      onStatus?.({ text: '❌ Failed to delete plan', tone: 'error' })
    }
  }

  const handleDeleteSeries = async (recurrenceId: string) => {
    try {
      // Collect all dates that need updating
      const datesToUpdate: string[] = []
      for (const [iso, details] of Object.entries(dayDetails)) {
        const items = details?.agendaItems || []
        if (items.some((item) => item.recurrenceId === recurrenceId)) {
          datesToUpdate.push(iso)
        }
      }

      if (datesToUpdate.length === 0) {
        onStatus?.({ text: 'No items found to delete', tone: 'info' })
        return
      }

      onStatus?.({
        text: `Deleting from ${datesToUpdate.length} day(s)...`,
        tone: 'progress',
      })

      // Perform all updates in parallel using Promise.all
      const results = await Promise.all(
        datesToUpdate.map(async (iso) => {
          const items = dayDetails[iso]?.agendaItems || []
          const filtered = items.filter(
            (item) => item.recurrenceId !== recurrenceId,
          )
          try {
            await onUpdateDetails(iso, { agendaItems: filtered })
            return { success: true, iso }
          } catch (err) {
            console.error(`❌ Failed to update ${iso}:`, err)
            return { success: false, iso, error: err }
          }
        }),
      )

      const successCount = results.filter((r) => r.success).length
      const failCount = results.length - successCount

      if (failCount > 0) {
        console.error(
          '⚠️ Some deletes failed:',
          results.filter((r) => !r.success),
        )
        onStatus?.({
          text: `⚠️ Series deleted from ${successCount}/${datesToUpdate.length} days (${failCount} failed)`,
          tone: 'error',
        })
      } else {
        onStatus?.({
          text: `✅ Series deleted from ${datesToUpdate.length} day(s) • Firebase synced`,
          tone: 'success',
        })
      }
    } catch (error) {
      console.error('💥 Exception in handleDeleteSeries:', error)
      onStatus?.({ text: '❌ Failed to delete series', tone: 'error' })
    }
  }

  const toggleAgendaCompletion = (
    iso: string,
    id: string,
    completed: boolean,
  ) => {
    try {
      const existingItems = dayDetails[iso]?.agendaItems || []
      const updatedItems = existingItems.map((item) =>
        item.id === id ? { ...item, completed } : item,
      )
      onUpdateDetails(iso, { agendaItems: updatedItems })

      if (completed) {
        const subjectsToAttach =
          existingItems.find((i) => i.id === id)?.subjects || []
        if (subjectsToAttach.length === 0) {
          onStatus?.({ text: '✅ Marked done', tone: 'success' })
          return
        }

        onStatus?.({ text: 'Attaching subjects...', tone: 'progress' })

        const currentSubjects = dayDetails[iso]?.subjects || []
        const merged = [...currentSubjects]
        subjectsToAttach.forEach((subj) => {
          const exists = merged.some((s) => s.subject === subj)
          if (!exists) {
            merged.push({ subject: subj, topics: [], hours: 0 })
          }
        })
        onUpdateDetails(iso, { subjects: merged })
        onStatus?.({
          text: `✅ Done • ${subjectsToAttach.length} subject(s) attached`,
          tone: 'success',
        })
      }
      if (!completed) {
        onStatus?.({ text: 'Marked incomplete', tone: 'info' })
      }
    } catch (error) {
      console.error('Failed to toggle completion', error)
      onStatus?.({ text: 'Failed to update completion', tone: 'error' })
    }
  }

  const notifyTyping = (text: string) => {
    onStatus?.({ text, tone: 'progress' })
    if (typingTimer.current) {
      clearTimeout(typingTimer.current)
    }
    typingTimer.current = setTimeout(() => {
      onStatus?.({ text: 'Typing saved', tone: 'success' })
    }, 900)
  }

  const toggleAgendaSubject = (name: string) => {
    setSelectedAgendaSubjects((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name],
    )
  }

  const handleEditAgenda = (item: AgendaItem) => {
    onStatus?.({ text: 'Editing agenda…', tone: 'progress' })
    setShowAgendaModal(true)
    setAgendaTitle(item.title)
    setStartTime(item.startTime || '')
    setEndTime(item.endTime || '')
    setAgendaNote(item.note || '')
    setRepeatType(item.repeat?.type || 'none')
    setRepeatDays(
      item.repeat?.days && item.repeat.type !== 'daily' ? item.repeat.days : [],
    )
    setSelectedAgendaSubjects(item.subjects || [])
    setRecurrenceStart(item.recurrenceStart || selectedDate)
    setEndDateOverride(item.recurrenceEnd || '')
    setEditingAgendaId(item.id)
    setEditingRecurrenceId(item.recurrenceId || null)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-white/70">Agenda</label>
        <div className="flex items-center gap-2">
          {agendaItems.length > 0 && (
            <span className="text-xs text-white/40">
              {agendaItems.length} item{agendaItems.length === 1 ? '' : 's'}
            </span>
          )}
          <button
            onClick={() => {
              resetAgendaForm()
              setShowAgendaModal(true)
            }}
            className="
              px-3 py-1.5 rounded-lg text-xs font-medium
              bg-white/[0.06] text-white
              hover:bg-white/[0.1] transition-all duration-150
            "
          >
            + Add agenda
          </button>
        </div>
      </div>

      {sortedAgendaItems.length > 0 && (
        <div className="space-y-2">
          {sortedAgendaItems.map((item) => (
            <div
              key={item.id}
              className="
                flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between
                rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2
              "
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">
                    {item.title}
                  </span>
                  {item.repeat && item.repeat.type !== 'none' && (
                    <span className="text-xs text-[#AF52DE] bg-[#AF52DE]/10 px-2 py-1 rounded-lg">
                      {item.repeat.type === 'daily'
                        ? 'Daily'
                        : item.repeat.type === 'weekly'
                        ? 'Weekly'
                        : `Custom ${item.repeat.days?.join(', ')}`}
                    </span>
                  )}
                  {item.subjects && item.subjects.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {item.subjects.map((s) => (
                        <span
                          key={s}
                          className="text-[11px] text-[#30D158] bg-[#30D158]/15 px-2 py-0.5 rounded-lg"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {item.note && (
                  <p className="text-xs text-white/50">{item.note}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEditAgenda(item)}
                  className="
                    text-base text-white/50 hover:text-white
                    p-2 rounded-lg hover:bg-white/10 transition-all duration-150
                  "
                  title="Edit"
                >
                  ✏️
                </button>
                {isPastOrToday && (
                  <button
                    onClick={() =>
                      toggleAgendaCompletion(
                        selectedDate,
                        item.id,
                        !item.completed,
                      )
                    }
                    className={`
                      text-base p-2 rounded-lg border transition-all duration-150
                      ${
                        item.completed
                          ? 'bg-[#30D158]/20 border-[#30D158]/40 text-[#30D158]'
                          : 'bg-white/[0.04] border-white/[0.08] text-white/70 hover:bg-white/[0.08]'
                      }
                    `}
                    title={item.completed ? 'Completed' : 'Mark done'}
                  >
                    {item.completed ? '✅' : '⬜'}
                  </button>
                )}
                {item.recurrenceId && (
                  <button
                    onClick={() => handleDeleteSeries(item.recurrenceId!)}
                    className="
                      text-sm px-2 py-1 rounded-lg
                      bg-red-500/10 hover:bg-red-500/20
                      text-red-300 hover:text-red-200
                      border border-red-500/30
                      transition-all duration-150
                    "
                    title="Delete all occurrences in this series"
                  >
                    🗑️ Series
                  </button>
                )}
                <button
                  onClick={() => handleDeleteAgendaItem(selectedDate, item.id)}
                  className="
                    text-sm px-2 py-1 rounded-lg
                    bg-white/5 hover:bg-white/10
                    text-white/70 hover:text-white
                    border border-white/10
                    transition-all duration-150
                  "
                  title="Delete only this day"
                >
                  ❌ This day
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAgendaModal && (
        <Modal
          open={showAgendaModal}
          title={editingAgendaId ? 'Edit agenda' : 'Add agenda'}
          onClose={resetAgendaForm}
          footer={
            <div className="flex justify-end gap-2">
              <button
                onClick={resetAgendaForm}
                className="
                  px-4 py-2 rounded-xl text-sm font-medium
                  bg-white/[0.05] text-white/70 hover:bg-white/[0.1]
                "
              >
                Cancel
              </button>
              <button
                onClick={handleAddAgendaItem}
                disabled={!agendaTitle.trim()}
                className="
                  px-4 py-2 rounded-xl text-sm font-medium
                  bg-gradient-to-r from-[#007AFF] to-[#AF52DE]
                  text-white
                  disabled:opacity-50 disabled:cursor-not-allowed
                  hover:shadow-[0_0_20px_rgba(0,122,255,0.3)]
                  transition-all duration-200
                "
              >
                {editingAgendaId ? 'Update' : 'Add'}
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <input
                value={agendaTitle}
                onChange={(e) => {
                  setAgendaTitle(e.target.value)
                  notifyTyping('Typing…')
                }}
                placeholder="Add an agenda item..."
                className="
                  w-full px-3 py-2 rounded-xl
                  bg-white/[0.04] border border-white/[0.08]
                  text-white placeholder-white/40
                  focus:outline-none focus:border-[#AF52DE]/60
                "
              />
              <div className="flex flex-wrap items-center gap-2 text-xs text-white/50">
                {repeatType !== 'none' && (
                  <span className="text-[#AF52DE]">
                    {repeatType === 'daily'
                      ? 'Daily'
                      : repeatType === 'weekly'
                      ? 'Weekly'
                      : `Custom ${repeatDays.join(', ')}`}
                  </span>
                )}
                {editingAgendaId && (
                  <span className="text-white/40">
                    Editing {editingRecurrenceId ? 'series' : 'occurrence'}
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-white/40 w-16">Start</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="
                      flex-1 px-3 py-2 rounded-xl
                      bg-white/[0.04] border border-white/[0.08]
                      text-white placeholder-white/40
                      focus:outline-none focus:border-[#AF52DE]/60
                    "
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-white/40 w-16">End</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="
                      flex-1 px-3 py-2 rounded-xl
                      bg-white/[0.04] border border-white/[0.08]
                      text-white placeholder-white/40
                      focus:outline-none focus:border-[#AF52DE]/60
                    "
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-white/40 w-16">Repeat</label>
                  <select
                    value={repeatType}
                    onChange={(e) =>
                      setRepeatType(e.target.value as RepeatType)
                    }
                    className="
                      flex-1 px-3 py-2 rounded-xl
                      bg-white/[0.04] border border-white/[0.08]
                      text-white
                      focus:outline-none focus:border-[#AF52DE]/60
                    "
                  >
                    <option value="none">None</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="custom">Custom days</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {WEEKDAY_CODES.map((code) => (
                  <button
                    key={code}
                    onClick={() => toggleRepeatDay(code)}
                    disabled={
                      repeatType !== 'weekly' && repeatType !== 'custom'
                    }
                    className={`
                      px-3 py-1.5 rounded-lg text-xs font-medium
                      transition-all duration-200
                      ${
                        repeatDays.includes(code)
                          ? 'bg-[#AF52DE] text-white shadow-[0_0_10px_rgba(175,82,222,0.3)]'
                          : 'bg-white/[0.05] text-white/50 hover:bg-white/[0.1]'
                      }
                      ${
                        repeatType !== 'weekly' && repeatType !== 'custom'
                          ? 'opacity-40 cursor-not-allowed'
                          : ''
                      }
                    `}
                  >
                    {code.toUpperCase()}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-white/40 w-20">Start on</label>
                  <input
                    type="date"
                    value={recurrenceStart}
                    onChange={(e) => setRecurrenceStart(e.target.value)}
                    className="
                      flex-1 px-3 py-2 rounded-xl
                      bg-white/[0.04] border border-white/[0.08]
                      text-white placeholder-white/40
                      focus:outline-none focus:border-[#AF52DE]/60
                    "
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-white/40 w-20">End on</label>
                  <input
                    type="date"
                    value={endDateOverride || ''}
                    onChange={(e) => setEndDateOverride(e.target.value)}
                    className="
                      flex-1 px-3 py-2 rounded-xl
                      bg-white/[0.04] border border-white/[0.08]
                      text-white placeholder-white/40
                      focus:outline-none focus:border-[#AF52DE]/60
                    "
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-white/50">Attach subjects</label>
                <div className="flex flex-wrap gap-2">
                  {availableSubjects.map((subject) => (
                    <button
                      key={subject}
                      onClick={() => toggleAgendaSubject(subject)}
                      className={`
                        px-3 py-1.5 rounded-xl text-xs font-medium
                        transition-all duration-150 border
                        ${
                          selectedAgendaSubjects.includes(subject)
                            ? 'bg-[#30D158]/20 border-[#30D158]/50 text-[#30D158]'
                            : 'bg-white/[0.04] border-white/[0.08] text-white/60 hover:bg-white/[0.08]'
                        }
                      `}
                    >
                      {subject}
                    </button>
                  ))}
                  {availableSubjects.length === 0 && (
                    <span className="text-xs text-white/40">
                      No subjects yet
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-white/50">Note</label>
                <textarea
                  value={agendaNote}
                  onChange={(e) => setAgendaNote(e.target.value)}
                  rows={2}
                  placeholder="Add a note (optional)"
                  className="
                    w-full px-3 py-2 rounded-xl
                    bg-white/[0.04] border border-white/[0.08]
                    text-white placeholder-white/40
                    focus:outline-none focus:border-[#AF52DE]/60
                    resize-none
                  "
                />
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
