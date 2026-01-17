/**
 * Dynamic Route Handler for Goal Plugin Pages
 *
 * Route: /goal/[id]/[[...plugin]]
 *
 * Examples:
 * - /goal/abc123 -> Calendar
 * - /goal/abc123/study/2024 -> Study plugin for 2024
 * - /goal/abc123/productivity/2024/3 -> Productivity plugin for March 2024
 */

'use client'

import { useParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useGoals } from '@/hooks/useGoals'
import { usePluginRegistry } from '@/core/plugin-registry/hooks'
import type { PluginContext } from '@/sdk'

// Core Calendar page
import CalendarPage from '@/components/features/calendar/CalendarPage'

export default function PluginPage() {
  const params = useParams()
  const goalId = params.id as string
  const pluginSegments = (params.plugin as string[]) || []

  const { user } = useAuth()
  const { getGoal } = useGoals()
  const goal = getGoal(goalId)
  const { registry, loading: registryLoading } = usePluginRegistry()

  // Parse URL segments directly
  const pluginId = pluginSegments[0] || 'calendar'

  // Parse year
  let year: number | undefined
  if (pluginSegments.length > 1) {
    const parsed = parseInt(pluginSegments[1])
    if (!isNaN(parsed)) {
      year = parsed
    }
  }

  // Parse month
  let month: number | undefined
  if (pluginSegments.length > 2) {
    const parsed = parseInt(pluginSegments[2])
    if (!isNaN(parsed) && parsed >= 1 && parsed <= 12) {
      month = parsed
    }
  }

  // Loading state
  if (registryLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-[#007AFF] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Not ready
  if (!user || !goal) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-[#007AFF] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Calendar - default route
  if (pluginId === 'calendar') {
    const context: PluginContext = {
      userId: user.uid,
      goalId,
      goal,
      logger: {
        info: (msg: string) => console.log(`[Calendar] ${msg}`),
        error: (msg: string, err?: unknown) =>
          console.error(`[Calendar] ${msg}`, err),
        warn: (msg: string) => console.warn(`[Calendar] ${msg}`),
        success: (msg: string) => console.log(`[Calendar] ✓ ${msg}`),
        progress: (msg: string) => console.log(`[Calendar] ... ${msg}`),
      },
      firestore: {} as any,
    }

    return <CalendarPage context={context} year={year} />
  }

  // Load plugin
  const plugin = registry.getPlugin(pluginId)
  if (!plugin) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4 opacity-80">🔌</div>
        <h2 className="text-xl font-semibold text-white/90 mb-2">
          Plugin Not Found
        </h2>
        <p className="text-white/50">
          Plugin &quot;{pluginId}&quot; doesn&apos;t exist or isn&apos;t
          enabled.
        </p>
      </div>
    )
  }

  // Find route
  const route = plugin.routes.find((r) => {
    if (r.requiresYear) {
      return year !== undefined
    }
    return true
  })

  if (!route) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4 opacity-80">🔌</div>
        <h2 className="text-xl font-semibold text-white/90 mb-2">
          No Route Found
        </h2>
        <p className="text-white/50">No matching route for this plugin.</p>
      </div>
    )
  }

  // Create context
  const context = registry.createContext(user.uid, goalId, plugin.id, goal)
  const Component = route.component

  return (
    <Component
      context={context}
      params={{ id: goalId, plugin: pluginSegments }}
      year={year}
      month={month}
    />
  )
}
