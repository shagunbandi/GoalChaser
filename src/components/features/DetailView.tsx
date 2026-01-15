'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type {
  DayDetails,
  SubjectConfig,
  SubjectEntry,
  SuccessCriterion,
} from '@/types'
import { Card, CardHeader } from '@/components/ui'
import { NOTES_DEBOUNCE_MS } from '@/constants'
import { StatusSelector } from './StatusSelector'
import { HoursSummary } from './HoursSummary'
import { SubjectManager } from './SubjectManager'
import { AgendaManager } from './agenda'
import { SubjectEntries } from './SubjectEntries'
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
}: DetailViewProps) {
  const isHoursBasedGoal = successCriterion?.type === 'hours'
  const [showSubjectManager, setShowSubjectManager] = useState(false)
  const [expenseExpanded, setExpenseExpanded] = useState(false)
  const [incomeExpanded, setIncomeExpanded] = useState(false)
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
  // Support both old (plannedItems) and new (agendaItems) field names for backward compatibility
  const agendaItems = useMemo(
    () => details?.agendaItems || details?.plannedItems || [],
    [details?.agendaItems, details?.plannedItems],
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
        {(() => {
          const dayData = dayDetails[selectedDate] || {}
          const expenses = dayData.expenses || []
          const income = dayData.income || []
          const travelPlans = dayData.travelPlans || []
          
          if (expenses.length === 0 && income.length === 0 && travelPlans.length === 0) {
            return null
          }
          
          return (
            <div className="space-y-3">
              {/* Expenses Card - Collapsible */}
              {expenses.length > 0 && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3">
                  <button
                    onClick={() => setExpenseExpanded(!expenseExpanded)}
                    className="w-full flex items-center justify-between hover:opacity-80 transition-opacity"
                  >
                    <span className="text-xs text-white/70 font-medium">💸 Expenses</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-red-400 font-semibold">
                        -₹{expenses.reduce((sum, e) => sum + e.amount, 0).toLocaleString('en-IN')}
                      </span>
                      <span className="text-white/40 text-xs">
                        {expenseExpanded ? '▲' : '▼'}
                      </span>
                    </div>
                  </button>
                  
                  {expenseExpanded && (
                    <div className="space-y-1.5 mt-2 pt-2 border-t border-red-500/20">
                      {expenses.map((expense) => (
                        <div key={expense.id} className="flex justify-between text-[11px]">
                          <span className="text-white/60">{expense.categoryName}</span>
                          <span className="text-white/80">₹{expense.amount.toLocaleString('en-IN')}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {/* Income Card - Collapsible */}
              {income.length > 0 && (
                <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-3">
                  <button
                    onClick={() => setIncomeExpanded(!incomeExpanded)}
                    className="w-full flex items-center justify-between hover:opacity-80 transition-opacity"
                  >
                    <span className="text-xs text-white/70 font-medium">💰 Income</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-green-400 font-semibold">
                        +₹{income.reduce((sum, i) => sum + i.amount, 0).toLocaleString('en-IN')}
                      </span>
                      <span className="text-white/40 text-xs">
                        {incomeExpanded ? '▲' : '▼'}
                      </span>
                    </div>
                  </button>
                  
                  {incomeExpanded && (
                    <div className="space-y-1.5 mt-2 pt-2 border-t border-green-500/20">
                      {income.map((inc) => (
                        <div key={inc.id} className="flex justify-between text-[11px]">
                          <span className="text-white/60">{inc.categoryName}</span>
                          <span className="text-white/80">₹{inc.amount.toLocaleString('en-IN')}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {/* Travel Cards */}
              {travelPlans.map((travel) => (
                <div key={travel.id} className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs">✈️</span>
                    <span className="text-xs text-blue-400 font-medium">{travel.title}</span>
                  </div>
                  {travel.note && (
                    <div className="text-[11px] text-white/50 mt-1">{travel.note}</div>
                  )}
                  <div className="text-[10px] text-white/40 mt-1">
                    {new Date(travel.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    {' → '}
                    {new Date(travel.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              ))}
            </div>
          )
        })()}

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
