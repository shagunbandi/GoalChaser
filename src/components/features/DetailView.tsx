'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type {
  DayDetails,
  SubjectConfig,
  SubjectEntry,
  SuccessCriterion,
  ActivityCardConfig,
} from '@/types'
import { Card, CardHeader } from '@/components/ui'
import { NOTES_DEBOUNCE_MS } from '@/constants'
import { StatusSelector } from './StatusSelector'
import { HoursSummary } from './HoursSummary'
import { SubjectManager } from './SubjectManager'
import { AgendaManager } from './agenda'
import { SubjectEntries } from './SubjectEntries'
import { ActivityCard } from './ActivityCard'
import { formatDateDisplay } from '@/utils'

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
  onNavigateToBudget?: (date: string) => void
  onNavigateToTravel?: (date: string) => void
}

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
  onNavigateToBudget,
  onNavigateToTravel,
}: DetailViewProps) {
  const isHoursBasedGoal = successCriterion?.type === 'hours'
  const [showSubjectManager, setShowSubjectManager] = useState(false)
  const [expenseExpanded, setExpenseExpanded] = useState(false)
  const [incomeExpanded, setIncomeExpanded] = useState(false)
  const [travelExpanded, setTravelExpanded] = useState<Record<string, boolean>>({})

  // Build activity card configurations
  const activityCards: ActivityCardConfig[] = useMemo(() => {
    const dayData = dayDetails[selectedDate] || {}
    const expenses = dayData.expenses || []
    const income = dayData.income || []
    const travelPlans = dayData.travelPlans || []

    const cards: ActivityCardConfig[] = []

    // Expenses card
    if (expenses.length > 0) {
      cards.push({
        type: 'expense',
        icon: '💸',
        title: 'Expenses',
        items: expenses.map((expense) => ({
          id: expense.id,
          label: expense.categoryName,
          amount: expense.amount,
          subtitle: expense.description,
        })),
        totalAmount: expenses.reduce((sum, e) => sum + e.amount, 0),
        color: {
          bg: 'bg-red-500/10',
          border: 'border-red-500/20',
          text: 'text-red-400',
        },
        expanded: expenseExpanded,
        onToggle: () => setExpenseExpanded(!expenseExpanded),
        onViewClick: onNavigateToBudget ? () => onNavigateToBudget(selectedDate) : undefined,
        collapsible: true,
      })
    }

    // Income card
    if (income.length > 0) {
      cards.push({
        type: 'income',
        icon: '💰',
        title: 'Income',
        items: income.map((inc) => ({
          id: inc.id,
          label: inc.categoryName,
          amount: inc.amount,
          subtitle: inc.description,
        })),
        totalAmount: income.reduce((sum, i) => sum + i.amount, 0),
        color: {
          bg: 'bg-green-500/10',
          border: 'border-green-500/20',
          text: 'text-green-400',
        },
        expanded: incomeExpanded,
        onToggle: () => setIncomeExpanded(!incomeExpanded),
        onViewClick: onNavigateToBudget ? () => onNavigateToBudget(selectedDate) : undefined,
        collapsible: true,
      })
    }

    // Travel cards (one per travel)
    travelPlans.forEach((travel) => {
      cards.push({
        type: 'travel',
        icon: '✈️',
        title: travel.title,
        items: [
          {
            id: travel.id,
            label: travel.destination || 'Travel',
            subtitle: `${new Date(travel.startDate).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })} → ${new Date(travel.endDate).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}`,
            note: travel.note,
          },
        ],
        color: {
          bg: 'bg-blue-500/10',
          border: 'border-blue-500/20',
          text: 'text-blue-400',
        },
        expanded: travelExpanded[travel.id] ?? true,
        onToggle: () =>
          setTravelExpanded((prev) => ({
            ...prev,
            [travel.id]: !prev[travel.id],
          })),
        onViewClick: onNavigateToTravel ? () => onNavigateToTravel(selectedDate) : undefined,
        collapsible: false,
      })
    })

    return cards
  }, [
    dayDetails,
    selectedDate,
    expenseExpanded,
    incomeExpanded,
    travelExpanded,
    onNavigateToBudget,
    onNavigateToTravel,
  ])
  const noteSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingNoteSave = useRef<{ date: string; note: string } | null>(null)
  const noteDraftRef = useRef<string>('')
  const isNoteDirtyRef = useRef(false)
  const prevSelectedDateRef = useRef(selectedDate)

  const details = dayDetails[selectedDate]
  const currentStatus = details?.status || null
  const currentNote = details?.note || ''
  const [noteDraft, setNoteDraft] = useState(currentNote)
  const currentSubjects: SubjectEntry[] = details?.subjects || []
  const agendaItems = useMemo(
    () => details?.agendaItems || [],
    [details?.agendaItems],
  )

  const flushPendingNoteSave = useCallback(async () => {
    if (noteSaveTimer.current) {
      clearTimeout(noteSaveTimer.current)
      noteSaveTimer.current = null
    }

    const pending = pendingNoteSave.current
    if (!pending) return

    pendingNoteSave.current = null
    await onUpdateDetails(pending.date, { note: pending.note })

    // If the user has typed more since this save was queued, don't mark as "saved"
    if (
      pending.date === selectedDate &&
      noteDraftRef.current === pending.note
    ) {
      isNoteDirtyRef.current = false
      onStatus?.({ text: 'Saved', tone: 'success' })
    }
  }, [onStatus, onUpdateDetails, selectedDate])

  const scheduleNoteSave = useCallback(
    (date: string, note: string) => {
      pendingNoteSave.current = { date, note }

      if (noteSaveTimer.current) {
        clearTimeout(noteSaveTimer.current)
      }

      noteSaveTimer.current = setTimeout(() => {
        void flushPendingNoteSave()
      }, NOTES_DEBOUNCE_MS)
    },
    [flushPendingNoteSave],
  )

  // Calculate hours from subjects
  const subjectHours = currentSubjects.reduce((sum, s) => sum + s.hours, 0)

  // Get direct hours (for hours-based goals when not using subjects)
  const directHours = details?.directHours || 0

  // Total hours: use subject hours if any, otherwise use direct hours
  const totalHours = subjectHours > 0 ? subjectHours : directHours

  // Handle direct hours change
  const handleDirectHoursChange = (hours: number) => {
    onUpdateDetails(selectedDate, { directHours: hours })
  }

  // Update subjects array
  const updateSubjects = (newSubjects: SubjectEntry[]) => {
    onUpdateDetails(selectedDate, { subjects: newSubjects })
  }

  const notifyTyping = (text: string) => {
    onStatus?.({ text, tone: 'progress' })
  }

  // Switching days: flush any pending save for the prior day, then reset local draft.
  useEffect(() => {
    const prevSelectedDate = prevSelectedDateRef.current
    if (prevSelectedDate === selectedDate) return
    prevSelectedDateRef.current = selectedDate

    isNoteDirtyRef.current = false
    noteDraftRef.current = currentNote
    setNoteDraft(currentNote)
    void flushPendingNoteSave()
  }, [selectedDate, currentNote, flushPendingNoteSave])

  // If notes are updated externally (e.g. initial load), sync draft as long as the user isn't actively typing.
  useEffect(() => {
    if (isNoteDirtyRef.current) return
    noteDraftRef.current = currentNote
    setNoteDraft(currentNote)
  }, [currentNote])

  // On unmount, try to flush any pending save (best-effort).
  useEffect(() => {
    return () => {
      void flushPendingNoteSave()
    }
  }, [flushPendingNoteSave])

  // Get available subjects
  const availableSubjects = subjectConfigs.map((s) => s.name)

  const content = (
    <>
      <CardHeader
        icon="🗓️"
        title="Plan Day"
        subtitle={formatDateDisplay(selectedDate)}
      />

      <div className="space-y-6">
        {/* Agenda Section */}
        <AgendaManager
          selectedDate={selectedDate}
          todayISO={todayISO}
          dayDetails={dayDetails}
          agendaItems={agendaItems}
          availableSubjects={availableSubjects}
          onUpdateDetails={onUpdateDetails}
          onStatus={onStatus}
        />

        {/* Financial & Travel Summary */}
        {activityCards.length > 0 && (
          <div className="space-y-3">
            {activityCards.map((card) => (
              <ActivityCard key={`${card.type}-${card.title}`} config={card} />
            ))}
          </div>
        )}

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

          <SubjectEntries
            currentSubjects={currentSubjects}
            subjectConfigs={subjectConfigs}
            availableSubjects={availableSubjects}
            selectedDate={selectedDate}
            onUpdateSubjects={updateSubjects}
            onAddSubject={onAddSubject}
            onAddTopic={onAddTopic}
            isTopicInUse={isTopicInUse}
            totalHours={totalHours}
          />
        </div>

        {/* Notes Section */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-white/60">
            📝 Daily Notes
          </label>
          <textarea
            data-testid="notes-input"
            value={noteDraft}
            onChange={(e) => {
              const next = e.target.value
              isNoteDirtyRef.current = true
              noteDraftRef.current = next
              setNoteDraft(next)

              scheduleNoteSave(selectedDate, next)
              notifyTyping('Typing…')
            }}
            onBlur={() => {
              void flushPendingNoteSave()
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
