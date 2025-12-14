'use client'

import { useGoals } from '@/hooks/useGoals'
import { useAuth } from '@/hooks/useAuth'
import { SignInView, Dashboard } from '@/components/features/home'

export default function Home() {
  const { user, isLoading: authLoading } = useAuth()
  const { goals, isLoading, createGoal, deleteGoal } = useGoals()

  // Loading state
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-background">
          <div className="orb-1" />
          <div className="orb-2" />
        </div>
        <div className="noise-overlay" />
        <div className="relative z-10 text-center">
          <div className="w-10 h-10 border-2 border-[#007AFF] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/40 text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  // Not authenticated - show sign in
  if (!user) {
    return <SignInView />
  }

  // Authenticated - show dashboard
  return (
    <Dashboard
      user={user}
      goals={goals}
      createGoal={createGoal}
      deleteGoal={deleteGoal}
    />
  )
}
