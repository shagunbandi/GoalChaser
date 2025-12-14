'use client'

import { useState } from 'react'
import type { DayDetails, SubjectConfig } from '@/types'
import { Card, CardHeader } from '@/components/ui'
import { StatusSelector } from './StatusSelector'
import { formatDateDisplay } from '@/lib/dateUtils'

interface DetailViewProps {
  selectedDate: string
  dayDetails: Record<string, DayDetails>
  subjectConfigs: SubjectConfig[]
  onUpdateDetails: (iso: string, details: Partial<DayDetails>) => void
  onAddSubject: (name: string) => void
  onAddTopic: (subjectId: string, topic: string) => void
  noCard?: boolean
}

export function DetailView({
  selectedDate,
  dayDetails,
  subjectConfigs,
  onUpdateDetails,
  onAddSubject,
  onAddTopic,
  noCard = false,
}: DetailViewProps) {
  const [showAddSubject, setShowAddSubject] = useState(false)
  const [showAddTopic, setShowAddTopic] = useState(false)
  const [newSubjectInput, setNewSubjectInput] = useState('')
  const [newTopicInput, setNewTopicInput] = useState('')

  const details = dayDetails[selectedDate]
  const currentSubject = details?.subject || ''
  const currentTopic = details?.topic || ''
  const currentStatus = details?.status || null
  const currentNote = details?.note || ''

  // Get available subjects and topics
  const availableSubjects = subjectConfigs.map((s) => s.name)
  const selectedSubjectConfig = subjectConfigs.find(
    (s) => s.name === currentSubject,
  )
  const availableTopics = currentSubject
    ? selectedSubjectConfig?.topics || []
    : subjectConfigs
        .flatMap((s) => s.topics)
        .filter((v, i, a) => a.indexOf(v) === i)

  const handleSubjectSelect = (subject: string) => {
    onUpdateDetails(selectedDate, { subject, topic: '' })
    setShowAddSubject(false)
  }

  const handleTopicSelect = (topic: string) => {
    onUpdateDetails(selectedDate, { topic })
    setShowAddTopic(false)
  }

  const handleAddNewSubject = () => {
    if (newSubjectInput.trim()) {
      onAddSubject(newSubjectInput.trim())
      onUpdateDetails(selectedDate, {
        subject: newSubjectInput.trim(),
        topic: '',
      })
      setNewSubjectInput('')
      setShowAddSubject(false)
    }
  }

  const handleAddNewTopic = () => {
    if (newTopicInput.trim() && selectedSubjectConfig) {
      onAddTopic(selectedSubjectConfig.id, newTopicInput.trim())
      onUpdateDetails(selectedDate, { topic: newTopicInput.trim() })
      setNewTopicInput('')
      setShowAddTopic(false)
    }
  }

  const content = (
    <>
      <CardHeader
        icon="📝"
        title="Day Details"
        subtitle={formatDateDisplay(selectedDate)}
      />

      <div className="space-y-6">
        {/* Status Selector */}
        <StatusSelector
          value={currentStatus}
          onChange={(status) => {
            onUpdateDetails(selectedDate, { status })
          }}
        />

        {/* Subject Selector */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-white/60">
            Subject
          </label>
          {availableSubjects.length > 0 && !showAddSubject ? (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {availableSubjects.map((subject) => (
                  <button
                    key={subject}
                    onClick={() => handleSubjectSelect(subject)}
                    className={`
                      px-4 py-2.5 rounded-xl text-sm font-medium 
                      transition-all duration-200 backdrop-blur-sm
                      ${
                        currentSubject === subject
                          ? 'bg-[#007AFF] text-white shadow-[0_0_25px_rgba(0,122,255,0.3)] border border-[#007AFF]/50'
                          : 'bg-white/[0.03] text-white/70 hover:bg-white/[0.08] border border-white/[0.06] hover:border-white/[0.1]'
                      }
                    `}
                  >
                    {subject}
                  </button>
                ))}
                <button
                  onClick={() => setShowAddSubject(true)}
                  className="
                    px-4 py-2.5 rounded-xl text-sm font-medium
                    bg-white/[0.02] text-white/40 
                    hover:bg-white/[0.05] hover:text-white/70
                    border border-dashed border-white/[0.1] hover:border-white/[0.2]
                    transition-all duration-200
                  "
                >
                  + New
                </button>
              </div>
              {currentSubject && (
                <button
                  onClick={() => {
                    onUpdateDetails(selectedDate, { subject: '', topic: '' })
                  }}
                  className="text-xs text-white/30 hover:text-white/60 transition-colors"
                >
                  Clear selection
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSubjectInput}
                  onChange={(e) => setNewSubjectInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddNewSubject()}
                  placeholder="Enter new subject name..."
                  className="
                    flex-1 px-4 py-3
                    bg-white/[0.03] backdrop-blur-xl
                    border border-white/[0.08] rounded-xl
                    text-white placeholder-white/30
                    focus:outline-none focus:border-[#007AFF]/50
                    focus:shadow-[0_0_0_3px_rgba(0,122,255,0.1)]
                    transition-all duration-200
                  "
                  autoFocus
                />
                <button
                  onClick={handleAddNewSubject}
                  disabled={!newSubjectInput.trim()}
                  className="
                    px-5 py-3
                    bg-[#007AFF] hover:bg-[#007AFF]/80
                    disabled:bg-white/[0.05] disabled:text-white/30 disabled:cursor-not-allowed
                    text-white font-medium rounded-xl
                    shadow-[0_0_20px_rgba(0,122,255,0.3)]
                    disabled:shadow-none
                    transition-all duration-200
                  "
                >
                  Add
                </button>
                {availableSubjects.length > 0 && (
                  <button
                    onClick={() => {
                      setShowAddSubject(false)
                      setNewSubjectInput('')
                    }}
                    className="
                      px-4 py-3
                      bg-white/[0.05] hover:bg-white/[0.1]
                      text-white/60 hover:text-white/80
                      rounded-xl
                      transition-all duration-200
                    "
                  >
                    Cancel
                  </button>
                )}
              </div>
              {availableSubjects.length === 0 && (
                <p className="text-xs text-white/30">
                  No subjects yet. Add your first subject above.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Topic Selector */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-white/60">
            Topic
          </label>
          {availableTopics.length > 0 && !showAddTopic ? (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {availableTopics.map((topic) => (
                  <button
                    key={topic}
                    onClick={() => handleTopicSelect(topic)}
                    className={`
                      px-4 py-2.5 rounded-xl text-sm font-medium 
                      transition-all duration-200 backdrop-blur-sm
                      ${
                        currentTopic === topic
                          ? 'bg-[#AF52DE] text-white shadow-[0_0_25px_rgba(175,82,222,0.3)] border border-[#AF52DE]/50'
                          : 'bg-white/[0.03] text-white/70 hover:bg-white/[0.08] border border-white/[0.06] hover:border-white/[0.1]'
                      }
                    `}
                  >
                    {topic}
                  </button>
                ))}
                {currentSubject && (
                  <button
                    onClick={() => setShowAddTopic(true)}
                    className="
                      px-4 py-2.5 rounded-xl text-sm font-medium
                      bg-white/[0.02] text-white/40 
                      hover:bg-white/[0.05] hover:text-white/70
                      border border-dashed border-white/[0.1] hover:border-white/[0.2]
                      transition-all duration-200
                    "
                  >
                    + New
                  </button>
                )}
              </div>
              {currentTopic && (
                <button
                  onClick={() => {
                    onUpdateDetails(selectedDate, { topic: '' })
                  }}
                  className="text-xs text-white/30 hover:text-white/60 transition-colors"
                >
                  Clear selection
                </button>
              )}
            </div>
          ) : currentSubject ? (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTopicInput}
                  onChange={(e) => setNewTopicInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddNewTopic()}
                  placeholder="Enter new topic name..."
                  className="
                    flex-1 px-4 py-3
                    bg-white/[0.03] backdrop-blur-xl
                    border border-white/[0.08] rounded-xl
                    text-white placeholder-white/30
                    focus:outline-none focus:border-[#AF52DE]/50
                    focus:shadow-[0_0_0_3px_rgba(175,82,222,0.1)]
                    transition-all duration-200
                  "
                  autoFocus
                />
                <button
                  onClick={handleAddNewTopic}
                  disabled={!newTopicInput.trim()}
                  className="
                    px-5 py-3
                    bg-[#AF52DE] hover:bg-[#AF52DE]/80
                    disabled:bg-white/[0.05] disabled:text-white/30 disabled:cursor-not-allowed
                    text-white font-medium rounded-xl
                    shadow-[0_0_20px_rgba(175,82,222,0.3)]
                    disabled:shadow-none
                    transition-all duration-200
                  "
                >
                  Add
                </button>
                {availableTopics.length > 0 && (
                  <button
                    onClick={() => {
                      setShowAddTopic(false)
                      setNewTopicInput('')
                    }}
                    className="
                      px-4 py-3
                      bg-white/[0.05] hover:bg-white/[0.1]
                      text-white/60 hover:text-white/80
                      rounded-xl
                      transition-all duration-200
                    "
                  >
                    Cancel
                  </button>
                )}
              </div>
              {availableTopics.length === 0 && (
                <p className="text-xs text-white/30">
                  No topics for this subject yet. Add your first topic above.
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs text-white/30">
              Select a subject first to add topics.
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
            }}
            placeholder="Write something about your day..."
            rows={4}
            className="
              w-full px-4 py-3.5
              bg-white/[0.03] backdrop-blur-xl
              border border-white/[0.08] rounded-2xl
              text-white placeholder-white/30
              focus:outline-none focus:border-[#FF9500]/50
              focus:shadow-[0_0_0_3px_rgba(255,149,0,0.1)]
              transition-all duration-200 resize-none
            "
          />
          <p className="text-xs text-white/30">
            {currentNote.length > 0
              ? `${currentNote.length} characters`
              : 'Add notes to remember what you did today'}
          </p>
        </div>
      </div>
    </>
  )

  if (noCard) {
    return <div className="p-6">{content}</div>
  }

  return <Card className="p-6">{content}</Card>
}
