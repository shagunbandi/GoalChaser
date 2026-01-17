'use client'

import type { ReactNode } from 'react'
import { useState, useEffect } from 'react'
import type { PluginDetailProvider } from '@/sdk'
import { NotesField } from '@/sdk'
import type { StudyDayData, SubjectEntry, SubjectConfig } from './types'
import { SubjectEntries } from './components/SubjectEntries'
import { StudySummary } from './components/StudySummary'
import { SubjectManager } from './components/SubjectManager'

export class StudyDetailProviderImpl
  implements PluginDetailProvider<StudyDayData>
{
  renderDetail(
    data: StudyDayData | null,
    date: string,
    onUpdate: (updates: Partial<StudyDayData>) => Promise<void>,
    context?: {
      subjectConfigs?: SubjectConfig[]
      maxHours?: number
      onAddSubject?: (name: string) => void
      onAddTopic?: (subjectId: string, topic: string) => void
      onRemoveTopic?: (subjectId: string, topic: string) => void
      onUpdateTopic?: (
        subjectId: string,
        oldTopic: string,
        newTopic: string,
      ) => void
      onRemoveSubject?: (id: string) => void
      onUpdateSubject?: (id: string, name: string) => void
      onToggleHasTopics?: (id: string) => void
      isTopicInUse?: (subjectId: string, topic: string) => boolean
    },
  ): ReactNode {
    return (
      <StudyDetailSection
        data={data}
        date={date}
        onUpdate={onUpdate}
        subjectConfigs={context?.subjectConfigs || []}
        maxHours={context?.maxHours || 14}
        onAddSubject={context?.onAddSubject || (() => {})}
        onAddTopic={context?.onAddTopic || (() => {})}
        onRemoveTopic={context?.onRemoveTopic || (() => {})}
        onUpdateTopic={context?.onUpdateTopic || (() => {})}
        onRemoveSubject={context?.onRemoveSubject || (() => {})}
        onUpdateSubject={context?.onUpdateSubject || (() => {})}
        onToggleHasTopics={context?.onToggleHasTopics || (() => {})}
        isTopicInUse={context?.isTopicInUse || (() => false)}
      />
    )
  }
}

interface StudyDetailSectionProps {
  data: StudyDayData | null
  date: string
  onUpdate: (updates: Partial<StudyDayData>) => Promise<void>
  subjectConfigs: SubjectConfig[]
  maxHours: number
  onAddSubject: (name: string) => void
  onAddTopic: (subjectId: string, topic: string) => void
  onRemoveTopic: (subjectId: string, topic: string) => void
  onUpdateTopic: (subjectId: string, oldTopic: string, newTopic: string) => void
  onRemoveSubject: (id: string) => void
  onUpdateSubject: (id: string, name: string) => void
  onToggleHasTopics: (id: string) => void
  isTopicInUse: (subjectId: string, topic: string) => boolean
}

function StudyDetailSection({
  data,
  date,
  onUpdate,
  subjectConfigs,
  maxHours,
  onAddSubject,
  onAddTopic,
  onRemoveTopic,
  onUpdateTopic,
  onRemoveSubject,
  onUpdateSubject,
  onToggleHasTopics,
  isTopicInUse,
}: StudyDetailSectionProps) {
  const [showSubjectManager, setShowSubjectManager] = useState(false)

  // Draft state for subjects
  const [draftSubjects, setDraftSubjects] = useState<SubjectEntry[]>(
    data?.subjects || [],
  )

  // Initialize draft data when data changes (e.g., switching days)
  useEffect(() => {
    setDraftSubjects(data?.subjects || [])
  }, [date, data])

  const handleUpdateSubjects = async (subjects: SubjectEntry[]) => {
    setDraftSubjects(subjects)
    await onUpdate({ subjects })
  }

  const handleDirectHoursChange = async (hours: number) => {
    await onUpdate({ directHours: hours })
  }

  const availableSubjects = subjectConfigs.map((s) => s.name)

  // Calculate hours
  const subjectHours = draftSubjects.reduce((sum, s) => sum + (s.hours || 0), 0)
  const directHours = data?.directHours || 0
  const totalHours = subjectHours > 0 ? subjectHours : directHours

  return (
    <div className="space-y-6">
      {/* Study Hours Summary with Progress Bar */}
      <StudySummary
        totalHours={totalHours}
        subjectHours={subjectHours}
        directHours={directHours}
        maxHours={maxHours as 8 | 14 | 18}
        onDirectHoursChange={handleDirectHoursChange}
      />

      {/* Divider */}
      <div className="border-t border-white/10" />

      {/* Track by Subject Section */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-white/60">
          Track by Subject
        </label>

        {/* Subject Entries */}
        <SubjectEntries
          currentSubjects={draftSubjects}
          subjectConfigs={subjectConfigs}
          availableSubjects={availableSubjects}
          selectedDate={date}
          onUpdateSubjects={handleUpdateSubjects}
          onAddSubject={onAddSubject}
          onAddTopic={onAddTopic}
          isTopicInUse={isTopicInUse}
          totalHours={subjectHours}
        />

        {/* Manage Subjects & Topics Button */}
        <button
          onClick={() => setShowSubjectManager(true)}
          className="
            w-full py-3 px-4 rounded-xl
            bg-white/[0.02] hover:bg-white/[0.05]
            border border-dashed border-white/[0.1] hover:border-white/[0.2]
            text-white/40 hover:text-white/70
            transition-all duration-200
            flex items-center justify-center gap-2
            text-sm font-medium
          "
        >
          <span>⚙️</span> Manage Subjects & Topics
        </button>
      </div>

      {/* Notes */}
      <NotesField
        value={data?.notes || ''}
        onSave={async (notes) => await onUpdate({ notes })}
        label="Study Notes"
        placeholder="Notes about your study session..."
        icon="📝"
        accentColor="#8B5CF6"
        resetKey={date}
      />

      {/* Subject Manager Modal */}
      {showSubjectManager && (
        <SubjectManager
          isOpen={showSubjectManager}
          subjectConfigs={subjectConfigs}
          onClose={() => setShowSubjectManager(false)}
          onAddSubject={onAddSubject}
          onRemoveSubject={onRemoveSubject}
          onUpdateSubject={onUpdateSubject}
          onToggleHasTopics={onToggleHasTopics}
          onAddTopic={onAddTopic}
          onRemoveTopic={onRemoveTopic}
          onUpdateTopic={onUpdateTopic}
          isTopicInUse={isTopicInUse}
        />
      )}
    </div>
  )
}
