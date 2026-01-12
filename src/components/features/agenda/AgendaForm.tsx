'use client'

import { Modal } from '@/components/ui'
import { RecurrenceSettings } from './RecurrenceSettings'
import type { RepeatType } from '@/types'

interface AgendaFormProps {
  isOpen: boolean
  isEditing: boolean
  title: string
  startTime: string
  endTime: string
  note: string
  repeatType: RepeatType
  repeatDays: string[]
  recurrenceStart: string
  endDateOverride: string
  availableSubjects: string[]
  selectedSubjects: string[]
  onClose: () => void
  onSubmit: () => void
  onTitleChange: (title: string) => void
  onStartTimeChange: (time: string) => void
  onEndTimeChange: (time: string) => void
  onNoteChange: (note: string) => void
  onRepeatTypeChange: (type: RepeatType) => void
  onToggleRepeatDay: (code: string) => void
  onRecurrenceStartChange: (date: string) => void
  onEndDateChange: (date: string) => void
  onToggleSubject: (subject: string) => void
  editingInfo?: string
}

export function AgendaForm({
  isOpen,
  isEditing,
  title,
  startTime,
  endTime,
  note,
  repeatType,
  repeatDays,
  recurrenceStart,
  endDateOverride,
  availableSubjects,
  selectedSubjects,
  onClose,
  onSubmit,
  onTitleChange,
  onStartTimeChange,
  onEndTimeChange,
  onNoteChange,
  onRepeatTypeChange,
  onToggleRepeatDay,
  onRecurrenceStartChange,
  onEndDateChange,
  onToggleSubject,
  editingInfo,
}: AgendaFormProps) {
  return (
    <Modal
      open={isOpen}
      title={isEditing ? 'Edit agenda' : 'Add agenda'}
      onClose={onClose}
      data-testid="modal-agenda-form"
      footer={
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            data-testid="button-cancel-agenda"
            className="
              px-4 py-2 rounded-xl text-sm font-medium
              bg-white/[0.05] text-white/70 hover:bg-white/[0.1]
            "
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={!title.trim()}
            data-testid="button-submit-agenda"
            className="
              px-4 py-2 rounded-xl text-sm font-medium
              bg-gradient-to-r from-[#007AFF] to-[#AF52DE]
              text-white
              disabled:opacity-50 disabled:cursor-not-allowed
              hover:shadow-[0_0_20px_rgba(0,122,255,0.3)]
              transition-all duration-200
            "
          >
            {isEditing ? 'Update' : 'Add'}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <input
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Add an agenda item..."
            data-testid="input-agenda-title"
            className="
              w-full px-3 py-2 rounded-xl
              bg-white/[0.04] border border-white/[0.08]
              text-white placeholder-white/40
              focus:outline-none focus:border-[#AF52DE]/60
            "
          />
          <div className="flex flex-wrap items-center gap-2 text-xs text-white/50">
            {repeatType !== 'none' && (
              <span className="text-[#AF52DE]" data-testid="agenda-repeat-info">
                {repeatType === 'daily' ? 'Daily' : 'Weekly'}
              </span>
            )}
            {editingInfo && (
              <span className="text-white/40" data-testid="agenda-editing-info">
                {editingInfo}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs text-white/40 w-16">Start</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => onStartTimeChange(e.target.value)}
              data-testid="input-start-time"
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
              onChange={(e) => onEndTimeChange(e.target.value)}
              data-testid="input-end-time"
              className="
                flex-1 px-3 py-2 rounded-xl
                bg-white/[0.04] border border-white/[0.08]
                text-white placeholder-white/40
                focus:outline-none focus:border-[#AF52DE]/60
              "
            />
          </div>
        </div>

        <RecurrenceSettings
          repeatType={repeatType}
          repeatDays={repeatDays}
          recurrenceStart={recurrenceStart}
          endDateOverride={endDateOverride}
          onRepeatTypeChange={onRepeatTypeChange}
          onToggleRepeatDay={onToggleRepeatDay}
          onRecurrenceStartChange={onRecurrenceStartChange}
          onEndDateChange={onEndDateChange}
        />

        <div className="space-y-2">
          <label className="text-xs text-white/50">Attach subjects</label>
          <div className="flex flex-wrap gap-2" data-testid="subject-selector">
            {availableSubjects.map((subject) => (
              <button
                key={subject}
                onClick={() => onToggleSubject(subject)}
                data-testid={`button-subject-${subject}`}
                className={`
                  px-3 py-1.5 rounded-xl text-xs font-medium
                  transition-all duration-150 border
                  ${
                    selectedSubjects.includes(subject)
                      ? 'bg-[#30D158]/20 border-[#30D158]/50 text-[#30D158]'
                      : 'bg-white/[0.04] border-white/[0.08] text-white/60 hover:bg-white/[0.08]'
                  }
                `}
              >
                {subject}
              </button>
            ))}
            {availableSubjects.length === 0 && (
              <span className="text-xs text-white/40">No subjects yet</span>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs text-white/50">Note</label>
          <textarea
            value={note}
            onChange={(e) => onNoteChange(e.target.value)}
            rows={2}
            placeholder="Add a note (optional)"
            data-testid="input-agenda-note"
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
    </Modal>
  )
}
