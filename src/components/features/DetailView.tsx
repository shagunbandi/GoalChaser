'use client'

import { useState } from 'react'
import type { DayDetails, SubjectConfig, SubjectEntry } from '@/types'
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
  const [newSubjectInput, setNewSubjectInput] = useState('')
  const [expandedSubjectIndex, setExpandedSubjectIndex] = useState<
    number | null
  >(null)
  const [showAddTopicForSubject, setShowAddTopicForSubject] = useState<
    string | null
  >(null)
  const [newTopicInput, setNewTopicInput] = useState('')

  const details = dayDetails[selectedDate]
  const currentStatus = details?.status || null
  const currentNote = details?.note || ''
  const currentSubjects: SubjectEntry[] = details?.subjects || []

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

  // Calculate total hours
  const totalHours = currentSubjects.reduce((sum, s) => sum + s.hours, 0)

  // Get subjects not yet added
  const availableToAdd = availableSubjects.filter(
    (s) => !currentSubjects.find((entry) => entry.subject === s),
  )

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

        {/* Subjects Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-white/60">
              Subjects
            </label>
            {totalHours > 0 && (
              <span className="text-xs text-[#32D4DE]">
                Total: {totalHours}h
              </span>
            )}
          </div>

          {/* Added Subjects */}
          {currentSubjects.length > 0 && (
            <div className="space-y-2">
              {currentSubjects.map((entry, index) => (
                <div
                  key={entry.subject}
                  className="
                    bg-white/[0.03] backdrop-blur-sm
                    border border-white/[0.08] rounded-xl
                    overflow-hidden
                  "
                >
                  {/* Subject Header */}
                  <div
                    className="flex items-center justify-between p-3 cursor-pointer hover:bg-white/[0.02]"
                    onClick={() =>
                      setExpandedSubjectIndex(
                        expandedSubjectIndex === index ? null : index,
                      )
                    }
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-[#007AFF] font-medium">
                        {entry.subject}
                      </span>
                      {entry.topics.length > 0 && (
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
                      <span className="text-white/30 text-xs">
                        {expandedSubjectIndex === index ? '▲' : '▼'}
                      </span>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {expandedSubjectIndex === index && (
                    <div className="border-t border-white/[0.06] p-3 space-y-4">
                      {/* Topics */}
                      <div className="space-y-2">
                        <label className="text-xs text-white/40">Topics</label>
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
              ))}
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
    </>
  )

  if (noCard) {
    return <div className="p-6">{content}</div>
  }

  return <Card className="p-6">{content}</Card>
}
