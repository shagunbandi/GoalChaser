'use client'

import { useState } from 'react'
import type { SubjectEntry, SubjectConfig } from '@/plugins/hours/types'

const hoursToParts = (value: number) => {
  const totalMinutes = Math.round(Math.max(0, value) * 60)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return { hours, minutes }
}

interface SubjectEntriesProps {
  currentSubjects: SubjectEntry[]
  subjectConfigs: SubjectConfig[]
  availableSubjects: string[]
  selectedDate: string
  onUpdateSubjects: (subjects: SubjectEntry[]) => void
  onAddSubject: (name: string) => void
  onAddTopic: (subjectId: string, topic: string) => void
  isTopicInUse: (subjectId: string, topic: string) => boolean
  totalHours: number
}

export function SubjectEntries({
  currentSubjects,
  subjectConfigs,
  availableSubjects,
  onUpdateSubjects,
  onAddSubject,
  onAddTopic,
  isTopicInUse,
  totalHours,
}: SubjectEntriesProps) {
  const [showAddSubject, setShowAddSubject] = useState(false)
  const [newSubjectInput, setNewSubjectInput] = useState('')
  const [expandedSubjectIndex, setExpandedSubjectIndex] = useState<number | null>(
    null,
  )
  const [showAddTopicForSubject, setShowAddTopicForSubject] = useState<
    string | null
  >(null)
  const [newTopicInput, setNewTopicInput] = useState('')

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

  // Add a new subject entry
  const handleAddSubjectEntry = (subjectName: string) => {
    const existingEntry = currentSubjects.find((s) => s.subject === subjectName)
    if (existingEntry) return // Already added

    const newEntry: SubjectEntry = {
      subject: subjectName,
      topics: [],
      hours: 0,
    }
    onUpdateSubjects([...currentSubjects, newEntry])
    setExpandedSubjectIndex(currentSubjects.length)
  }

  // Remove a subject entry
  const handleRemoveSubjectEntry = (index: number) => {
    const newSubjects = currentSubjects.filter((_, i) => i !== index)
    onUpdateSubjects(newSubjects)
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
    onUpdateSubjects(newSubjects)
  }

  // Update hours for a subject entry
  const handleUpdateHours = (subjectIndex: number, hours: number) => {
    const newSubjects = currentSubjects.map((s, i) =>
      i === subjectIndex ? { ...s, hours: Math.max(0, hours) } : s,
    )
    onUpdateSubjects(newSubjects)
  }

  const handleSetHoursParts = (
    subjectIndex: number,
    hoursPart: number,
    minutesPart: number,
  ) => {
    const safeHours = Math.max(0, Math.floor(hoursPart))
    const safeMinutes = Math.min(59, Math.max(0, Math.floor(minutesPart)))
    const totalMinutes = safeHours * 60 + safeMinutes
    handleUpdateHours(subjectIndex, totalMinutes / 60)
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

  // Get subjects not yet added
  const availableToAdd = availableSubjects.filter(
    (s) => !currentSubjects.find((entry) => entry.subject === s),
  )

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-white/60">
          Subjects
        </label>
        {totalHours > 0 && (
          <span className="text-xs text-[#32D4DE]">
            Total: {hoursToParts(totalHours).hours}h {hoursToParts(totalHours).minutes}m
          </span>
        )}
      </div>

      {/* Added Subjects */}
      {currentSubjects.length > 0 && (
        <div className="space-y-2">
          {currentSubjects.map((entry, index) => {
            const hasTopics = subjectHasTopics(entry.subject)
            const isExpanded = expandedSubjectIndex === index
            const { hours: hoursPart, minutes: minutesPart } = hoursToParts(
              entry.hours,
            )

            return (
              <div
                key={entry.subject}
                data-testid={`subject-entry-${entry.subject}`}
                className={`
                  backdrop-blur-sm rounded-xl overflow-hidden
                  ${
                    hasTopics
                      ? 'bg-white/[0.03] border border-white/[0.08]'
                      : 'bg-[#30D158]/20 border-[#30D158]/30'
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
                      <span className="text-xs text-[#30D158]/70">✓ Done</span>
                    )}
                    {hasTopics && entry.topics.length > 0 && (
                      <span className="text-xs text-white/40">
                        {entry.topics.length} topic
                        {entry.topics.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {(hoursPart > 0 || minutesPart > 0) && (
                      <span className="text-xs text-[#30D158] font-medium">
                        {hoursPart}h {minutesPart}m
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
                      <label className="text-xs text-white/40">Topics</label>
                      <div className="flex flex-wrap gap-2">
                        {getTopicsForSubject(entry.subject).map((topic) => (
                          <button
                            key={topic}
                            data-testid={`topic-${entry.subject}-${topic}`}
                            data-selected={entry.topics.includes(topic)}
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
                              onChange={(e) => setNewTopicInput(e.target.value)}
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
                      <div className="flex items-center rounded-2xl border border-white/[0.1] bg-black/20 px-3 py-1 text-sm gap-3">
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            aria-label="Hours spent"
                            data-testid={`hours-input-${entry.subject}`}
                            value={hoursPart}
                            onChange={(e) =>
                              handleSetHoursParts(
                                index,
                                parseInt(e.target.value, 10) || 0,
                                minutesPart,
                              )
                            }
                            className="
                              w-16 min-w-[3.5rem] rounded-xl border border-white/[0.1] bg-white/5 px-3 py-1 text-center text-white text-xs
                              focus:border-[#30D158]/50 focus:outline-none
                            "
                          />
                          <span className="text-xs text-white/40">h</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            max="59"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            aria-label="Minutes spent"
                            value={minutesPart}
                            onChange={(e) =>
                              handleSetHoursParts(
                                index,
                                hoursPart,
                                parseInt(e.target.value, 10) || 0,
                              )
                            }
                            className="
                              w-16 min-w-[3.5rem] rounded-xl border border-white/[0.1] bg-white/5 px-3 py-1 text-center text-white text-xs
                              focus:border-[#30D158]/50 focus:outline-none
                            "
                          />
                          <span className="text-xs text-white/40">m</span>
                        </div>
                      </div>
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
                      <span className="text-xs text-white/40 ml-1">hours</span>
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
              data-testid={`add-subject-${subject}`}
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
  )
}

