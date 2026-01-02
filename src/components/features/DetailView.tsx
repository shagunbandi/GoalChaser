'use client'

import { useRef, useMemo, useState } from 'react'
import type {
  DayDetails,
  SubjectConfig,
  SubjectEntry,
  SuccessCriterion,
} from '@/types'
import { Card, CardHeader } from '@/components/ui'
import { StatusSelector } from './StatusSelector'
import { HoursSummary } from './HoursSummary'
import { SubjectManager } from './SubjectManager'
import { PlanManager } from './PlanManager'
import { SubjectEntries } from './SubjectEntries'
import { formatDateDisplay } from '@/lib/dateUtils'

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
  const typingTimer = useRef<NodeJS.Timeout | null>(null)

  const details = dayDetails[selectedDate]
  const currentStatus = details?.status || null
  const currentNote = details?.note || ''
  const currentSubjects: SubjectEntry[] = details?.subjects || []
  const plannedItems = useMemo(
    () => details?.plannedItems || [],
    [details?.plannedItems],
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
    if (typingTimer.current) {
      clearTimeout(typingTimer.current)
    }
    typingTimer.current = setTimeout(() => {
      onStatus?.({ text: 'Typing saved', tone: 'success' })
    }, 900)
  }

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
        {/* Planning Section */}
        <PlanManager
          selectedDate={selectedDate}
          todayISO={todayISO}
          dayDetails={dayDetails}
          plannedItems={plannedItems}
          availableSubjects={availableSubjects}
          onUpdateDetails={onUpdateDetails}
          onStatus={onStatus}
        />

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
