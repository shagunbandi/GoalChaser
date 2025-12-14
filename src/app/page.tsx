'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useGoals, Goal } from '@/hooks/useGoals'

// ============ Color Options ============
const GOAL_COLORS = [
  { name: 'Blue', value: 'blue', bg: 'bg-[#007AFF]', border: 'border-[#007AFF]', glow: 'shadow-[0_0_30px_rgba(0,122,255,0.4)]' },
  { name: 'Purple', value: 'purple', bg: 'bg-[#AF52DE]', border: 'border-[#AF52DE]', glow: 'shadow-[0_0_30px_rgba(175,82,222,0.4)]' },
  { name: 'Cyan', value: 'cyan', bg: 'bg-[#32D4DE]', border: 'border-[#32D4DE]', glow: 'shadow-[0_0_30px_rgba(50,212,222,0.4)]' },
  { name: 'Pink', value: 'pink', bg: 'bg-[#FF2D92]', border: 'border-[#FF2D92]', glow: 'shadow-[0_0_30px_rgba(255,45,146,0.4)]' },
  { name: 'Orange', value: 'orange', bg: 'bg-[#FF9500]', border: 'border-[#FF9500]', glow: 'shadow-[0_0_30px_rgba(255,149,0,0.4)]' },
  { name: 'Green', value: 'green', bg: 'bg-[#30D158]', border: 'border-[#30D158]', glow: 'shadow-[0_0_30px_rgba(48,209,88,0.4)]' },
]

// ============ Goal Card Component ============
interface GoalCardProps {
  goal: Goal
  onClick: () => void
  onDelete: () => void
}

function GoalCard({ goal, onClick, onDelete }: GoalCardProps) {
  const colorConfig = GOAL_COLORS.find((c) => c.value === goal.color) || GOAL_COLORS[0]
  const createdDate = new Date(goal.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div
      onClick={onClick}
      className="
        group relative overflow-hidden
        bg-white/[0.02] backdrop-blur-[40px]
        rounded-3xl border border-white/[0.06]
        p-6 cursor-pointer
        shadow-[0_4px_24px_-1px_rgba(0,0,0,0.2),inset_0_0_1px_rgba(255,255,255,0.1)]
        transition-all duration-300 ease-out
        hover:bg-white/[0.04] hover:border-white/[0.12]
        hover:shadow-[0_8px_40px_-1px_rgba(0,0,0,0.3),inset_0_0_1px_rgba(255,255,255,0.15)]
        hover:-translate-y-1
      "
    >
      {/* Top highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      
      {/* Color indicator with glow */}
      <div
        className={`absolute top-0 left-0 right-0 h-1 ${colorConfig.bg} rounded-t-3xl opacity-80`}
      />
      <div
        className={`absolute top-0 left-1/4 right-1/4 h-8 ${colorConfig.bg} opacity-20 blur-2xl`}
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
        className="
          absolute top-4 right-4 p-2 
          text-white/30 hover:text-red-400 
          opacity-0 group-hover:opacity-100 
          transition-all duration-200
          hover:bg-white/10 rounded-lg
        "
      >
        🗑️
      </button>

      {/* Content */}
      <div className="pt-3">
        <h3 className="text-xl font-semibold text-white/90 mb-2">{goal.name}</h3>
        {goal.description && (
          <p className="text-white/50 text-sm mb-4 line-clamp-2">
            {goal.description}
          </p>
        )}
        <p className="text-white/30 text-xs">Created {createdDate}</p>
      </div>

      {/* Arrow */}
      <div className="
        absolute bottom-6 right-6 
        text-white/30 
        group-hover:text-white/70 
        group-hover:translate-x-1 
        transition-all duration-200
        text-lg
      ">
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
  const [color, setColor] = useState('blue')

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
        <label className="block text-sm font-medium text-white/60 mb-2">
          Goal Name *
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Learn Spanish, Fitness Journey..."
          className="
            w-full px-4 py-3.5
            bg-white/[0.03] backdrop-blur-xl
            border border-white/[0.08] rounded-2xl
            text-white placeholder-white/30
            focus:outline-none focus:border-[#007AFF]/50
            focus:shadow-[0_0_0_3px_rgba(0,122,255,0.1)]
            transition-all duration-200
          "
          autoFocus
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-white/60 mb-2">
          Description (optional)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What do you want to achieve?"
          rows={3}
          className="
            w-full px-4 py-3.5
            bg-white/[0.03] backdrop-blur-xl
            border border-white/[0.08] rounded-2xl
            text-white placeholder-white/30
            focus:outline-none focus:border-[#007AFF]/50
            focus:shadow-[0_0_0_3px_rgba(0,122,255,0.1)]
            transition-all duration-200 resize-none
          "
        />
      </div>

      {/* Color Selection */}
      <div>
        <label className="block text-sm font-medium text-white/60 mb-3">
          Color Theme
        </label>
        <div className="flex flex-wrap gap-3">
          {GOAL_COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setColor(c.value)}
              className={`
                w-11 h-11 rounded-full ${c.bg} 
                transition-all duration-200
                ${color === c.value
                  ? `ring-2 ring-white/50 ring-offset-2 ring-offset-[#0a0a12] scale-110 ${c.glow}`
                  : 'opacity-50 hover:opacity-80 hover:scale-105'
                }
              `}
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
          className="
            flex-1 px-6 py-3.5
            bg-white/[0.05] hover:bg-white/[0.1]
            border border-white/[0.08] hover:border-white/[0.15]
            text-white/70 hover:text-white/90
            font-medium rounded-2xl
            transition-all duration-200
          "
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!name.trim()}
          className="
            flex-1 px-6 py-3.5
            bg-gradient-to-r from-[#007AFF] to-[#AF52DE]
            hover:from-[#007AFF]/90 hover:to-[#AF52DE]/90
            disabled:from-white/10 disabled:to-white/10
            disabled:text-white/30 disabled:cursor-not-allowed
            text-white font-semibold rounded-2xl
            shadow-[0_0_30px_rgba(0,122,255,0.3)]
            hover:shadow-[0_0_40px_rgba(0,122,255,0.4)]
            disabled:shadow-none
            transition-all duration-200
          "
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
      <div className="min-h-screen flex items-center justify-center">
        {/* Glass Background */}
        <div className="glass-background">
          <div className="orb-1" />
          <div className="orb-2" />
        </div>
        <div className="noise-overlay" />
        
        <div className="relative z-10 text-center">
          <div className="w-12 h-12 border-2 border-[#007AFF] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/50">Loading your goals...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Glass Background */}
      <div className="glass-background">
        <div className="orb-1" />
        <div className="orb-2" />
      </div>
      <div className="noise-overlay" />

      <div className="relative z-10 min-h-screen p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-14 pt-10">
            <h1 className="text-6xl font-bold tracking-tight text-gradient mb-4">
              Nitya
            </h1>
            <p className="text-white/50 text-lg">
              Track your progress, achieve your dreams
            </p>
          </div>

          {/* Create Form or Goals List */}
          {showCreateForm ? (
            <div className="
              bg-white/[0.02] backdrop-blur-[40px]
              rounded-3xl border border-white/[0.06]
              p-8 max-w-xl mx-auto
              shadow-[0_4px_24px_-1px_rgba(0,0,0,0.2),inset_0_0_1px_rgba(255,255,255,0.1)]
            ">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent rounded-t-3xl" />
              <h2 className="text-2xl font-semibold text-white/90 mb-6 text-center">
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
              <div className="mb-10">
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="
                    w-full p-7
                    bg-gradient-to-r from-[#007AFF]/10 to-[#AF52DE]/10
                    hover:from-[#007AFF]/20 hover:to-[#AF52DE]/20
                    border-2 border-dashed border-[#007AFF]/30
                    hover:border-[#007AFF]/50
                    rounded-3xl
                    transition-all duration-300
                    group
                  "
                >
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-3xl group-hover:scale-110 transition-transform duration-300">
                      ✨
                    </span>
                    <span className="text-xl font-semibold text-white/90">
                      Start a New Goal
                    </span>
                  </div>
                  <p className="text-white/40 text-sm mt-2">
                    Begin your journey to success
                  </p>
                </button>
              </div>

              {/* Goals Grid */}
              {goals.length > 0 ? (
                <div>
                  <h2 className="text-lg font-medium text-white/60 mb-5 flex items-center gap-2">
                    <span>📋</span> Your Goals ({goals.length})
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                <div className="text-center py-16">
                  <div className="text-6xl mb-4 opacity-80">🎯</div>
                  <p className="text-white/50 text-lg">No goals yet</p>
                  <p className="text-white/30 text-sm mt-2">
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
