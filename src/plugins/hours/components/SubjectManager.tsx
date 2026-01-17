'use client'

import { useState } from 'react'
import { Drawer } from '@/sdk'
import type { SubjectConfig } from '@/plugins/hours/types'

interface SubjectManagerProps {
  isOpen: boolean
  subjectConfigs: SubjectConfig[]
  onAddSubject: (name: string) => void
  onRemoveSubject: (id: string) => void
  onUpdateSubject: (id: string, name: string) => void
  onToggleHasTopics: (id: string) => void
  onAddTopic: (subjectId: string, topic: string) => void
  onRemoveTopic: (subjectId: string, topic: string) => void
  onUpdateTopic: (subjectId: string, oldTopic: string, newTopic: string) => void
  isTopicInUse: (subjectId: string, topic: string) => boolean
  onClose: () => void
}

export function SubjectManager({
  isOpen,
  subjectConfigs,
  onAddSubject,
  onRemoveSubject,
  onUpdateSubject,
  onToggleHasTopics,
  onAddTopic,
  onRemoveTopic,
  onUpdateTopic,
  isTopicInUse,
  onClose,
}: SubjectManagerProps) {
  const [newSubjectInput, setNewSubjectInput] = useState('')
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null)
  const [editingSubjectName, setEditingSubjectName] = useState('')
  const [expandedSubjectId, setExpandedSubjectId] = useState<string | null>(null)
  const [newTopicInput, setNewTopicInput] = useState('')
  const [showAddTopic, setShowAddTopic] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [editingTopic, setEditingTopic] = useState<{ subjectId: string; topic: string } | null>(null)
  const [editingTopicName, setEditingTopicName] = useState('')
  const [deleteTopicConfirm, setDeleteTopicConfirm] = useState<{ subjectId: string; topic: string } | null>(null)

  const handleAddSubject = () => {
    if (newSubjectInput.trim()) {
      onAddSubject(newSubjectInput.trim())
      setNewSubjectInput('')
    }
  }

  const startEditingSubject = (subject: SubjectConfig) => {
    setEditingSubjectId(subject.id)
    setEditingSubjectName(subject.name)
  }

  const saveSubjectEdit = () => {
    if (editingSubjectId && editingSubjectName.trim()) {
      onUpdateSubject(editingSubjectId, editingSubjectName.trim())
    }
    setEditingSubjectId(null)
    setEditingSubjectName('')
  }

  const cancelSubjectEdit = () => {
    setEditingSubjectId(null)
    setEditingSubjectName('')
  }

  const handleDeleteSubject = (id: string) => {
    onRemoveSubject(id)
    setDeleteConfirm(null)
    if (expandedSubjectId === id) {
      setExpandedSubjectId(null)
    }
  }

  const handleAddTopic = (subjectId: string) => {
    if (newTopicInput.trim()) {
      onAddTopic(subjectId, newTopicInput.trim())
      setNewTopicInput('')
      setShowAddTopic(null)
    }
  }

  const handleRemoveTopic = (subjectId: string, topic: string) => {
    onRemoveTopic(subjectId, topic)
    setDeleteTopicConfirm(null)
  }

  const startEditingTopic = (subjectId: string, topic: string) => {
    setEditingTopic({ subjectId, topic })
    setEditingTopicName(topic)
  }

  const saveTopicEdit = () => {
    if (editingTopic && editingTopicName.trim()) {
      onUpdateTopic(editingTopic.subjectId, editingTopic.topic, editingTopicName.trim())
    }
    setEditingTopic(null)
    setEditingTopicName('')
  }

  const cancelTopicEdit = () => {
    setEditingTopic(null)
    setEditingTopicName('')
  }

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Manage Subjects"
      subtitle={`${subjectConfigs.length} ${subjectConfigs.length === 1 ? 'subject' : 'subjects'} configured`}
      icon="⏱️"
      iconGradient="from-[#007AFF] to-[#5856D6]"
    >
      {/* Add New Subject */}
      <div className="p-6 sm:p-8 border-b border-white/5">
        <div className="flex gap-3">
          <input
            type="text"
            value={newSubjectInput}
            onChange={(e) => setNewSubjectInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddSubject()
            }}
            placeholder="Add new subject (e.g. Mathematics, Physics)..."
            className="
              flex-1 px-5 py-3.5
              bg-white/5 backdrop-blur-xl
              border border-white/10 rounded-xl
              text-white placeholder-white/30
              focus:outline-none focus:border-[#007AFF]/50 focus:bg-white/8
              transition-all duration-200
              text-sm
            "
          />
          <button
            onClick={handleAddSubject}
            disabled={!newSubjectInput.trim()}
            className="
              px-6 py-3.5
              bg-gradient-to-r from-[#007AFF] to-[#5856D6]
              hover:from-[#007AFF]/90 hover:to-[#5856D6]/90
              disabled:from-white/5 disabled:to-white/5
              disabled:text-white/30
              text-white font-semibold rounded-xl
              shadow-lg shadow-[#007AFF]/25
              disabled:shadow-none
              transition-all duration-200
              hover:scale-[1.02] active:scale-[0.98]
              disabled:hover:scale-100
              text-sm whitespace-nowrap
            "
          >
            + Add
          </button>
        </div>
      </div>

      {/* Subject List */}
      <div className="px-6 sm:px-8 py-6">
        {subjectConfigs.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-white/5 to-white/[0.02] flex items-center justify-center border border-white/10">
              <span className="text-5xl opacity-50">📚</span>
            </div>
            <h3 className="text-lg font-semibold text-white/80 mb-2">No subjects yet</h3>
            <p className="text-sm text-white/40 max-w-xs mx-auto">
              Add your first subject above to start tracking your study hours
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {subjectConfigs.map((subject) => (
              <div
                key={subject.id}
                className="
                  group
                  bg-white/[0.04] hover:bg-white/[0.06] backdrop-blur-sm
                  border border-white/10 hover:border-white/15
                  rounded-2xl
                  overflow-hidden
                  transition-all duration-200
                  hover:shadow-lg hover:shadow-black/20
                "
              >
                {/* Subject Header */}
                <div className="flex items-center justify-between p-4 sm:p-5">
                  {editingSubjectId === subject.id ? (
                    <div className="flex-1 flex gap-2 mr-3">
                      <input
                        type="text"
                        value={editingSubjectName}
                        onChange={(e) => setEditingSubjectName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveSubjectEdit()
                          if (e.key === 'Escape') cancelSubjectEdit()
                        }}
                        className="
                          flex-1 px-4 py-2
                          bg-white/10 border border-[#007AFF]/50 rounded-xl
                          text-white text-sm
                          focus:outline-none focus:border-[#007AFF]
                        "
                        autoFocus
                      />
                      <button
                        onClick={saveSubjectEdit}
                        className="px-4 py-2 bg-[#30D158] hover:bg-[#30D158]/90 text-white text-sm font-medium rounded-xl transition-all"
                      >
                        ✓ Save
                      </button>
                      <button
                        onClick={cancelSubjectEdit}
                        className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white/70 text-sm rounded-xl transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div
                      className="flex-1 flex items-center gap-3 cursor-pointer group/header"
                      onClick={() =>
                        setExpandedSubjectId(
                          expandedSubjectId === subject.id ? null : subject.id,
                        )
                      }
                    >
                      <div className="flex-1 flex items-center gap-3">
                        <span className="text-lg font-semibold text-white group-hover/header:text-[#007AFF] transition-colors">
                          {subject.name}
                        </span>
                        <span className="text-xs font-medium text-white/40 bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
                          {subject.topics.length} {subject.topics.length === 1 ? 'topic' : 'topics'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className="text-white/30 text-sm transition-transform duration-200"
                          style={{
                            transform: expandedSubjectId === subject.id ? 'rotate(180deg)' : 'rotate(0deg)',
                          }}
                        >
                          ▼
                        </span>
                      </div>
                    </div>
                  )}

                  {editingSubjectId !== subject.id && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          startEditingSubject(subject)
                        }}
                        className="
                          p-2.5 rounded-xl
                          text-white/40 hover:text-[#FF9500] hover:bg-[#FF9500]/10
                          transition-all duration-200
                        "
                        title="Edit subject"
                      >
                        <span className="text-base">✏️</span>
                      </button>
                      {deleteConfirm === subject.id ? (
                        <div className="flex items-center gap-1 ml-1">
                          <button
                            onClick={() => handleDeleteSubject(subject.id)}
                            className="px-3 py-1.5 bg-[#FF3B30] hover:bg-[#FF3B30]/90 text-white text-sm font-medium rounded-lg transition-all"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="px-3 py-1.5 bg-white/10 hover:bg-white/15 text-white/70 text-sm rounded-lg transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setDeleteConfirm(subject.id)
                          }}
                          className="
                            p-2.5 rounded-xl
                            text-white/40 hover:text-[#FF3B30] hover:bg-[#FF3B30]/10
                            transition-all duration-200
                          "
                          title="Delete subject"
                        >
                          <span className="text-base">🗑️</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Expanded Topics - Implementation continues... */}
                {expandedSubjectId === subject.id && (
                  <div className="border-t border-white/5 bg-black/10 p-4 sm:p-5 space-y-5">
                    {/* Has Topics Toggle */}
                    <div className="flex items-center justify-between p-4 bg-white/[0.02] rounded-xl border border-white/5">
                      <div className="flex-1 pr-4">
                        <label className="text-sm font-medium text-white/80">
                          Enable Topics
                        </label>
                        <p className="text-xs text-white/40 mt-1 leading-relaxed">
                          {subject.hasTopics ?? true
                            ? 'Track specific topics within this subject'
                            : 'Simple on/off tracking (shows as green when done)'}
                        </p>
                      </div>
                      <button
                        onClick={() => onToggleHasTopics(subject.id)}
                        className={`
                          relative w-14 h-8 rounded-full transition-all duration-300
                          ${
                            subject.hasTopics ?? true
                              ? 'bg-[#30D158] shadow-lg shadow-[#30D158]/30'
                              : 'bg-white/20'
                          }
                        `}
                      >
                        <span
                          className={`
                            absolute top-1 w-6 h-6 rounded-full bg-white shadow-lg
                            transition-all duration-300
                            ${subject.hasTopics ?? true ? 'left-7' : 'left-1'}
                          `}
                        />
                      </button>
                    </div>

                    {/* Topics Section */}
                    {(subject.hasTopics ?? true) && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-white/60 uppercase tracking-wider">
                            Topics ({subject.topics.length})
                          </label>
                        </div>

                        {/* Topic List */}
                        {subject.topics.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {subject.topics.map((topic) => {
                              const topicInUse = isTopicInUse(subject.id, topic)
                              const isEditing = editingTopic?.subjectId === subject.id && editingTopic?.topic === topic
                              const isConfirmingDelete = deleteTopicConfirm?.subjectId === subject.id && deleteTopicConfirm?.topic === topic

                              if (isEditing) {
                                return (
                                  <div key={topic} className="flex items-center gap-1.5">
                                    <input
                                      type="text"
                                      value={editingTopicName}
                                      onChange={(e) => setEditingTopicName(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') saveTopicEdit()
                                        if (e.key === 'Escape') cancelTopicEdit()
                                      }}
                                      className="
                                        px-3 py-1.5 w-32
                                        bg-white/10 border border-[#AF52DE]/50 rounded-xl
                                        text-white text-sm
                                        focus:outline-none focus:border-[#AF52DE]
                                      "
                                      autoFocus
                                    />
                                    <button
                                      onClick={saveTopicEdit}
                                      className="px-3 py-1.5 bg-[#30D158] hover:bg-[#30D158]/90 text-white text-sm rounded-xl transition-all"
                                    >
                                      ✓
                                    </button>
                                    <button
                                      onClick={cancelTopicEdit}
                                      className="px-3 py-1.5 bg-white/10 hover:bg-white/15 text-white/70 text-sm rounded-xl transition-all"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                )
                              }

                              return (
                                <div
                                  key={topic}
                                  className="
                                    group/topic flex items-center gap-2
                                    px-3.5 py-2 rounded-xl
                                    bg-[#AF52DE]/15 hover:bg-[#AF52DE]/20
                                    text-[#AF52DE] border border-[#AF52DE]/30
                                    transition-all duration-200
                                  "
                                >
                                  <span className="text-sm font-medium">{topic}</span>
                                  <div className="flex items-center gap-1 opacity-0 group-hover/topic:opacity-100 transition-opacity">
                                    <button
                                      onClick={() => startEditingTopic(subject.id, topic)}
                                      className="
                                        w-6 h-6 rounded-lg
                                        hover:bg-[#FF9500]/20
                                        text-white/40 hover:text-[#FF9500]
                                        flex items-center justify-center
                                        transition-all duration-200
                                      "
                                      title="Edit topic"
                                    >
                                      <span className="text-xs">✏️</span>
                                    </button>
                                    {isConfirmingDelete ? (
                                      <div className="flex items-center gap-1 ml-1">
                                        <button
                                          onClick={() => handleRemoveTopic(subject.id, topic)}
                                          className="px-2 py-1 bg-[#FF3B30] hover:bg-[#FF3B30]/90 text-white text-xs font-medium rounded-lg transition-all"
                                        >
                                          Delete
                                        </button>
                                        <button
                                          onClick={() => setDeleteTopicConfirm(null)}
                                          className="px-2 py-1 bg-white/10 hover:bg-white/15 text-white/70 text-xs rounded-lg transition-all"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    ) : topicInUse ? (
                                      <span
                                        className="
                                          w-6 h-6 rounded-lg
                                          text-white/20
                                          flex items-center justify-center
                                          cursor-not-allowed
                                        "
                                        title="Cannot delete: topic is in use"
                                      >
                                        <span className="text-xs">🔒</span>
                                      </span>
                                    ) : (
                                      <button
                                        onClick={() => setDeleteTopicConfirm({ subjectId: subject.id, topic })}
                                        className="
                                          w-6 h-6 rounded-lg
                                          hover:bg-[#FF3B30]/20
                                          text-white/40 hover:text-[#FF3B30]
                                          flex items-center justify-center
                                          transition-all duration-200
                                        "
                                        title="Delete topic"
                                      >
                                        <span className="text-xs">🗑️</span>
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        ) : (
                          <div className="text-center py-8 px-4 rounded-xl bg-white/[0.02] border border-dashed border-white/10">
                            <p className="text-sm text-white/40">
                              No topics yet. Add topics to organize your study sessions.
                            </p>
                          </div>
                        )}

                        {/* Add Topic */}
                        {showAddTopic === subject.id ? (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={newTopicInput}
                              onChange={(e) => setNewTopicInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleAddTopic(subject.id)
                                if (e.key === 'Escape') {
                                  setShowAddTopic(null)
                                  setNewTopicInput('')
                                }
                              }}
                              placeholder="Enter topic name..."
                              className="
                                flex-1 px-4 py-2.5
                                bg-white/10 border border-white/15 rounded-xl
                                text-white text-sm placeholder-white/30
                                focus:outline-none focus:border-[#AF52DE]/50 focus:bg-white/15
                              "
                              autoFocus
                            />
                            <button
                              onClick={() => handleAddTopic(subject.id)}
                              disabled={!newTopicInput.trim()}
                              className="
                                px-5 py-2.5
                                bg-[#AF52DE] hover:bg-[#AF52DE]/90
                                disabled:bg-white/5 disabled:text-white/30
                                text-white text-sm font-medium rounded-xl
                                transition-all duration-200
                                shadow-lg shadow-[#AF52DE]/20
                                disabled:shadow-none
                              "
                            >
                              Add
                            </button>
                            <button
                              onClick={() => {
                                setShowAddTopic(null)
                                setNewTopicInput('')
                              }}
                              className="
                                px-5 py-2.5
                                bg-white/5 hover:bg-white/10
                                text-white/70 text-sm rounded-xl
                                transition-all duration-200
                              "
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setShowAddTopic(subject.id)}
                            className="
                              w-full px-4 py-3 rounded-xl text-sm font-medium
                              bg-white/[0.02] hover:bg-white/[0.05] text-white/50 hover:text-white/70
                              border border-dashed border-white/10 hover:border-[#AF52DE]/30
                              transition-all duration-200
                            "
                          >
                            + Add Topic
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-6 sm:p-8 border-t border-white/5 shrink-0 bg-gradient-to-t from-black/20">
        <button
          onClick={onClose}
          className="
            w-full px-4 py-3.5
            bg-white/10 hover:bg-white/15
            text-white font-semibold rounded-xl
            transition-all duration-200
            hover:scale-[1.01] active:scale-[0.99]
            border border-white/10
          "
        >
          Done
        </button>
      </div>
    </Drawer>
  )
}
