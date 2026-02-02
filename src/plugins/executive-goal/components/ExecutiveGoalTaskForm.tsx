'use client'

import { useState } from 'react'
import type { ExecutiveGoal, ExecutiveGoalTaskInput } from '../types'

interface ExecutiveGoalTaskFormProps {
  /** Goals that can be selected as parent (and that overlap the selected day). */
  availableGoals: ExecutiveGoal[]
  /** Day this task belongs to (used as endDate). */
  date: string
  onSubmit: (data: ExecutiveGoalTaskInput) => void | Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
  /** Optional color to prefill (e.g. from parent goal). */
  defaultColor?: string
}

export function ExecutiveGoalTaskForm({
  availableGoals,
  date,
  onSubmit,
  onCancel,
  isSubmitting = false,
  defaultColor = '#8B5CF6',
}: ExecutiveGoalTaskFormProps) {
  const [title, setTitle] = useState('')
  const [parentExecutiveGoalId, setParentExecutiveGoalId] = useState(
    availableGoals[0]?.id ?? ''
  )
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setError('Title is required')
      return
    }
    if (!parentExecutiveGoalId) {
      setError('Please select a parent goal')
      return
    }
    setError(null)
    await onSubmit({
      title: title.trim(),
      parentExecutiveGoalId,
      endDate: date,
      color: defaultColor,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="space-y-1">
        <label className="text-xs text-white/60">Task title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Review Q1 targets"
          className="
            w-full rounded-xl border border-white/10 bg-white/5
            px-3 py-2 text-sm text-white placeholder-white/40
            focus:border-[#8B5CF6]/60 focus:outline-none
          "
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs text-white/60">Parent goal</label>
        <select
          value={parentExecutiveGoalId}
          onChange={(e) => setParentExecutiveGoalId(e.target.value)}
          className="
            w-full rounded-xl border border-white/10 bg-white/5
            px-3 py-2 text-sm text-white
            focus:border-[#8B5CF6]/60 focus:outline-none
            appearance-none cursor-pointer
          "
          disabled={isSubmitting}
        >
          {availableGoals.map((g) => (
            <option key={g.id} value={g.id} className="bg-[#1a1a1a] text-white">
              {g.title} ({g.startDate} → {g.endDate})
            </option>
          ))}
        </select>
      </div>

      <p className="text-xs text-white/40">Due: {date}</p>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="
            px-4 py-2 rounded-xl text-sm font-medium
            bg-white/[0.05] text-white/70 hover:bg-white/[0.1]
            transition-all duration-150
          "
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="
            px-4 py-2 rounded-xl text-sm font-medium
            bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED]
            text-white hover:shadow-[0_0_20px_rgba(139,92,246,0.3)]
            transition-all duration-150
            disabled:opacity-50 disabled:cursor-not-allowed
          "
        >
          {isSubmitting ? 'Adding…' : 'Add task'}
        </button>
      </div>
    </form>
  )
}
