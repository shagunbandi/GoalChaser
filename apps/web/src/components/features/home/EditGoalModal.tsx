'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui'
import type { Goal } from '@/types'

interface EditGoalModalProps {
  goal: Goal
  open: boolean
  onClose: () => void
  onSave: (updates: {
    name: string
    description?: string
    color?: string
    startDate?: string
    endDate?: string
  }) => Promise<void>
}

export function EditGoalModal({ goal, open, onClose, onSave }: EditGoalModalProps) {
  const [name, setName] = useState(goal.name)
  const [description, setDescription] = useState(goal.description || '')
  const [color, setColor] = useState(goal.color || '#007AFF')
  const [startDate, setStartDate] = useState(goal.startDate || '')
  const [endDate, setEndDate] = useState(goal.endDate || '')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset form when goal changes
  useEffect(() => {
    setName(goal.name)
    setDescription(goal.description || '')
    setColor(goal.color || '#007AFF')
    setStartDate(goal.startDate || '')
    setEndDate(goal.endDate || '')
    setError(null)
  }, [goal])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Goal name is required')
      return
    }

    if (startDate && endDate && startDate > endDate) {
      setError('Start date must be before end date')
      return
    }

    setIsSaving(true)
    try {
      await onSave({
        name: name.trim(),
        description: description.trim() || undefined,
        color,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update goal')
    } finally {
      setIsSaving(false)
    }
  }

  const predefinedColors = [
    '#007AFF', // Blue
    '#AF52DE', // Purple
    '#FF2D55', // Red
    '#FF9500', // Orange
    '#FFCC00', // Yellow
    '#34C759', // Green
    '#00C7BE', // Teal
    '#FF375F', // Pink
  ]

  return (
    <Modal open={open} onClose={onClose} title="Edit Goal">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Goal Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-white/70 mb-2">
            Goal Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="
              w-full px-3 py-2 rounded-lg
              bg-white/5 border border-white/10
              text-white placeholder-white/40
              focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:border-transparent
            "
            placeholder="Enter goal name"
            autoFocus
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-white/70 mb-2">
            Description (optional)
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="
              w-full px-3 py-2 rounded-lg
              bg-white/5 border border-white/10
              text-white placeholder-white/40
              focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:border-transparent
              resize-none
            "
            placeholder="What's this goal about?"
          />
        </div>

        {/* Color Picker */}
        <div>
          <label className="block text-sm font-medium text-white/70 mb-2">
            Color
          </label>
          <div className="flex flex-wrap gap-2">
            {predefinedColors.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`
                  w-10 h-10 rounded-lg transition-all duration-200
                  ${color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-[#1a1a2e] scale-110' : 'hover:scale-105'}
                `}
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
          </div>
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-white/70 mb-2">
              Start Date (optional)
            </label>
            <input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="
                w-full px-3 py-2 rounded-lg
                bg-white/5 border border-white/10
                text-white
                focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:border-transparent
              "
            />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-white/70 mb-2">
              End Date (optional)
            </label>
            <input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="
                w-full px-3 py-2 rounded-lg
                bg-white/5 border border-white/10
                text-white
                focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:border-transparent
              "
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="
              flex-1 px-4 py-2 rounded-lg
              bg-white/5 hover:bg-white/10
              border border-white/10
              text-white/70 hover:text-white
              transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving || !name.trim()}
            className="
              flex-1 px-4 py-2 rounded-lg
              bg-gradient-to-r from-[#007AFF] to-[#0051D5]
              hover:shadow-[0_0_20px_rgba(0,122,255,0.4)]
              text-white font-medium
              transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
