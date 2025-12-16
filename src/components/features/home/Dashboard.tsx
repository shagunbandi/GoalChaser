'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { User } from 'firebase/auth'
import { Goal } from '@/hooks/useGoals'
import { UserAvatar } from '@/hooks/useAuth'
import { GoalCard } from './GoalCard'
import { CreateGoalForm, CreateGoalFormData } from './CreateGoalForm'

interface DashboardProps {
  user: User
  goals: Goal[]
  createGoal: (options: CreateGoalFormData) => Promise<Goal>
  deleteGoal: (id: string) => Promise<void>
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export function Dashboard({
  user,
  goals,
  createGoal,
  deleteGoal,
}: DashboardProps) {
  const router = useRouter()
  const [showCreateForm, setShowCreateForm] = useState(false)

  const handleCreateGoal = async (data: CreateGoalFormData) => {
    const newGoal = await createGoal(data)
    router.push(`/goal/${newGoal.id}`)
  }

  const handleGoalClick = (goalId: string) => {
    router.push(`/goal/${goalId}`)
  }

  const firstName = user.displayName?.split(' ')[0] || 'there'

  return (
    <div className="min-h-screen">
      <div className="glass-background">
        <div className="orb-1" />
        <div className="orb-2" />
      </div>
      <div className="noise-overlay" />

      <div className="relative z-10 min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#0a0a12]/70 border-b border-white/[0.06]">
          <div className="max-w-2xl mx-auto px-5 h-16 flex items-center justify-between">
            <h1 className="text-xl font-bold tracking-tight text-gradient">
              Nitya
            </h1>
            <UserAvatar size="sm" />
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-2xl mx-auto px-5 py-8">
          {/* Greeting */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-white/90 mb-1">
              {getGreeting()}, {firstName}
            </h2>
            <p className="text-white/40 text-sm">
              {goals.length === 0
                ? 'Ready to start your journey?'
                : `You have ${goals.length} active goal${
                    goals.length !== 1 ? 's' : ''
                  }`}
            </p>
          </div>

          {/* Create Goal Section */}
          {showCreateForm ? (
            <div className="mb-8 bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/[0.08] p-6 animate-fade-in">
              <h3 className="text-lg font-semibold text-white/90 mb-4">
                Create New Goal
              </h3>
              <CreateGoalForm
                onSubmit={handleCreateGoal}
                onCancel={() => setShowCreateForm(false)}
              />
            </div>
          ) : (
            <button
              onClick={() => setShowCreateForm(true)}
              className="
                w-full mb-8 p-4
                flex items-center justify-center gap-3
                bg-[#007AFF]/10 hover:bg-[#007AFF]/20
                border border-[#007AFF]/30 hover:border-[#007AFF]/50
                rounded-2xl
                transition-all duration-200
                group
              "
            >
              <div className="w-8 h-8 rounded-full bg-[#007AFF] flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </div>
              <span className="text-white/80 font-medium">Create New Goal</span>
            </button>
          )}

          {/* Goals List */}
          {goals.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-white/50 uppercase tracking-wider">
                  Your Goals
                </h3>
              </div>
              {goals.map((goal, index) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onClick={() => handleGoalClick(goal.id)}
                  onDelete={() => deleteGoal(goal.id)}
                  index={index}
                />
              ))}
            </div>
          ) : (
            !showCreateForm && (
              <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white/[0.03] border border-white/[0.08] flex items-center justify-center">
                  <svg
                    className="w-10 h-10 text-white/20"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-white/70 mb-2">
                  No goals yet
                </h3>
                <p className="text-white/40 text-sm max-w-xs mx-auto">
                  Create your first goal to start tracking your daily progress
                  and building better habits.
                </p>
              </div>
            )
          )}
        </main>
      </div>
    </div>
  )
}
