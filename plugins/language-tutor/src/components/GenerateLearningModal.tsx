'use client'

import { useState } from 'react'
import { Modal } from '@goal-chaser/sdk'
import type { LanguageLearning } from '../types'

interface GenerateLearningModalProps {
  open: boolean
  onClose: () => void
  learning: LanguageLearning
  date: string
  teachingContent?: string
  questionCount?: number
  isLoading: boolean
  error: string | null
  onAccept: () => void | Promise<void>
  onRegenerate: () => void | Promise<void>
  lastUsage?: { totalTokens: number; estimatedCostUsd: number } | null
}

export function GenerateLearningModal({
  open,
  onClose,
  learning,
  date,
  teachingContent,
  questionCount = 0,
  isLoading,
  error,
  onAccept,
  onRegenerate,
  lastUsage,
}: GenerateLearningModalProps) {
  const isToday = date === new Date().toISOString().split('T')[0]
  const label = isToday ? 'today' : 'this day'

  return (
    <Modal
      open={open}
      title={`Generate learning for ${label}`}
      onClose={onClose}
    >
      <div className="flex flex-col min-h-0 max-h-[65vh]">
        <p className="text-sm text-white/70 shrink-0 mb-2">
          Learning:{' '}
          <span className="font-medium text-white/90">
            {learning.targetLanguage}
          </span>
        </p>

        <p className="text-xs text-white/50 shrink-0 mb-3">
          Level: {learning.metadata.proficiencyLevel} • Known:{' '}
          {learning.knownLanguages.join(', ')}
        </p>

        {lastUsage && !isLoading && (
          <div className="text-xs text-white/50 space-y-0.5 shrink-0 mb-3">
            <p>
              This call: {lastUsage.totalTokens.toLocaleString()} tokens, ~$
              {lastUsage.estimatedCostUsd.toFixed(4)} USD
            </p>
            {learning.aiUsage && (
              <p>
                Total for this learning:{' '}
                {learning.aiUsage.totalTokens.toLocaleString()} tokens, ~$
                {learning.aiUsage.estimatedCostUsd.toFixed(4)} USD
              </p>
            )}
          </div>
        )}

        {isLoading && (
          <div className="py-8 text-center text-white/50 text-sm shrink-0">
            <div className="mb-3">🎓</div>
            <p>Nitya AI is creating your lesson and quiz...</p>
            <p className="text-xs text-white/40 mt-2">
              Analyzing your progress and generating personalized content
            </p>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200 shrink-0">
            {error}
          </div>
        )}

        {!isLoading && !error && teachingContent && (
          <>
            <div className="overflow-y-auto flex-1 min-h-0 pr-1 -mr-1 space-y-4">
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <h4 className="text-sm font-semibold text-white/80 mb-2 flex items-center gap-2">
                  📚 Teaching Content
                </h4>
                <div className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                  {teachingContent.substring(0, 300)}
                  {teachingContent.length > 300 && '...'}
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <h4 className="text-sm font-semibold text-white/80 mb-2 flex items-center gap-2">
                  ❓ Quiz
                </h4>
                <p className="text-sm text-white/60">
                  {questionCount} question{questionCount !== 1 ? 's' : ''}{' '}
                  generated with explanations
                </p>
              </div>

              {learning.metadata.topicsNeedReview &&
                learning.metadata.topicsNeedReview.length > 0 && (
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
                    <p className="text-xs text-amber-400/80">
                      ⚠ Focused on:{' '}
                      {learning.metadata.topicsNeedReview
                        .slice(0, 3)
                        .join(', ')}
                    </p>
                  </div>
                )}
            </div>

            <div className="flex flex-wrap gap-2 pt-3 shrink-0 border-t border-white/5 mt-3">
              <button
                type="button"
                onClick={async () => {
                  await onAccept()
                  onClose()
                }}
                className="
                  px-4 py-2 rounded-xl text-sm font-medium
                  bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white
                  hover:shadow-[0_0_20px_rgba(139,92,246,0.3)]
                  transition-all duration-150
                "
              >
                Accept & Use Content
              </button>
              <button
                type="button"
                onClick={onRegenerate}
                className="
                  px-4 py-2 rounded-xl text-sm font-medium
                  bg-white/10 text-white/70 hover:bg-white/15
                  transition-all duration-150
                "
              >
                Regenerate
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-sm font-medium text-white/50 hover:text-white/70 transition-all"
              >
                Cancel
              </button>
            </div>
          </>
        )}

        {!isLoading && !error && !teachingContent && (
          <div className="py-8 text-center text-white/50 text-sm shrink-0">
            <p>No content generated. Try clicking "Regenerate".</p>
          </div>
        )}
      </div>
    </Modal>
  )
}
