'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import type { SubjectConfig } from '@/types'

interface SubjectManagerProps {
  subjectConfigs: SubjectConfig[]
  onAddSubject: (name: string) => void
  onRemoveSubject: (id: string) => void
  onUpdateSubject: (id: string, name: string) => void
  onToggleHasTopics: (id: string) => void
  onAddTopic: (subjectId: string, topic: string) => void
  onRemoveTopic: (subjectId: string, topic: string) => void
  onClose: () => void
}

export function SubjectManager({
  subjectConfigs,
  onAddSubject,
  onRemoveSubject,
  onUpdateSubject,
  onToggleHasTopics,
  onAddTopic,
  onRemoveTopic,
  onClose,
}: SubjectManagerProps) {
  const [newSubjectInput, setNewSubjectInput] = useState('')
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null)
  const [editingSubjectName, setEditingSubjectName] = useState('')
  const [expandedSubjectId, setExpandedSubjectId] = useState<string | null>(
    null,
  )
  const [newTopicInput, setNewTopicInput] = useState('')
  const [showAddTopic, setShowAddTopic] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  // Add new subject
  const handleAddSubject = () => {
    if (newSubjectInput.trim()) {
      onAddSubject(newSubjectInput.trim())
      setNewSubjectInput('')
    }
  }

  // Start editing subject
  const startEditingSubject = (subject: SubjectConfig) => {
    setEditingSubjectId(subject.id)
    setEditingSubjectName(subject.name)
  }

  // Save subject edit
  const saveSubjectEdit = () => {
    if (editingSubjectId && editingSubjectName.trim()) {
      onUpdateSubject(editingSubjectId, editingSubjectName.trim())
    }
    setEditingSubjectId(null)
    setEditingSubjectName('')
  }

  // Cancel subject edit
  const cancelSubjectEdit = () => {
    setEditingSubjectId(null)
    setEditingSubjectName('')
  }

  // Delete subject
  const handleDeleteSubject = (id: string) => {
    onRemoveSubject(id)
    setDeleteConfirm(null)
    if (expandedSubjectId === id) {
      setExpandedSubjectId(null)
    }
  }

  // Add topic to subject
  const handleAddTopic = (subjectId: string) => {
    if (newTopicInput.trim()) {
      onAddTopic(subjectId, newTopicInput.trim())
      setNewTopicInput('')
      setShowAddTopic(null)
    }
  }

  // Remove topic from subject
  const handleRemoveTopic = (subjectId: string, topic: string) => {
    onRemoveTopic(subjectId, topic)
  }

  // Portal mounting
  const [mounted, setMounted] = useState(false)
  const portalRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    portalRef.current = document.body
    setMounted(true)
    return () => setMounted(false)
  }, [])

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="
          relative z-10 w-full max-w-lg max-h-[85vh] 
          overflow-hidden flex flex-col
          bg-[#1c1c1e] 
          rounded-3xl 
          border border-white/[0.1]
          shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)]
        "
      >
        <div className="p-6 shrink-0">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚙️</span>
              <h2 className="text-xl font-semibold text-white/90">
                Manage Subjects
              </h2>
            </div>
            <button
              onClick={onClose}
              className="
                w-8 h-8 rounded-xl
                bg-white/[0.05] hover:bg-white/[0.1]
                text-white/50 hover:text-white
                flex items-center justify-center
                transition-all duration-200
              "
            >
              ✕
            </button>
          </div>

          {/* Add New Subject */}
          <div className="flex gap-2 mb-6">
            <input
              type="text"
              value={newSubjectInput}
              onChange={(e) => setNewSubjectInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddSubject()
              }}
              placeholder="Add new subject..."
              className="
                flex-1 px-4 py-3
                bg-white/[0.03] backdrop-blur-xl
                border border-white/[0.08] rounded-xl
                text-white placeholder-white/30
                focus:outline-none focus:border-[#007AFF]/50
                transition-all duration-200
              "
            />
            <button
              onClick={handleAddSubject}
              disabled={!newSubjectInput.trim()}
              className="
                px-5 py-3
                bg-gradient-to-r from-[#007AFF] to-[#5856D6]
                hover:from-[#007AFF]/90 hover:to-[#5856D6]/90
                disabled:from-white/[0.05] disabled:to-white/[0.05]
                disabled:text-white/30
                text-white font-medium rounded-xl
                shadow-[0_0_20px_rgba(0,122,255,0.3)]
                disabled:shadow-none
                transition-all duration-200
              "
            >
              + Add
            </button>
          </div>
        </div>

        {/* Subject List */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {subjectConfigs.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4 opacity-60">📚</div>
              <p className="text-white/40 text-sm">
                No subjects yet. Add your first subject above.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {subjectConfigs.map((subject) => (
                <div
                  key={subject.id}
                  className="
                    bg-white/[0.03] backdrop-blur-sm
                    border border-white/[0.08] rounded-2xl
                    overflow-hidden
                  "
                >
                  {/* Subject Header */}
                  <div className="flex items-center justify-between p-4">
                    {editingSubjectId === subject.id ? (
                      <div className="flex-1 flex gap-2 mr-3">
                        <input
                          type="text"
                          value={editingSubjectName}
                          onChange={(e) =>
                            setEditingSubjectName(e.target.value)
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveSubjectEdit()
                            if (e.key === 'Escape') cancelSubjectEdit()
                          }}
                          className="
                            flex-1 px-3 py-1.5
                            bg-white/[0.05] border border-[#007AFF]/50 rounded-lg
                            text-white text-sm
                            focus:outline-none
                          "
                          autoFocus
                        />
                        <button
                          onClick={saveSubjectEdit}
                          className="px-3 py-1.5 bg-[#30D158] text-white text-xs rounded-lg"
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelSubjectEdit}
                          className="px-3 py-1.5 bg-white/[0.1] text-white/60 text-xs rounded-lg"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div
                        className="flex-1 flex items-center gap-3 cursor-pointer"
                        onClick={() =>
                          setExpandedSubjectId(
                            expandedSubjectId === subject.id
                              ? null
                              : subject.id,
                          )
                        }
                      >
                        <span className="text-[#007AFF] font-medium text-lg">
                          {subject.name}
                        </span>
                        <span className="text-xs text-white/30 bg-white/[0.05] px-2 py-0.5 rounded-full">
                          {subject.topics.length} topic
                          {subject.topics.length !== 1 ? 's' : ''}
                        </span>
                        <span className="text-white/30 text-xs ml-auto mr-2">
                          {expandedSubjectId === subject.id ? '▲' : '▼'}
                        </span>
                      </div>
                    )}

                    {editingSubjectId !== subject.id && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            startEditingSubject(subject)
                          }}
                          className="
                            p-2 rounded-lg
                            text-white/40 hover:text-[#FF9500] hover:bg-white/[0.05]
                            transition-all duration-200
                          "
                          title="Edit subject"
                        >
                          ✏️
                        </button>
                        {deleteConfirm === subject.id ? (
                          <div className="flex items-center gap-1 ml-1">
                            <button
                              onClick={() => handleDeleteSubject(subject.id)}
                              className="px-2 py-1 bg-[#FF3B30] text-white text-xs rounded-lg"
                            >
                              Delete
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="px-2 py-1 bg-white/[0.1] text-white/60 text-xs rounded-lg"
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
                              p-2 rounded-lg
                              text-white/40 hover:text-[#FF3B30] hover:bg-white/[0.05]
                              transition-all duration-200
                            "
                            title="Delete subject"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Expanded Topics */}
                  {expandedSubjectId === subject.id && (
                    <div className="border-t border-white/[0.06] p-4 space-y-4">
                      {/* Has Topics Toggle */}
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm text-white/70">
                            Has Topics
                          </label>
                          <p className="text-xs text-white/40 mt-0.5">
                            {subject.hasTopics ?? true
                              ? 'Select specific topics when tracking'
                              : 'Just mark as done (shows green)'}
                          </p>
                        </div>
                        <button
                          onClick={() => onToggleHasTopics(subject.id)}
                          className={`
                            relative w-12 h-7 rounded-full transition-all duration-200
                            ${
                              subject.hasTopics ?? true
                                ? 'bg-[#30D158]'
                                : 'bg-white/20'
                            }
                          `}
                        >
                          <span
                            className={`
                              absolute top-1 w-5 h-5 rounded-full bg-white shadow-md
                              transition-all duration-200
                              ${subject.hasTopics ?? true ? 'left-6' : 'left-1'}
                            `}
                          />
                        </button>
                      </div>

                      {/* Only show topics section if hasTopics is true */}
                      {(subject.hasTopics ?? true) && (
                        <>
                          <div className="flex items-center justify-between">
                            <label className="text-xs text-white/50 uppercase tracking-wider">
                              Topics
                            </label>
                          </div>

                          {/* Topic List */}
                          {subject.topics.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {subject.topics.map((topic) => (
                                <div
                                  key={topic}
                                  className="
                                group flex items-center gap-2
                                px-3 py-1.5 rounded-lg
                                bg-[#AF52DE]/20 text-[#AF52DE]
                                border border-[#AF52DE]/30
                              "
                                >
                                  <span className="text-sm">{topic}</span>
                                  <button
                                    onClick={() =>
                                      handleRemoveTopic(subject.id, topic)
                                    }
                                    className="
                                  w-4 h-4 rounded-full
                                  bg-white/0 hover:bg-[#FF3B30]/20
                                  text-white/40 hover:text-[#FF3B30]
                                  flex items-center justify-center
                                  text-xs font-bold
                                  transition-all duration-200
                                  opacity-0 group-hover:opacity-100
                                "
                                  >
                                    ✕
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-white/30">
                              No topics yet. Add topics to organize your
                              learning.
                            </p>
                          )}

                          {/* Add Topic */}
                          {showAddTopic === subject.id ? (
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={newTopicInput}
                                onChange={(e) =>
                                  setNewTopicInput(e.target.value)
                                }
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter')
                                    handleAddTopic(subject.id)
                                  if (e.key === 'Escape') {
                                    setShowAddTopic(null)
                                    setNewTopicInput('')
                                  }
                                }}
                                placeholder="New topic..."
                                className="
                              flex-1 px-3 py-2
                              bg-white/[0.05] border border-white/[0.1] rounded-lg
                              text-white text-sm placeholder-white/30
                              focus:outline-none focus:border-[#AF52DE]/50
                            "
                                autoFocus
                              />
                              <button
                                onClick={() => handleAddTopic(subject.id)}
                                disabled={!newTopicInput.trim()}
                                className="
                              px-4 py-2
                              bg-[#AF52DE] hover:bg-[#AF52DE]/80
                              disabled:bg-white/[0.05] disabled:text-white/30
                              text-white text-sm rounded-lg
                              transition-all duration-200
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
                              px-4 py-2
                              bg-white/[0.05] hover:bg-white/[0.1]
                              text-white/60 text-sm rounded-lg
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
                            w-full px-4 py-2.5 rounded-xl text-sm
                            bg-white/[0.02] text-white/40
                            hover:bg-white/[0.05] hover:text-white/60
                            border border-dashed border-white/[0.1] hover:border-white/[0.2]
                            transition-all duration-200
                          "
                            >
                              + Add Topic
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/[0.1] shrink-0 bg-[#1c1c1e]">
          <button
            onClick={onClose}
            className="
              w-full px-4 py-3
              bg-white/[0.08] hover:bg-white/[0.12]
              text-white/80 font-medium rounded-xl
              transition-all duration-200
            "
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )

  // Use portal to render at document body level
  if (!mounted || !portalRef.current) return null
  return createPortal(modalContent, portalRef.current)
}
