'use client'

import { useState } from 'react'
import { GOAL_COLORS } from './constants'
import type { SuccessCriterion, SuccessCriterionType } from '@/types'

export interface CreateGoalFormData {
  name: string
  description?: string
  color?: string
  startDate?: string
  endDate?: string
  successCriterion?: SuccessCriterion
}

interface CreateGoalFormProps {
  onSubmit: (data: CreateGoalFormData) => void
  onCancel: () => void
}

const MAX_HOURS_OPTIONS = [
  { value: 8, label: '8 hours', description: 'Standard workday' },
  { value: 14, label: '14 hours', description: 'Extended day' },
  { value: 18, label: '18 hours', description: 'Full day (minus sleep)' },
] as const

export function CreateGoalForm({ onSubmit, onCancel }: CreateGoalFormProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState('blue')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [criterionType, setCriterionType] = useState<SuccessCriterionType>('productivity')
  const [maxHours, setMaxHours] = useState<8 | 14 | 18>(8)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      const successCriterion: SuccessCriterion = criterionType === 'productivity'
        ? { type: 'productivity' }
        : { type: 'hours', maxHours }

      onSubmit({
        name: name.trim(),
        description: description.trim() || undefined,
        color,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        successCriterion,
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Goal Name */}
      <div>
        <label className="block text-sm font-medium text-white/60 mb-2">
          Goal Name <span className="text-[#FF453A]">*</span>
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

      {/* Description */}
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

      {/* Date Range */}
      <div>
        <label className="block text-sm font-medium text-white/60 mb-2">
          Date Range <span className="text-white/30">(optional)</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-white/40 mb-1.5">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="
                w-full px-3 py-2.5
                bg-white/5 border border-white/10 rounded-xl
                text-white text-sm
                focus:outline-none focus:border-[#007AFF]/50
                transition-all duration-200
                [color-scheme:dark]
              "
            />
          </div>
          <div>
            <label className="block text-xs text-white/40 mb-1.5">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate || undefined}
              className="
                w-full px-3 py-2.5
                bg-white/5 border border-white/10 rounded-xl
                text-white text-sm
                focus:outline-none focus:border-[#007AFF]/50
                transition-all duration-200
                [color-scheme:dark]
              "
            />
          </div>
        </div>
      </div>

      {/* Success Criterion */}
      <div>
        <label className="block text-sm font-medium text-white/60 mb-3">
          Success Criterion
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setCriterionType('productivity')}
            className={`
              p-4 rounded-xl border-2 text-left transition-all duration-200
              ${criterionType === 'productivity'
                ? 'border-[#30D158] bg-[#30D158]/10'
                : 'border-white/10 bg-white/5 hover:border-white/20'
              }
            `}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-lg">📊</span>
              <span className={`font-medium ${criterionType === 'productivity' ? 'text-[#30D158]' : 'text-white/80'}`}>
                Productivity
              </span>
            </div>
            <p className="text-xs text-white/40">
              Rate your day 1-10
            </p>
          </button>
          <button
            type="button"
            onClick={() => setCriterionType('hours')}
            className={`
              p-4 rounded-xl border-2 text-left transition-all duration-200
              ${criterionType === 'hours'
                ? 'border-[#5856D6] bg-[#5856D6]/10'
                : 'border-white/10 bg-white/5 hover:border-white/20'
              }
            `}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-lg">⏱️</span>
              <span className={`font-medium ${criterionType === 'hours' ? 'text-[#5856D6]' : 'text-white/80'}`}>
                Hours Spent
              </span>
            </div>
            <p className="text-xs text-white/40">
              Track time invested
            </p>
          </button>
        </div>

        {/* Max Hours Selector - only show if hours criterion */}
        {criterionType === 'hours' && (
          <div className="mt-4 p-4 bg-white/[0.02] rounded-xl border border-white/[0.06]">
            <label className="block text-xs text-white/50 mb-3">
              Maximum hours per day
            </label>
            <div className="flex gap-2">
              {MAX_HOURS_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setMaxHours(option.value)}
                  className={`
                    flex-1 py-2.5 px-3 rounded-lg text-center transition-all duration-200
                    ${maxHours === option.value
                      ? 'bg-[#5856D6] text-white'
                      : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/80'
                    }
                  `}
                >
                  <span className="text-sm font-medium">{option.value}h</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-white/30 mt-2 text-center">
              {MAX_HOURS_OPTIONS.find(o => o.value === maxHours)?.description}
            </p>
          </div>
        )}
      </div>

      {/* Color */}
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

      {/* Buttons */}
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
