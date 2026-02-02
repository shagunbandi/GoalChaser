'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@goal-chaser/sdk'
import type { ExecutiveGoal } from '../types'

export interface SuggestedTask {
  title: string
  phase?: string
  /** Short “how to achieve” direction (1–2 sentences). */
  howToAchieve?: string
}

interface GenerateTasksModalProps {
  open: boolean
  onClose: () => void
  goal: ExecutiveGoal
  date: string
  suggestedTasks: SuggestedTask[]
  isLoading: boolean
  error: string | null
  onAddSelected: (tasks: SuggestedTask[]) => void | Promise<void>
  onRegenerate: () => void | Promise<void>
  lastUsage?: { totalTokens: number; estimatedCostUsd: number } | null
  promptsUsed?: { system: string; user: string } | null
}

export function GenerateTasksModal({
  open,
  onClose,
  goal,
  date,
  suggestedTasks,
  isLoading,
  error,
  onAddSelected,
  onRegenerate,
  lastUsage,
  promptsUsed,
}: GenerateTasksModalProps) {
  const [selected, setSelected] = useState<Set<number>>(new Set(suggestedTasks.map((_, i) => i)))
  const [showPrompts, setShowPrompts] = useState(false)

  useEffect(() => {
    setSelected(new Set(suggestedTasks.map((_, i) => i)))
  }, [suggestedTasks])

  const toggle = (i: number) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
  }

  const handleAddSelected = async () => {
    const toAdd = suggestedTasks.filter((_, i) => selected.has(i))
    if (toAdd.length === 0) return
    await onAddSelected(toAdd)
    onClose()
  }

  const isToday = date === new Date().toISOString().split('T')[0]
  const label = isToday ? 'today' : 'this day'

  return (
    <Modal open={open} title={`Generate tasks for ${label}`} onClose={onClose}>
      <div className="flex flex-col min-h-0 max-h-[65vh]">
        <p className="text-sm text-white/70 shrink-0 mb-2">
          Goal: <span className="font-medium text-white/90">{goal.title}</span>
        </p>

        {(lastUsage || goal.aiUsage) && !isLoading && (
          <div className="text-xs text-white/50 space-y-0.5 shrink-0 mb-3">
            {lastUsage && (
              <p>
                This call: {lastUsage.totalTokens.toLocaleString()} tokens, ~$
                {lastUsage.estimatedCostUsd.toFixed(4)} USD
              </p>
            )}
            {goal.aiUsage && (
              <p>
                Total for this goal: {goal.aiUsage.totalTokens.toLocaleString()} tokens, ~$
                {goal.aiUsage.estimatedCostUsd.toFixed(4)} USD
              </p>
            )}
          </div>
        )}

        {isLoading && (
          <div className="py-8 text-center text-white/50 text-sm shrink-0">
            Nitya AI is suggesting tasks…
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200 shrink-0">
            {error}
          </div>
        )}

        {!isLoading && !error && suggestedTasks.length === 0 && (
          <p className="text-sm text-white/50 shrink-0">No tasks suggested. Try regenerating.</p>
        )}

        {!isLoading && suggestedTasks.length > 0 && (
          <>
            <p className="text-xs text-white/50 shrink-0 mb-2">Select tasks to add:</p>
            <ul className="space-y-3 overflow-y-auto flex-1 min-h-0 pr-1 -mr-1">
              {suggestedTasks.map((t, i) => (
                <li key={i} className="flex gap-3 items-start">
                  <input
                    type="checkbox"
                    checked={selected.has(i)}
                    onChange={() => toggle(i)}
                    className="mt-1 rounded border-white/30 bg-white/5 text-[#8B5CF6] focus:ring-[#8B5CF6] shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <span className="text-sm text-white/90 block">{t.title}</span>
                    {t.phase && (
                      <span className="text-xs text-white/40">({t.phase})</span>
                    )}
                    {t.howToAchieve && (
                      <p className="text-xs text-white/55 mt-1 leading-relaxed">
                        → {t.howToAchieve}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-2 pt-3 shrink-0 border-t border-white/5 mt-3">
              <button
                type="button"
                onClick={handleAddSelected}
                disabled={selected.size === 0}
                className="
                  px-4 py-2 rounded-xl text-sm font-medium
                  bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white
                  hover:shadow-[0_0_20px_rgba(139,92,246,0.3)]
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              >
                Add selected ({selected.size})
              </button>
              <button
                type="button"
                onClick={() => onAddSelected(suggestedTasks)}
                className="
                  px-4 py-2 rounded-xl text-sm font-medium
                  bg-white/10 text-white/90 hover:bg-white/15
                "
              >
                Add all
              </button>
              <button
                type="button"
                onClick={() => onRegenerate()}
                className="
                  px-4 py-2 rounded-xl text-sm font-medium
                  bg-white/10 text-white/70 hover:bg-white/15
                "
              >
                Regenerate
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-sm font-medium text-white/50 hover:text-white/70"
              >
                Cancel
              </button>
            </div>
            {promptsUsed && (
              <div className="border-t border-white/10 pt-3 mt-3">
                <button
                  type="button"
                  onClick={() => setShowPrompts(!showPrompts)}
                  className="text-xs text-white/40 hover:text-white/60"
                >
                  {showPrompts ? 'Hide prompts used' : 'Show prompts used'}
                </button>
                {showPrompts && (
                  <div className="mt-2 space-y-2 text-xs font-mono text-white/50 bg-white/5 rounded-lg p-3 overflow-x-auto max-h-48 overflow-y-auto">
                    <div>
                      <span className="text-white/40">System:</span>
                      <pre className="whitespace-pre-wrap break-words mt-0.5">{promptsUsed.system}</pre>
                    </div>
                    <div>
                      <span className="text-white/40">User:</span>
                      <pre className="whitespace-pre-wrap break-words mt-0.5">{promptsUsed.user}</pre>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  )
}
