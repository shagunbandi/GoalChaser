'use client'

import { useState } from 'react'
import { GOAL_COLORS } from './constants'

interface CreateGoalFormProps {
  onSubmit: (name: string, description: string, color: string) => void
  onCancel: () => void
}

export function CreateGoalForm({ onSubmit, onCancel }: CreateGoalFormProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState('blue')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      onSubmit(name.trim(), description.trim(), color)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-white/60 mb-2">
          Goal Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Learn Spanish, Fitness Journey..."
          className="
            w-full px-4 py-3
            bg-white/5 border border-white/10 rounded-xl
            text-white placeholder-white/30
            focus:outline-none focus:border-[#007AFF]/50
            focus:ring-2 focus:ring-[#007AFF]/20
            transition-all duration-200
          "
          autoFocus
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-white/60 mb-2">
          Description <span className="text-white/30">(optional)</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What do you want to achieve?"
          rows={2}
          className="
            w-full px-4 py-3
            bg-white/5 border border-white/10 rounded-xl
            text-white placeholder-white/30
            focus:outline-none focus:border-[#007AFF]/50
            focus:ring-2 focus:ring-[#007AFF]/20
            transition-all duration-200 resize-none
          "
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-white/60 mb-3">
          Color
        </label>
        <div className="flex gap-2.5">
          {GOAL_COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setColor(c.value)}
              className={`
                w-9 h-9 rounded-full transition-all duration-200
                ${
                  color === c.value
                    ? `ring-2 ring-white/60 ring-offset-2 ring-offset-[#0a0a12] scale-110 ${c.glow}`
                    : 'opacity-40 hover:opacity-70 hover:scale-105'
                }
              `}
              style={{ backgroundColor: c.hex }}
              title={c.name}
            />
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="
            flex-1 px-5 py-3
            bg-white/5 hover:bg-white/10
            border border-white/10 hover:border-white/20
            text-white/70 hover:text-white
            font-medium rounded-xl
            transition-all duration-200
          "
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!name.trim()}
          className="
            flex-1 px-5 py-3
            bg-[#007AFF] hover:bg-[#007AFF]/90
            disabled:bg-white/10 disabled:text-white/30
            text-white font-semibold rounded-xl
            disabled:cursor-not-allowed
            transition-all duration-200
          "
        >
          Create
        </button>
      </div>
    </form>
  )
}

