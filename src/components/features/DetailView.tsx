'use client'

import { useState } from 'react'
import type { DayDetails, SubjectConfig } from '@/types'
import { Card, CardHeader } from '@/components/ui'
import { StatusSelector } from './StatusSelector'
import { formatDateDisplay } from '@/lib/dateUtils'
import { getScoreCategory, getScoreLabel, getScoreEmoji } from '@/lib/scoreUtils'

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
  const [feedback, setFeedback] = useState('')
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
    (s) => s.name === currentSubject
  )
  const availableTopics = currentSubject
    ? selectedSubjectConfig?.topics || []
    : subjectConfigs
        .flatMap((s) => s.topics)
        .filter((v, i, a) => a.indexOf(v) === i)

  const showFeedback = (message: string) => {
    setFeedback(message)
    setTimeout(() => setFeedback(''), 2500)
  }

  const handleSubjectSelect = (subject: string) => {
    onUpdateDetails(selectedDate, { subject, topic: '' })
    showFeedback(`📚 Subject set to: ${subject}`)
    setShowAddSubject(false)
  }

  const handleTopicSelect = (topic: string) => {
    onUpdateDetails(selectedDate, { topic })
    showFeedback(`🏷️ Topic set to: ${topic}`)
    setShowAddTopic(false)
  }

  const handleAddNewSubject = () => {
    if (newSubjectInput.trim()) {
      onAddSubject(newSubjectInput.trim())
      onUpdateDetails(selectedDate, {
        subject: newSubjectInput.trim(),
        topic: '',
      })
      showFeedback(`✅ Created and selected: ${newSubjectInput.trim()}`)
      setNewSubjectInput('')
      setShowAddSubject(false)
    }
  }

  const handleAddNewTopic = () => {
    if (newTopicInput.trim() && selectedSubjectConfig) {
      onAddTopic(selectedSubjectConfig.id, newTopicInput.trim())
      onUpdateDetails(selectedDate, { topic: newTopicInput.trim() })
      showFeedback(`✅ Created and selected: ${newTopicInput.trim()}`)
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

      <div className="space-y-5">
        {/* Status Selector */}
        <StatusSelector
          value={currentStatus}
          onChange={(status) => {
            onUpdateDetails(selectedDate, { status })
            if (status) {
              const category = getScoreCategory(status)
              const emoji = getScoreEmoji(status)
              const label = getScoreLabel(status)
              showFeedback(`Score set to ${status}/10 (${label}) ${emoji}`)
            }
          }}
        />

        {/* Subject Selector */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-300">
            Subject
          </label>
          {availableSubjects.length > 0 && !showAddSubject ? (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {availableSubjects.map((subject) => (
                  <button
                    key={subject}
                    onClick={() => handleSubjectSelect(subject)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      currentSubject === subject
                        ? 'bg-cyan-500 text-white'
                        : 'bg-white/10 text-slate-300 hover:bg-white/20'
                    }`}
                  >
                    {subject}
                  </button>
                ))}
                <button
                  onClick={() => setShowAddSubject(true)}
                  className="px-3 py-2 rounded-lg text-sm font-medium bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-dashed border-white/20 transition-all"
                >
                  + New
                </button>
              </div>
              {currentSubject && (
                <button
                  onClick={() => {
                    onUpdateDetails(selectedDate, { subject: '', topic: '' })
                    showFeedback('Subject cleared')
                  }}
                  className="text-xs text-slate-500 hover:text-slate-300"
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
                  className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                  autoFocus
                />
                <button
                  onClick={handleAddNewSubject}
                  disabled={!newSubjectInput.trim()}
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors"
                >
                  Add
                </button>
                {availableSubjects.length > 0 && (
                  <button
                    onClick={() => {
                      setShowAddSubject(false)
                      setNewSubjectInput('')
                    }}
                    className="px-3 py-2 bg-white/10 hover:bg-white/20 text-slate-300 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
              {availableSubjects.length === 0 && (
                <p className="text-xs text-slate-500">
                  No subjects yet. Add your first subject above or in Settings.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Topic Selector */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-300">
            Topic
          </label>
          {availableTopics.length > 0 && !showAddTopic ? (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {availableTopics.map((topic) => (
                  <button
                    key={topic}
                    onClick={() => handleTopicSelect(topic)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      currentTopic === topic
                        ? 'bg-violet-500 text-white'
                        : 'bg-white/10 text-slate-300 hover:bg-white/20'
                    }`}
                  >
                    {topic}
                  </button>
                ))}
                {currentSubject && (
                  <button
                    onClick={() => setShowAddTopic(true)}
                    className="px-3 py-2 rounded-lg text-sm font-medium bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-dashed border-white/20 transition-all"
                  >
                    + New
                  </button>
                )}
              </div>
              {currentTopic && (
                <button
                  onClick={() => {
                    onUpdateDetails(selectedDate, { topic: '' })
                    showFeedback('Topic cleared')
                  }}
                  className="text-xs text-slate-500 hover:text-slate-300"
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
                  className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-400/50"
                  autoFocus
                />
                <button
                  onClick={handleAddNewTopic}
                  disabled={!newTopicInput.trim()}
                  className="px-4 py-2 bg-violet-500 hover:bg-violet-400 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors"
                >
                  Add
                </button>
                {availableTopics.length > 0 && (
                  <button
                    onClick={() => {
                      setShowAddTopic(false)
                      setNewTopicInput('')
                    }}
                    className="px-3 py-2 bg-white/10 hover:bg-white/20 text-slate-300 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
              {availableTopics.length === 0 && (
                <p className="text-xs text-slate-500">
                  No topics for this subject yet. Add your first topic above.
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-500">
              Select a subject first to add topics.
            </p>
          )}
        </div>

        {/* Notes Section */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-300">
            📝 Daily Notes
          </label>
          <textarea
            value={currentNote}
            onChange={(e) => {
              onUpdateDetails(selectedDate, { note: e.target.value })
            }}
            placeholder="Write something about your day... reflections, accomplishments, thoughts, or anything you want to remember."
            rows={4}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50 transition-all resize-none"
          />
          <p className="text-xs text-slate-500">
            {currentNote.length > 0
              ? `${currentNote.length} characters`
              : 'Add notes to remember what you did today'}
          </p>
        </div>

        {/* Live Feedback */}
        <div
          className={`bg-white/5 rounded-xl p-4 border border-white/10 transition-all duration-300 ${
            feedback ? 'opacity-100' : 'opacity-50'
          }`}
        >
          {feedback ? (
            <p className="text-cyan-400 text-sm font-medium">{feedback}</p>
          ) : (
            <p className="text-slate-500 text-xs">
              {currentSubject || currentTopic ? (
                <>
                  📋 Current:{' '}
                  {currentSubject && (
                    <span className="text-cyan-400">{currentSubject}</span>
                  )}
                  {currentSubject && currentTopic && ' → '}
                  {currentTopic && (
                    <span className="text-violet-400">{currentTopic}</span>
                  )}
                </>
              ) : (
                '💡 Select a subject to get started'
              )}
            </p>
          )}
        </div>
      </div>
    </>
  )

  if (noCard) {
    return <div className="p-5">{content}</div>
  }

  return <Card className="p-5">{content}</Card>
}

