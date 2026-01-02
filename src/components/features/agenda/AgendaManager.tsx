'use client'

import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import type { AgendaItem, DayDetails, RepeatType } from '@/types'
import { AgendaList } from './AgendaList'
import { AgendaForm } from './AgendaForm'
import {
  toISODateString,
  generateRecurrenceDates,
  getWeekdayCode,
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
    return toISODateString(addDays(baseDate, 1))
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

  useEffect(() => {
    if (
      (repeatType === 'weekly' || repeatType === 'custom') &&
      repeatDays.length === 0
    ) {
      queueMicrotask(() => setRepeatDays([selectedWeekdayCode]))
    }
  }, [repeatType, repeatDays.length, selectedWeekdayCode])

  useEffect(() => {
    queueMicrotask(() => {
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

      if (editingAgendaId) {
        if (editingRecurrenceId) {
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

          const datesToUpdate = Object.keys(dayDetails)

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

          onStatus?.({ text: 'Series updated', tone: 'success' })
          resetAgendaForm()
          return
        } else {
          const datesToUpdate = Object.keys(dayDetails)

          await Promise.all(
            datesToUpdate.map(async (iso) => {
              const items = dayDetails[iso]?.agendaItems || []
              const updatedItems = items.map((item) => {
                if (item.id === editingAgendaId) {
                  const updated: AgendaItem = {
                    ...item,
                    title: agendaTitle.trim(),
                    subjects: selectedAgendaSubjects,
                  }
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

          onStatus?.({
            text: '✅ Plan updated • Firebase synced',
            tone: 'success',
          })
          resetAgendaForm()
          return
        }
      }

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
        if (startTime) newItem.startTime = startTime
        if (endTime) newItem.endTime = endTime
        if (agendaNote.trim()) newItem.note = agendaNote.trim()

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
    <div className="space-y-3" data-test-id="agenda-manager">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-white/70">Agenda</label>
        <div className="flex items-center gap-2">
          {agendaItems.length > 0 && (
            <span className="text-xs text-white/40" data-test-id="agenda-count">
              {agendaItems.length} item{agendaItems.length === 1 ? '' : 's'}
            </span>
          )}
          <button
            onClick={() => {
              resetAgendaForm()
              setShowAgendaModal(true)
            }}
            data-test-id="button-add-agenda"
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

      <AgendaList
        items={sortedAgendaItems}
        selectedDate={selectedDate}
        isPastOrToday={isPastOrToday}
        onEdit={handleEditAgenda}
        onToggleCompletion={toggleAgendaCompletion}
        onDeleteSeries={handleDeleteSeries}
        onDeleteSingle={handleDeleteAgendaItem}
      />

      <AgendaForm
        isOpen={showAgendaModal}
        isEditing={!!editingAgendaId}
        title={agendaTitle}
        startTime={startTime}
        endTime={endTime}
        note={agendaNote}
        repeatType={repeatType}
        repeatDays={repeatDays}
        recurrenceStart={recurrenceStart}
        endDateOverride={endDateOverride}
        availableSubjects={availableSubjects}
        selectedSubjects={selectedAgendaSubjects}
        onClose={resetAgendaForm}
        onSubmit={handleAddAgendaItem}
        onTitleChange={(val) => {
          setAgendaTitle(val)
          notifyTyping('Typing…')
        }}
        onStartTimeChange={setStartTime}
        onEndTimeChange={setEndTime}
        onNoteChange={setAgendaNote}
        onRepeatTypeChange={setRepeatType}
        onToggleRepeatDay={toggleRepeatDay}
        onRecurrenceStartChange={setRecurrenceStart}
        onEndDateChange={setEndDateOverride}
        onToggleSubject={toggleAgendaSubject}
        editingInfo={
          editingAgendaId
            ? `Editing ${editingRecurrenceId ? 'series' : 'occurrence'}`
            : undefined
        }
      />
    </div>
  )
}
