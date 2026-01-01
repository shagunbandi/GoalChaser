'use client'

import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import type {
  DayDetails,
  SubjectConfig,
  SubjectEntry,
  SuccessCriterion,
  PlannedItem,
  RepeatType,
} from '@/types'
import { Card, CardHeader, Modal } from '@/components/ui'
import { StatusSelector } from './StatusSelector'
import { HoursSummary } from './HoursSummary'
import { SubjectManager } from './SubjectManager'
import { formatDateDisplay, toISODateString } from '@/lib/dateUtils'

interface DetailViewProps {
  selectedDate: string
  todayISO: string
  dayDetails: Record<string, DayDetails>
  subjectConfigs: SubjectConfig[]
  onUpdateDetails: (iso: string, details: Partial<DayDetails>) => Promise<void>
  onStatus?: (status: {
    text: string
    tone?: 'info' | 'success' | 'error' | 'progress'
  }) => void
  onAddSubject: (name: string) => void
  onRemoveSubject: (id: string) => void
  onUpdateSubject: (id: string, name: string) => void
  onToggleHasTopics: (id: string) => void
  onAddTopic: (subjectId: string, topic: string) => void
  onRemoveTopic: (subjectId: string, topic: string) => void
  onUpdateTopic: (subjectId: string, oldTopic: string, newTopic: string) => void
  isTopicInUse: (subjectId: string, topic: string) => boolean
  noCard?: boolean
  successCriterion?: SuccessCriterion
}

const WEEKDAY_CODES = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
// Fallback guardrail when no end date is supplied; if an end date is provided,
// we generate strictly to that end date.
const REPEAT_WINDOW_DAYS = 365

export function DetailView({
  selectedDate,
  todayISO,
  dayDetails,
  subjectConfigs,
  onUpdateDetails,
  onStatus,
  onAddSubject,
  onRemoveSubject,
  onUpdateSubject,
  onToggleHasTopics,
  onAddTopic,
  onRemoveTopic,
  onUpdateTopic,
  isTopicInUse,
  noCard = false,
  successCriterion,
}: DetailViewProps) {
  const isHoursBasedGoal = successCriterion?.type === 'hours'
  const [showAddSubject, setShowAddSubject] = useState(false)
  const [newSubjectInput, setNewSubjectInput] = useState('')
  const [expandedSubjectIndex, setExpandedSubjectIndex] = useState<
    number | null
  >(null)
  const [showAddTopicForSubject, setShowAddTopicForSubject] = useState<
    string | null
  >(null)
  const [newTopicInput, setNewTopicInput] = useState('')
  const [showSubjectManager, setShowSubjectManager] = useState(false)
  const [planTitle, setPlanTitle] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [planNote, setPlanNote] = useState('')
  const [repeatType, setRepeatType] = useState<RepeatType>('none')
  const [repeatDays, setRepeatDays] = useState<string[]>([])
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [selectedPlanSubjects, setSelectedPlanSubjects] = useState<string[]>([])
  const [endDateOverride, setEndDateOverride] = useState<string | ''>('')
  const [recurrenceStart, setRecurrenceStart] = useState<string>(selectedDate)
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null)
  const [editingRecurrenceId, setEditingRecurrenceId] = useState<string | null>(
    null,
  )
  const typingTimer = useRef<NodeJS.Timeout | null>(null)

  const addDays = (date: Date, days: number) => {
    const copy = new Date(date)
    copy.setDate(copy.getDate() + days)
    return copy
  }

  const getDefaultEndDate = useCallback(() => {
    const base = selectedDate > todayISO ? selectedDate : todayISO
    const baseDate = new Date(`${base}T00:00:00`)
    return toISODateString(addDays(baseDate, 365))
  }, [selectedDate, todayISO])

  const details = dayDetails[selectedDate]
  const currentStatus = details?.status || null
  const currentNote = details?.note || ''
  const currentSubjects: SubjectEntry[] = details?.subjects || []
  const plannedItems: PlannedItem[] = useMemo(
    () => details?.plannedItems || [],
    [details?.plannedItems],
  )
  const sortedPlannedItems = useMemo(() => {
    const priority = (item: PlannedItem) => {
      const type = item.repeat?.type || 'none'
      if (type === 'weekly') return 0
      if (type === 'daily' || type === 'custom') return 1
      return 2
    }
    return [...plannedItems].sort((a, b) => {
      const p = priority(a) - priority(b)
      if (p !== 0) return p
      if (a.startTime && b.startTime)
        return a.startTime.localeCompare(b.startTime)
      return a.title.localeCompare(b.title)
    })
  }, [plannedItems])

  const selectedWeekdayCode = useMemo(() => {
    const date = new Date(`${selectedDate}T00:00:00`)
    return WEEKDAY_CODES[date.getDay()]
  }, [selectedDate])

  useEffect(() => {
    if (
      (repeatType === 'weekly' || repeatType === 'custom') &&
      repeatDays.length === 0
    ) {
      setRepeatDays([selectedWeekdayCode])
    }
  }, [repeatType, repeatDays.length, selectedWeekdayCode])

  // Reset end date default when date changes
  useEffect(() => {
    setRecurrenceStart(selectedDate)
    setEndDateOverride(getDefaultEndDate())
  }, [selectedDate, getDefaultEndDate])

  const generateRecurrenceDates = (
    startISO: string,
    type: RepeatType,
    days: string[],
    endISO?: string,
  ): string[] => {
    // If no repeat, just the start date
    if (type === 'none') return [startISO]

    const startDate = new Date(`${startISO}T00:00:00`)
    const endDate = endISO ? new Date(`${endISO}T00:00:00`) : null
    const usedDays =
      type === 'daily'
        ? []
        : days.length > 0
        ? days
        : [WEEKDAY_CODES[startDate.getDay()]]

    const occurrences: string[] = []

    // If we have an explicit end date, iterate to that; otherwise use a safe window guard.
    const maxIterations = endDate
      ? Math.max(
          1,
          Math.min(
            REPEAT_WINDOW_DAYS,
            Math.round(
              (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
            ) + 1,
          ),
        )
      : REPEAT_WINDOW_DAYS

    for (let i = 0; i < maxIterations; i++) {
      const date = addDays(startDate, i)
      if (endDate && date > endDate) break
      const iso = toISODateString(date)
      if (type === 'daily') {
        occurrences.push(iso)
        continue
      }
      const code = WEEKDAY_CODES[date.getDay()]
      if (usedDays.includes(code)) {
        occurrences.push(iso)
      }
    }

    return occurrences.length > 0 ? occurrences : [startISO]
  }

  const toggleRepeatDay = (code: string) => {
    setRepeatDays((prev) =>
      prev.includes(code) ? prev.filter((d) => d !== code) : [...prev, code],
    )
  }

  const resetPlanForm = () => {
    setPlanTitle('')
    setStartTime('')
    setEndTime('')
    setPlanNote('')
    setRepeatType('none')
    setRepeatDays([])
    setShowPlanModal(false)
    setSelectedPlanSubjects([])
    setEndDateOverride(getDefaultEndDate())
    setEditingPlanId(null)
    setEditingRecurrenceId(null)
  }

  const handleAddPlanItem = async () => {
    if (!planTitle.trim()) {
      onStatus?.({ text: 'Plan title required', tone: 'error' })
      return
    }

    onStatus?.({ text: 'Adding plan…', tone: 'progress' })

    try {
      const recurrenceStartISO = editingRecurrenceId
        ? recurrenceStart
        : selectedDate
      const recurrenceEndISO = endDateOverride || undefined

      // Editing existing
      if (editingPlanId) {
        if (editingRecurrenceId) {
          // Series edit: regenerate occurrences within start/end range
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

          for (const [iso, details] of Object.entries(dayDetails)) {
            const items = details?.plannedItems || []
            const isPast = iso < todayISO
            const withoutSeries = isPast
              ? items
              : items.filter((i) => i.recurrenceId !== recId)
            const shouldAdd = !isPast && futureRecurrenceDates.includes(iso)
            const newItem: PlannedItem = {
              id: `plan_${Date.now()}_${Math.random()
                .toString(36)
                .slice(2, 8)}`,
              title: planTitle.trim(),
              startTime: startTime || undefined,
              endTime: endTime || undefined,
              note: planNote.trim() ? planNote.trim() : undefined,
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
              subjects: selectedPlanSubjects,
              completed: false,
              recurrenceStart: recurrenceStartISO,
              recurrenceEnd: recurrenceEndISO,
            }
            const nextItems = shouldAdd
              ? [...withoutSeries, newItem]
              : withoutSeries
            if (JSON.stringify(nextItems) !== JSON.stringify(items)) {
              await onUpdateDetails(iso, { plannedItems: nextItems })
            }
          }

          onStatus?.({ text: 'Series updated', tone: 'success' })
          resetPlanForm()
          return
        } else {
          // Single occurrence edit
          for (const [iso, details] of Object.entries(dayDetails)) {
            const items = details?.plannedItems || []
            const updatedItems = items.map((item) =>
              item.id === editingPlanId
                ? {
                    ...item,
                    title: planTitle.trim(),
                    startTime: startTime || undefined,
                    endTime: endTime || undefined,
                    note: planNote.trim() ? planNote.trim() : undefined,
                    subjects: selectedPlanSubjects,
                  }
                : item,
            )
            if (JSON.stringify(updatedItems) !== JSON.stringify(items)) {
              await onUpdateDetails(iso, { plannedItems: updatedItems })
            }
          }
          onStatus?.({ text: 'Plan updated', tone: 'success' })
          resetPlanForm()
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
        resetPlanForm()
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
        const existingItems = dayDetails[iso]?.plannedItems || []
        const newItem: PlannedItem = {
          id: `plan_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          title: planTitle.trim(),
          startTime: startTime || undefined,
          endTime: endTime || undefined,
          note: planNote.trim() ? planNote.trim() : undefined,
          recurrenceId,
          sequenceId: recurrenceId || `seq_${Date.now()}`,
          repeat,
          subjects: selectedPlanSubjects,
          completed: false,
          recurrenceStart: recurrenceStartISO,
          recurrenceEnd: recurrenceEndISO,
        }
        await onUpdateDetails(iso, {
          plannedItems: [...existingItems, newItem],
        })
      }

      onStatus?.({
        text:
          futureRecurrenceDates.length > 1
            ? `Added plan to ${futureRecurrenceDates.length} day(s)`
            : 'Plan added',
        tone: 'success',
      })
    } catch (error) {
      console.error('Failed to add plan', error)
      onStatus?.({ text: 'Failed to add plan', tone: 'error' })
      return
    }

    resetPlanForm()
  }

  const handleDeletePlanItem = (iso: string, id: string) => {
    try {
      const existingItems = dayDetails[iso]?.plannedItems || []
      const filtered = existingItems.filter((item) => item.id !== id)
      onUpdateDetails(iso, { plannedItems: filtered })
      onStatus?.({ text: 'Plan deleted', tone: 'info' })
    } catch (error) {
      console.error('Failed to delete plan', error)
      onStatus?.({ text: 'Failed to delete plan', tone: 'error' })
    }
  }

  const handleDeleteSeries = async (recurrenceId: string) => {
    onStatus?.({ text: 'Deleting series…', tone: 'progress' })
    try {
      for (const [iso, details] of Object.entries(dayDetails)) {
        const items = details?.plannedItems || []
        const filtered = items.filter(
          (item) => item.recurrenceId !== recurrenceId,
        )
        if (filtered.length !== items.length) {
          await onUpdateDetails(iso, { plannedItems: filtered })
        }
      }
      onStatus?.({ text: 'Series deleted', tone: 'success' })
    } catch (error) {
      console.error('Failed to delete series', error)
      onStatus?.({ text: 'Failed to delete series', tone: 'error' })
    }
  }

  const isPastOrToday = useMemo(
    () => selectedDate <= todayISO,
    [selectedDate, todayISO],
  )

  const togglePlanCompletion = (
    iso: string,
    id: string,
    completed: boolean,
  ) => {
    try {
      const existingItems = dayDetails[iso]?.plannedItems || []
      const updatedItems = existingItems.map((item) =>
        item.id === id ? { ...item, completed } : item,
      )
      onUpdateDetails(iso, { plannedItems: updatedItems })

      if (completed) {
        onStatus?.({ text: 'Marking done…', tone: 'progress' })
        const subjectsToAttach =
          existingItems.find((i) => i.id === id)?.subjects || []
        if (subjectsToAttach.length === 0) return

        const currentSubjects: SubjectEntry[] = dayDetails[iso]?.subjects || []
        const merged = [...currentSubjects]
        subjectsToAttach.forEach((subj) => {
          const exists = merged.some((s) => s.subject === subj)
          if (!exists) {
            merged.push({ subject: subj, topics: [], hours: 0 })
          }
        })
        onUpdateDetails(iso, { subjects: merged })
        onStatus?.({
          text: 'Marked done and subjects attached',
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

  const togglePlanSubject = (name: string) => {
    setSelectedPlanSubjects((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name],
    )
  }

  // Get available subjects
  const availableSubjects = subjectConfigs.map((s) => s.name)

  // Get topics for a subject
  const getTopicsForSubject = (subjectName: string) => {
    const config = subjectConfigs.find((s) => s.name === subjectName)
    return config?.topics || []
  }

  // Get subject config by name
  const getSubjectConfig = (subjectName: string) => {
    return subjectConfigs.find((s) => s.name === subjectName)
  }

  // Check if subject has topics enabled
  const subjectHasTopics = (subjectName: string) => {
    const config = getSubjectConfig(subjectName)
    return config?.hasTopics ?? true
  }

  // Update subjects array
  const updateSubjects = (newSubjects: SubjectEntry[]) => {
    onUpdateDetails(selectedDate, { subjects: newSubjects })
  }

  // Add a new subject entry
  const handleAddSubjectEntry = (subjectName: string) => {
    const existingEntry = currentSubjects.find((s) => s.subject === subjectName)
    if (existingEntry) return // Already added

    const newEntry: SubjectEntry = {
      subject: subjectName,
      topics: [],
      hours: 0,
    }
    updateSubjects([...currentSubjects, newEntry])
    setExpandedSubjectIndex(currentSubjects.length)
  }

  // Remove a subject entry
  const handleRemoveSubjectEntry = (index: number) => {
    const newSubjects = currentSubjects.filter((_, i) => i !== index)
    updateSubjects(newSubjects)
    if (expandedSubjectIndex === index) {
      setExpandedSubjectIndex(null)
    } else if (expandedSubjectIndex !== null && expandedSubjectIndex > index) {
      setExpandedSubjectIndex(expandedSubjectIndex - 1)
    }
  }

  // Toggle topic selection for a subject entry
  const handleToggleTopic = (subjectIndex: number, topic: string) => {
    const entry = currentSubjects[subjectIndex]
    const newTopics = entry.topics.includes(topic)
      ? entry.topics.filter((t) => t !== topic)
      : [...entry.topics, topic]

    const newSubjects = currentSubjects.map((s, i) =>
      i === subjectIndex ? { ...s, topics: newTopics } : s,
    )
    updateSubjects(newSubjects)
  }

  // Update hours for a subject entry
  const handleUpdateHours = (subjectIndex: number, hours: number) => {
    const newSubjects = currentSubjects.map((s, i) =>
      i === subjectIndex ? { ...s, hours: Math.max(0, hours) } : s,
    )
    updateSubjects(newSubjects)
  }

  // Add new subject to config and add entry
  const handleAddNewSubject = () => {
    if (newSubjectInput.trim()) {
      onAddSubject(newSubjectInput.trim())
      handleAddSubjectEntry(newSubjectInput.trim())
      setNewSubjectInput('')
      setShowAddSubject(false)
    }
  }

  // Add new topic to subject config
  const handleAddNewTopic = (subjectName: string, subjectIndex: number) => {
    if (newTopicInput.trim()) {
      const config = getSubjectConfig(subjectName)
      if (config) {
        onAddTopic(config.id, newTopicInput.trim())
        // Also select the new topic
        handleToggleTopic(subjectIndex, newTopicInput.trim())
      }
      setNewTopicInput('')
      setShowAddTopicForSubject(null)
    }
  }

  // Calculate hours from subjects
  const subjectHours = currentSubjects.reduce((sum, s) => sum + s.hours, 0)

  // Get direct hours (for hours-based goals when not using subjects)
  const directHours = details?.directHours || 0

  // Total hours: use subject hours if any, otherwise use direct hours
  // Only one source is used at a time (subjects take priority)
  const totalHours = subjectHours > 0 ? subjectHours : directHours

  // Handle direct hours change
  const handleDirectHoursChange = (hours: number) => {
    onUpdateDetails(selectedDate, { directHours: hours })
  }

  // Get subjects not yet added
  const availableToAdd = availableSubjects.filter(
    (s) => !currentSubjects.find((entry) => entry.subject === s),
  )

  const content = (
    <>
      <CardHeader
        icon="🗓️"
        title="Plan Day"
        subtitle={formatDateDisplay(selectedDate)}
      />

      <div className="space-y-6">
        {/* Planning */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-white/70">Plan</label>
            <div className="flex items-center gap-2">
              {plannedItems.length > 0 && (
                <span className="text-xs text-white/40">
                  {plannedItems.length} item
                  {plannedItems.length === 1 ? '' : 's'}
                </span>
              )}
              <button
                onClick={() => {
                  resetPlanForm()
                  setShowPlanModal(true)
                }}
                className="
                  px-3 py-1.5 rounded-lg text-xs font-medium
                  bg-white/[0.06] text-white
                  hover:bg-white/[0.1] transition-all duration-150
                "
              >
                + Add plan
              </button>
            </div>
          </div>

          {sortedPlannedItems.length > 0 && (
            <div className="space-y-2">
              {sortedPlannedItems.map((item) => (
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
                      {item.startTime && (
                        <span className="text-xs text-white/50 bg-white/[0.06] px-2 py-1 rounded-lg">
                          {item.startTime}
                          {item.endTime ? ` – ${item.endTime}` : ''}
                        </span>
                      )}
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
                      onClick={() => {
                        onStatus?.({ text: 'Editing plan…', tone: 'progress' })
                        setShowPlanModal(true)
                        setPlanTitle(item.title)
                        setStartTime(item.startTime || '')
                        setEndTime(item.endTime || '')
                        setPlanNote(item.note || '')
                        setRepeatType(item.repeat?.type || 'none')
                        setRepeatDays(
                          item.repeat?.days && item.repeat.type !== 'daily'
                            ? item.repeat.days
                            : [],
                        )
                        setSelectedPlanSubjects(item.subjects || [])
                        setRecurrenceStart(item.recurrenceStart || selectedDate)
                        setEndDateOverride(item.recurrenceEnd || '')
                        setEditingPlanId(item.id)
                        setEditingRecurrenceId(item.recurrenceId || null)
                      }}
                      className="
                        text-xs text-white/50 hover:text-white
                        px-2 py-1 rounded-lg hover:bg-white/10
                      "
                    >
                      Edit
                    </button>
                    {isPastOrToday && (
                      <button
                        onClick={() =>
                          togglePlanCompletion(
                            selectedDate,
                            item.id,
                            !item.completed,
                          )
                        }
                        className={`
                          text-xs px-2 py-1 rounded-lg border
                          ${
                            item.completed
                              ? 'bg-[#30D158]/20 border-[#30D158]/40 text-[#30D158]'
                              : 'bg-white/[0.04] border-white/[0.08] text-white/70 hover:bg-white/[0.08]'
                          }
                        `}
                      >
                        {item.completed ? 'Completed' : 'Mark done'}
                      </button>
                    )}
                    {item.recurrenceId && (
                      <button
                        onClick={() => handleDeleteSeries(item.recurrenceId!)}
                        className="
                          text-xs text-white/50 hover:text-red-300
                          px-2 py-1 rounded-lg hover:bg-red-500/10
                        "
                      >
                        Delete series
                      </button>
                    )}
                    <button
                      onClick={() =>
                        handleDeletePlanItem(selectedDate, item.id)
                      }
                      className="
                        text-xs text-white/50 hover:text-red-300
                        px-2 py-1 rounded-lg hover:bg-red-500/10
                      "
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {showPlanModal && (
            <Modal
              open={showPlanModal}
              title={editingPlanId ? 'Edit plan' : 'Add plan'}
              onClose={resetPlanForm}
              footer={
                <div className="flex justify-end gap-2">
                  <button
                    onClick={resetPlanForm}
                    className="
                      px-4 py-2 rounded-xl text-sm font-medium
                      bg-white/[0.05] text-white/70 hover:bg-white/[0.1]
                    "
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddPlanItem}
                    disabled={!planTitle.trim()}
                    className="
                      px-4 py-2 rounded-xl text-sm font-medium
                      bg-gradient-to-r from-[#007AFF] to-[#AF52DE]
                      text-white
                      disabled:opacity-50 disabled:cursor-not-allowed
                      hover:shadow-[0_0_20px_rgba(0,122,255,0.3)]
                      transition-all duration-200
                    "
                  >
                    {editingPlanId ? 'Update' : 'Add'}
                  </button>
                </div>
              }
            >
              <div className="space-y-4">
                <div className="space-y-2">
                  <input
                    value={planTitle}
                    onChange={(e) => {
                      setPlanTitle(e.target.value)
                      notifyTyping('Typing…')
                    }}
                    placeholder="Add a plan item..."
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
                    {editingPlanId && (
                      <span className="text-white/40">
                        Editing {editingRecurrenceId ? 'series' : 'occurrence'}
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-white/40 w-16">
                        Start
                      </label>
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
                      <label className="text-xs text-white/40 w-16">
                        Repeat
                      </label>
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
                      <label className="text-xs text-white/40 w-20">
                        Start
                      </label>
                      <input
                        type="date"
                        value={selectedDate}
                        disabled
                        className="
                          flex-1 px-3 py-2 rounded-xl
                          bg-white/[0.04] border border-white/[0.08]
                          text-white/60 placeholder-white/40
                          cursor-not-allowed
                        "
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-white/40 w-20">
                        End on
                      </label>
                      <input
                        type="date"
                        value={endDateOverride || ''}
                        onChange={(e) => setEndDateOverride(e.target.value)}
                        min={todayISO}
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
                    <label className="text-xs text-white/50">
                      Attach subjects
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {availableSubjects.map((subject) => (
                        <button
                          key={subject}
                          onClick={() => togglePlanSubject(subject)}
                          className={`
                            px-3 py-1.5 rounded-xl text-xs font-medium
                            transition-all duration-150 border
                            ${
                              selectedPlanSubjects.includes(subject)
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
                      value={planNote}
                      onChange={(e) => setPlanNote(e.target.value)}
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

        {/* Status Selector or Hours Summary based on goal type */}
        {isHoursBasedGoal ? (
          <HoursSummary
            totalHours={totalHours}
            subjectHours={subjectHours}
            directHours={directHours}
            maxHours={successCriterion.maxHours}
            onDirectHoursChange={handleDirectHoursChange}
          />
        ) : (
          <StatusSelector
            value={currentStatus}
            onChange={(status) => {
              onUpdateDetails(selectedDate, { status })
            }}
          />
        )}

        {/* Subjects Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <label className="block text-sm font-medium text-white/60">
                Subjects
              </label>
              <button
                onClick={() => setShowSubjectManager(true)}
                className="
                  p-1.5 rounded-lg text-sm
                  text-white/40 hover:text-white/70
                  hover:bg-white/[0.08]
                  transition-all duration-200
                "
                title="Manage subjects and topics"
              >
                ⚙️
              </button>
            </div>
            {totalHours > 0 && (
              <span className="text-xs text-[#32D4DE]">
                Total: {totalHours}h
              </span>
            )}
          </div>

          {/* Added Subjects */}
          {currentSubjects.length > 0 && (
            <div className="space-y-2">
              {currentSubjects.map((entry, index) => {
                const hasTopics = subjectHasTopics(entry.subject)
                const isExpanded = expandedSubjectIndex === index

                return (
                  <div
                    key={entry.subject}
                    className={`
                    backdrop-blur-sm rounded-xl overflow-hidden
                    ${
                      hasTopics
                        ? 'bg-white/[0.03] border border-white/[0.08]'
                        : 'bg-[#30D158]/20 border border-[#30D158]/30'
                    }
                  `}
                  >
                    {/* Subject Header */}
                    <div
                      className={`
                      flex items-center justify-between p-3
                      ${hasTopics ? 'cursor-pointer hover:bg-white/[0.02]' : ''}
                    `}
                      onClick={() => {
                        if (hasTopics) {
                          setExpandedSubjectIndex(isExpanded ? null : index)
                        }
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`font-medium ${
                            hasTopics ? 'text-[#007AFF]' : 'text-[#30D158]'
                          }`}
                        >
                          {entry.subject}
                        </span>
                        {!hasTopics && (
                          <span className="text-xs text-[#30D158]/70">
                            ✓ Done
                          </span>
                        )}
                        {hasTopics && entry.topics.length > 0 && (
                          <span className="text-xs text-white/40">
                            {entry.topics.length} topic
                            {entry.topics.length !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        {entry.hours > 0 && (
                          <span className="text-xs text-[#30D158] font-medium">
                            {entry.hours}h
                          </span>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRemoveSubjectEntry(index)
                          }}
                          className="text-white/30 hover:text-red-400 transition-colors p-1"
                        >
                          ✕
                        </button>
                        {hasTopics && (
                          <span className="text-white/30 text-xs">
                            {isExpanded ? '▲' : '▼'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Expanded Content - only for subjects with topics */}
                    {hasTopics && isExpanded && (
                      <div className="border-t border-white/[0.06] p-3 space-y-4">
                        {/* Topics */}
                        <div className="space-y-2">
                          <label className="text-xs text-white/40">
                            Topics
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {getTopicsForSubject(entry.subject).map((topic) => (
                              <button
                                key={topic}
                                onClick={() => handleToggleTopic(index, topic)}
                                className={`
                                px-3 py-1.5 rounded-lg text-xs font-medium 
                                transition-all duration-200
                                ${
                                  entry.topics.includes(topic)
                                    ? 'bg-[#AF52DE] text-white shadow-[0_0_15px_rgba(175,82,222,0.3)]'
                                    : 'bg-white/[0.05] text-white/60 hover:bg-white/[0.1]'
                                }
                              `}
                              >
                                {topic}
                              </button>
                            ))}
                            {showAddTopicForSubject === entry.subject ? (
                              <div className="flex gap-1">
                                <input
                                  type="text"
                                  value={newTopicInput}
                                  onChange={(e) =>
                                    setNewTopicInput(e.target.value)
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      handleAddNewTopic(entry.subject, index)
                                    } else if (e.key === 'Escape') {
                                      setShowAddTopicForSubject(null)
                                      setNewTopicInput('')
                                    }
                                  }}
                                  placeholder="New topic..."
                                  className="
                                  px-2 py-1 w-24
                                  bg-white/[0.05] border border-white/[0.1] rounded-lg
                                  text-xs text-white placeholder-white/30
                                  focus:outline-none focus:border-[#AF52DE]/50
                                "
                                  autoFocus
                                />
                                <button
                                  onClick={() =>
                                    handleAddNewTopic(entry.subject, index)
                                  }
                                  disabled={!newTopicInput.trim()}
                                  className="px-2 py-1 bg-[#AF52DE] text-white text-xs rounded-lg disabled:opacity-50"
                                >
                                  Add
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() =>
                                  setShowAddTopicForSubject(entry.subject)
                                }
                                className="
                                px-3 py-1.5 rounded-lg text-xs
                                bg-white/[0.02] text-white/40 
                                hover:bg-white/[0.05] hover:text-white/60
                                border border-dashed border-white/[0.1]
                              "
                              >
                                + Topic
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Hours */}
                        <div className="space-y-2">
                          <label className="text-xs text-white/40">
                            Hours Spent
                          </label>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                handleUpdateHours(index, entry.hours - 0.5)
                              }
                              className="
                              w-8 h-8 rounded-lg
                              bg-white/[0.05] hover:bg-white/[0.1]
                              text-white/60 hover:text-white
                              transition-all duration-200
                              flex items-center justify-center
                            "
                            >
                              −
                            </button>
                            <input
                              type="number"
                              value={entry.hours || ''}
                              onChange={(e) =>
                                handleUpdateHours(
                                  index,
                                  parseFloat(e.target.value) || 0,
                                )
                              }
                              step="0.5"
                              min="0"
                              className="
                              w-16 px-2 py-1.5 text-center
                              bg-white/[0.05] border border-white/[0.1] rounded-lg
                              text-white text-sm
                              focus:outline-none focus:border-[#30D158]/50
                            "
                            />
                            <button
                              onClick={() =>
                                handleUpdateHours(index, entry.hours + 0.5)
                              }
                              className="
                              w-8 h-8 rounded-lg
                              bg-white/[0.05] hover:bg-white/[0.1]
                              text-white/60 hover:text-white
                              transition-all duration-200
                              flex items-center justify-center
                            "
                            >
                              +
                            </button>
                            <span className="text-xs text-white/40 ml-1">
                              hours
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Add Subject Button/Input */}
          {!showAddSubject ? (
            <div className="flex flex-wrap gap-2">
              {availableToAdd.map((subject) => (
                <button
                  key={subject}
                  onClick={() => handleAddSubjectEntry(subject)}
                  className="
                    px-3 py-2 rounded-xl text-sm font-medium
                    bg-white/[0.03] text-white/50 
                    hover:bg-white/[0.08] hover:text-white/80
                    border border-white/[0.06] hover:border-white/[0.1]
                    transition-all duration-200
                  "
                >
                  + {subject}
                </button>
              ))}
              <button
                onClick={() => setShowAddSubject(true)}
                className="
                  px-3 py-2 rounded-xl text-sm font-medium
                  bg-white/[0.02] text-white/40 
                  hover:bg-white/[0.05] hover:text-white/70
                  border border-dashed border-white/[0.1] hover:border-white/[0.2]
                  transition-all duration-200
                "
              >
                + New Subject
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={newSubjectInput}
                onChange={(e) => setNewSubjectInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddNewSubject()
                  if (e.key === 'Escape') {
                    setShowAddSubject(false)
                    setNewSubjectInput('')
                  }
                }}
                placeholder="Enter subject name..."
                className="
                  flex-1 px-4 py-2.5
                  bg-white/[0.03] backdrop-blur-xl
                  border border-white/[0.08] rounded-xl
                  text-white placeholder-white/30
                  focus:outline-none focus:border-[#007AFF]/50
                  transition-all duration-200
                "
                autoFocus
              />
              <button
                onClick={handleAddNewSubject}
                disabled={!newSubjectInput.trim()}
                className="
                  px-4 py-2.5
                  bg-[#007AFF] hover:bg-[#007AFF]/80
                  disabled:bg-white/[0.05] disabled:text-white/30
                  text-white font-medium rounded-xl
                  transition-all duration-200
                "
              >
                Add
              </button>
              <button
                onClick={() => {
                  setShowAddSubject(false)
                  setNewSubjectInput('')
                }}
                className="
                  px-4 py-2.5
                  bg-white/[0.05] hover:bg-white/[0.1]
                  text-white/60 rounded-xl
                  transition-all duration-200
                "
              >
                Cancel
              </button>
            </div>
          )}

          {currentSubjects.length === 0 &&
            availableSubjects.length === 0 &&
            !showAddSubject && (
              <p className="text-xs text-white/30">
                No subjects yet. Add your first subject to get started.
              </p>
            )}
        </div>

        {/* Notes Section */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-white/60">
            📝 Daily Notes
          </label>
          <textarea
            value={currentNote}
            onChange={(e) => {
              onUpdateDetails(selectedDate, { note: e.target.value })
              notifyTyping('Typing…')
            }}
            placeholder="Write something about your day..."
            rows={3}
            className="
              w-full px-4 py-3
              bg-white/[0.03] backdrop-blur-xl
              border border-white/[0.08] rounded-2xl
              text-white placeholder-white/30
              focus:outline-none focus:border-[#FF9500]/50
              focus:shadow-[0_0_0_3px_rgba(255,149,0,0.1)]
              transition-all duration-200 resize-none
            "
          />
        </div>
      </div>

      {/* Subject Manager Modal */}
      {showSubjectManager && (
        <SubjectManager
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

  if (noCard) {
    return <div className="p-6">{content}</div>
  }

  return <Card className="p-6">{content}</Card>
}
