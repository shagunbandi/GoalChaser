/**
 * Goal Layout - Persistent shell for all goal-related pages
 *
 * This layout wraps all routes under /goal/[id]/* and provides:
 * - Persistent navbar that doesn't re-render on navigation
 * - Persistent tab bar for plugin switching
 * - Shared background and styling
 */

'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useGoals } from '@/hooks/useGoals'
import { useAddonsConfig } from '@/hooks/useAddonsConfig'
import { Navbar } from '@/components/ui'
import { GroupedTabBar, AddonsManagerModal } from '@/components/features'

interface GoalLayoutProps {
  children: React.ReactNode
}

export default function GoalLayout({ children }: GoalLayoutProps) {
  const params = useParams()
  const router = useRouter()
  const goalId = params.id as string
  const pluginSegments = (params.plugin as string[]) || []

  const { user, isLoading: authLoading } = useAuth()
  const { getGoal, isLoading: goalsLoading } = useGoals()
  const goal = getGoal(goalId)

  const { enabledAddons, saveAddons } = useAddonsConfig(user?.uid, goalId)
  const [showAddonsManager, setShowAddonsManager] = useState(false)

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/')
    }
  }, [authLoading, user, router])

  // Loading state - show while auth/goals are loading
  if (authLoading || goalsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-background">
          <div className="orb-1" />
          <div className="orb-2" />
        </div>
        <div className="noise-overlay" />
        <div className="relative z-10 text-center">
          <div className="w-12 h-12 border-2 border-[#007AFF] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/50">Loading...</p>
        </div>
      </div>
    )
  }

  // Not authenticated
  if (!user) {
    return null
  }

  // Goal not found
  if (!goal) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-background">
          <div className="orb-1" />
          <div className="orb-2" />
        </div>
        <div className="noise-overlay" />
        <div className="relative z-10 text-center">
          <div className="text-6xl mb-4 opacity-80">🤔</div>
          <h1 className="text-2xl font-semibold text-white/90 mb-4">
            Goal Not Found
          </h1>
          <p className="text-white/50 mb-6">
            This goal doesn&apos;t exist or was deleted.
          </p>
        </div>
      </div>
    )
  }

  // Determine current plugin and year from URL
  const currentPlugin = pluginSegments[0] || 'calendar'
  const currentYear =
    pluginSegments[1] && !isNaN(parseInt(pluginSegments[1]))
      ? parseInt(pluginSegments[1])
      : new Date().getFullYear()

  return (
    <div className="min-h-screen">
      {/* Shared background - persists across navigation */}
      <div className="glass-background">
        <div className="orb-1" />
        <div className="orb-2" />
      </div>
      <div className="noise-overlay" />

      {/* Persistent Navbar - never re-renders on plugin change */}
      <Navbar
        goalId={goalId}
        goalName={goal.name}
        goalDescription={goal.description}
      >
        <GroupedTabBar
          goalId={goalId}
          currentAddon={currentPlugin as any}
          currentYear={currentYear}
          enabledAddons={enabledAddons}
          onManageAddons={() => setShowAddonsManager(true)}
        />
      </Navbar>

      {/* Page content - only this changes on navigation */}
      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-6">
          {children}
        </div>
      </div>

      {/* Addons Manager Modal */}
      <AddonsManagerModal
        open={showAddonsManager}
        onClose={() => setShowAddonsManager(false)}
        goalId={goalId}
        enabledAddons={enabledAddons}
        onSave={saveAddons}
      />
    </div>
  )
}
