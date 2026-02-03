'use client'

import { useState } from 'react'
import { Drawer } from '@goal-chaser/sdk'
import { LanguageTutorForm } from './LanguageTutorForm'
import { AddLanguageTutorChat } from './AddLanguageTutorChat'
import type {
  LanguageLearning,
  LanguageLearningInput,
  LanguageTutorDayData,
} from '../types'

interface LanguageTutorManagerProps {
  isOpen: boolean
  dayData: Record<string, LanguageTutorDayData>
  onAddLearning: (learning: LanguageLearningInput) => void | Promise<void>
  onUpdateLearning: (learning: LanguageLearning) => void | Promise<void>
  onDeleteLearning: (learningId: string) => void | Promise<void>
  onClose: () => void
  allLearnings?: LanguageLearning[]
  userId?: string
  goalId?: string
}

export function LanguageTutorManager({
  isOpen,
  onAddLearning,
  onUpdateLearning,
  onDeleteLearning,
  onClose,
  allLearnings = [],
  userId,
  goalId,
}: LanguageTutorManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingLearning, setEditingLearning] =
    useState<LanguageLearning | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
    null,
  )

  const learnings = allLearnings.sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
  )

  const handleAddLearning = async (data: LanguageLearningInput) => {
    await onAddLearning(data)
    setShowAddForm(false)
  }

  const handleUpdateLearning = async (data: LanguageLearningInput) => {
    if (!editingLearning) return
    await onUpdateLearning({
      ...editingLearning,
      ...data,
    })
    setEditingLearning(null)
  }

  const handleDelete = async (learningId: string) => {
    await onDeleteLearning(learningId)
    setShowDeleteConfirm(null)
  }

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Manage Language Learnings"
      subtitle={`${learnings.length} ${
        learnings.length === 1 ? 'learning' : 'learnings'
      } planned`}
      icon="🎓"
      iconGradient="from-[#8B5CF6] to-[#7C3AED]"
    >
      {!showAddForm && !editingLearning && (
        <div className="p-6 sm:p-8 border-b border-white/5">
          <button
            onClick={() => setShowAddForm(true)}
            className="
              w-full px-6 py-4
              bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED]
              hover:from-[#8B5CF6]/90 hover:to-[#7C3AED]/90
              text-white font-semibold rounded-xl
              shadow-lg shadow-[#8B5CF6]/25
              transition-all duration-200
              hover:scale-[1.02] active:scale-[0.98]
              text-sm
            "
          >
            + Add New Learning
          </button>
        </div>
      )}

      {showAddForm && (
        <div className="p-6 sm:p-8 border-b border-white/5 min-h-[360px]">
          <h3 className="text-lg font-semibold text-white mb-4">
            Add New Learning
          </h3>
          <AddLanguageTutorChat
            onSubmit={async (learning) => {
              await onAddLearning(learning)
              setShowAddForm(false)
            }}
            onCancel={() => setShowAddForm(false)}
          />
        </div>
      )}

      {editingLearning && (
        <div className="p-6 sm:p-8 border-b border-white/5">
          <h3 className="text-lg font-semibold text-white mb-4">
            Edit Learning
          </h3>
          <LanguageTutorForm
            initialData={editingLearning}
            onSubmit={handleUpdateLearning}
            onCancel={() => setEditingLearning(null)}
          />
        </div>
      )}

      <div className="px-6 sm:px-8 py-6 flex-1 overflow-y-auto">
        {learnings.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-white/5 to-white/[0.02] flex items-center justify-center border border-white/10">
              <span className="text-5xl opacity-50">🎓</span>
            </div>
            <h3 className="text-lg font-semibold text-white/80 mb-2">
              No learnings yet
            </h3>
            <p className="text-sm text-white/40 max-w-xs mx-auto">
              Add your first language learning to start tracking your progress
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {learnings.map((learning) => (
              <div
                key={learning.id}
                className="group rounded-2xl border border-white/10 overflow-hidden backdrop-blur-sm transition-all duration-300 hover:border-white/20"
                style={{
                  background: `linear-gradient(135deg, ${
                    learning.color || '#8B5CF6'
                  }15, ${learning.color || '#8B5CF6'}05)`,
                }}
              >
                <div className="px-4 py-3 border-b border-white/10 bg-white/[0.02]">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 shadow-lg"
                      style={{
                        backgroundColor: `${learning.color || '#8B5CF6'}40`,
                        boxShadow: `0 0 20px ${learning.color || '#8B5CF6'}30`,
                      }}
                    >
                      🎓
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-semibold text-white/90 truncate">
                          {learning.targetLanguage}
                        </h4>
                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase shrink-0"
                          style={{
                            backgroundColor: `${learning.color || '#8B5CF6'}30`,
                            color: learning.color || '#8B5CF6',
                          }}
                        >
                          {learning.metadata.proficiencyLevel}
                        </span>
                      </div>
                      <p className="text-sm text-white/50 mt-0.5">
                        Known: {learning.knownLanguages.join(', ')}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setEditingLearning(learning)}
                        className="p-2 rounded-lg text-white/40 hover:text-[#FF9500] hover:bg-[#FF9500]/10 transition-all"
                        title="Edit"
                      >
                        ✏️
                      </button>
                      {showDeleteConfirm === learning.id ? (
                        <button
                          onClick={() => handleDelete(learning.id)}
                          className="p-2 rounded-lg text-[#FF3B30] hover:bg-[#FF3B30]/10 transition-all"
                          title="Confirm delete"
                        >
                          ✓
                        </button>
                      ) : (
                        <button
                          onClick={() => setShowDeleteConfirm(learning.id)}
                          className="p-2 rounded-lg text-white/40 hover:text-[#FF3B30] hover:bg-[#FF3B30]/10 transition-all"
                          title="Delete"
                        >
                          🗑️
                        </button>
                      )}
                      {showDeleteConfirm === learning.id && (
                        <button
                          onClick={() => setShowDeleteConfirm(null)}
                          className="p-2 rounded-lg text-white/40 hover:bg-white/10 transition-all"
                          title="Cancel"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="px-4 py-4 space-y-3">
                  <div className="text-sm text-white/70">
                    <span className="text-white/50">Objectives:</span>{' '}
                    {learning.objectives}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="px-3 py-2 rounded-xl bg-white/[0.03] border border-white/5">
                      <div className="text-xs text-white/40 mb-1">From</div>
                      <div className="text-sm font-medium text-white/80">
                        {learning.startDate}
                      </div>
                    </div>
                    <div className="px-3 py-2 rounded-xl bg-white/[0.03] border border-white/5">
                      <div className="text-xs text-white/40 mb-1">To</div>
                      <div className="text-sm font-medium text-white/80">
                        {learning.endDate}
                      </div>
                    </div>
                  </div>

                  {learning.metadata && (
                    <div className="text-xs text-white/50 space-y-1">
                      {learning.metadata.masteredConcepts?.length > 0 && (
                        <div>
                          <span className="text-green-400">✓ Mastered:</span>{' '}
                          {learning.metadata.masteredConcepts
                            .slice(0, 3)
                            .join(', ')}
                          {learning.metadata.masteredConcepts.length > 3 &&
                            '...'}
                        </div>
                      )}
                      {learning.metadata.topicsNeedReview?.length > 0 && (
                        <div>
                          <span className="text-amber-400">⚠ Review:</span>{' '}
                          {learning.metadata.topicsNeedReview
                            .slice(0, 3)
                            .join(', ')}
                          {learning.metadata.topicsNeedReview.length > 3 &&
                            '...'}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
