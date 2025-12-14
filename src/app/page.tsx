'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useGoals, Goal } from '@/hooks/useGoals'

// ============ Color Options ============
const GOAL_COLORS = [
  { name: 'Cyan', value: 'cyan', bg: 'bg-cyan-500', border: 'border-cyan-500' },
  {
    name: 'Violet',
    value: 'violet',
    bg: 'bg-violet-500',
    border: 'border-violet-500',
  },
  {
    name: 'Fuchsia',
    value: 'fuchsia',
    bg: 'bg-fuchsia-500',
    border: 'border-fuchsia-500',
  },
  { name: 'Rose', value: 'rose', bg: 'bg-rose-500', border: 'border-rose-500' },
  {
    name: 'Amber',
    value: 'amber',
    bg: 'bg-amber-500',
    border: 'border-amber-500',
  },
  {
    name: 'Emerald',
    value: 'emerald',
    bg: 'bg-emerald-500',
    border: 'border-emerald-500',
  },
]

// ============ Goal Card Component ============
interface GoalCardProps {
  goal: Goal
  onClick: () => void
  onDelete: () => void
}

function GoalCard({ goal, onClick, onDelete }: GoalCardProps) {
  const colorClass =
    GOAL_COLORS.find((c) => c.value === goal.color)?.bg || 'bg-cyan-500'
  const createdDate = new Date(goal.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div
      onClick={onClick}
      className="group relative bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 cursor-pointer hover:bg-white/10 hover:border-white/20 transition-all duration-300 hover:scale-[1.02]"
    >
      {/* Color indicator */}
      <div
        className={`absolute top-0 left-0 right-0 h-1 ${colorClass} rounded-t-2xl`}
      />

      {/* Delete button */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          if (
            confirm(
              `Delete "${goal.name}"? This will remove all data for this goal.`,
            )
          ) {
            onDelete()
          }
        }}
        className="absolute top-4 right-4 p-2 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
      >
        🗑️
      </button>

      {/* Content */}
      <div className="pt-2">
        <h3 className="text-xl font-bold text-white mb-2">{goal.name}</h3>
        {goal.description && (
          <p className="text-slate-400 text-sm mb-3 line-clamp-2">
            {goal.description}
          </p>
        )}
        <p className="text-slate-500 text-xs">Created {createdDate}</p>
      </div>

      {/* Arrow */}
      <div className="absolute bottom-6 right-6 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all">
        →
      </div>
    </div>
  )
}

// ============ Create Goal Form ============
interface CreateGoalFormProps {
  onSubmit: (name: string, description: string, color: string) => void
  onCancel: () => void
}

function CreateGoalForm({ onSubmit, onCancel }: CreateGoalFormProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState('cyan')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      onSubmit(name.trim(), description.trim(), color)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Goal Name */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Goal Name *
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Learn Spanish, Fitness Journey, Career Growth..."
          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 transition-all"
          autoFocus
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Description (optional)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What do you want to achieve with this goal?"
          rows={3}
          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 transition-all resize-none"
        />
      </div>

      {/* Color Selection */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Color Theme
        </label>
        <div className="flex flex-wrap gap-3">
          {GOAL_COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setColor(c.value)}
              className={`w-10 h-10 rounded-full ${c.bg} transition-all ${
                color === c.value
                  ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110'
                  : 'opacity-60 hover:opacity-100'
              }`}
              title={c.name}
            />
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-slate-300 font-medium rounded-xl transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!name.trim()}
          className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 disabled:from-slate-600 disabled:to-slate-600 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all"
        >
          Create Goal
        </button>
      </div>
    </form>
  )
}

// ============ Main Home Component ============
export default function Home() {
  const router = useRouter()
  const { goals, isLoading, createGoal, deleteGoal } = useGoals()
  const [showCreateForm, setShowCreateForm] = useState(false)

  const handleCreateGoal = async (
    name: string,
    description: string,
    color: string,
  ) => {
    const newGoal = await createGoal(name, description, color)
    router.push(`/goal/${newGoal.id}`)
  }

  const handleGoalClick = (goalId: string) => {
    router.push(`/goal/${goalId}`)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-cyan-400 border-t-transparent mx-auto mb-4" />
          <p className="text-slate-400">Loading your goals...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
      {/* Subtle grid pattern */}
      <div
        className="fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative z-10 min-h-screen p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12 pt-8">
            <h1 className="text-5xl font-black tracking-tight bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent mb-4">
              Goal Chaser
            </h1>
            <p className="text-slate-400 text-lg">
              Track your progress, achieve your dreams
            </p>
          </div>

          {/* Create Form or Goals List */}
          {showCreateForm ? (
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8 max-w-xl mx-auto">
              <h2 className="text-2xl font-bold text-white mb-6 text-center">
                🎯 Create New Goal
              </h2>
              <CreateGoalForm
                onSubmit={handleCreateGoal}
                onCancel={() => setShowCreateForm(false)}
              />
            </div>
          ) : (
            <>
              {/* Create New Goal Button */}
              <div className="mb-8">
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="w-full p-6 bg-gradient-to-r from-cyan-500/20 to-violet-500/20 hover:from-cyan-500/30 hover:to-violet-500/30 border-2 border-dashed border-cyan-500/50 hover:border-cyan-400 rounded-2xl transition-all group"
                >
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-3xl group-hover:scale-110 transition-transform">
                      ✨
                    </span>
                    <span className="text-xl font-semibold text-white">
                      Start a New Goal
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm mt-2">
                    Begin your journey to success
                  </p>
                </button>
              </div>

              {/* Goals Grid */}
              {goals.length > 0 ? (
                <div>
                  <h2 className="text-lg font-semibold text-slate-300 mb-4 flex items-center gap-2">
                    <span>📋</span> Your Goals ({goals.length})
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {goals.map((goal) => (
                      <GoalCard
                        key={goal.id}
                        goal={goal}
                        onClick={() => handleGoalClick(goal.id)}
                        onDelete={() => deleteGoal(goal.id)}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🎯</div>
                  <p className="text-slate-400 text-lg">No goals yet</p>
                  <p className="text-slate-500 text-sm mt-2">
                    Create your first goal to start tracking your progress
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
