/**
 * Dynamic Route Handler for Goal Pages
 * 
 * This page handles both the core calendar view and plugin routes.
 * Route: /goal/[id]/[[...plugin]]
 * 
 * Examples:
 * - /goal/abc123 -> Calendar (core, always available)
 * - /goal/abc123/hours/2024 -> Hours plugin for 2024
 * - /goal/abc123/productivity/2024 -> Productivity plugin for 2024
 */

'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useGoals } from '@/hooks/useGoals'
import { usePluginRegistry } from '@/core/plugin-registry/hooks'
import { useAddonsConfig } from '@/hooks/useAddonsConfig'
import { Navbar } from '@/components/ui'
import { GroupedTabBar, AddonsManagerModal } from '@/components/features'
import type { Plugin, PluginContext } from '@/sdk'

// Core Calendar components (not a plugin)
import CalendarPage from '@/components/features/calendar/CalendarPage'

export default function PluginPage() {
  const params = useParams()
  const router = useRouter()
  const goalId = params.id as string
  const pluginSegments = (params.plugin as string[]) || []
  // Create a stable string representation to avoid array comparison issues
  const pluginPath = pluginSegments.join('/')
  
  const { user, isLoading: authLoading } = useAuth()
  const { getGoal, isLoading: goalsLoading } = useGoals()
  const goal = getGoal(goalId)
  
  const { enabledAddons, saveAddons } = useAddonsConfig(user?.uid, goalId)
  const [showAddonsManager, setShowAddonsManager] = useState(false)
  
  const [plugin, setPlugin] = useState<Plugin | null>(null)
  const [PluginComponent, setPluginComponent] = useState<React.ComponentType<any> | null>(null)
  const [context, setContext] = useState<PluginContext | null>(null)
  const [year, setYear] = useState<number | undefined>(undefined)
  
  // Use the registry hook instead of initializing directly
  const { registry: pluginReg, loading: registryLoading } = usePluginRegistry()

  // Resolve plugin route once registry is loaded
  useEffect(() => {
    if (registryLoading) return
    
    async function resolveRoute() {
      try {
        
        // If no plugin segments, show Calendar (core feature, not a plugin)
        if (pluginSegments.length === 0) {
          setPlugin(null) // null indicates core calendar
          setPluginComponent(() => CalendarPage)
          setYear(undefined)
          
          // Create a minimal context for calendar
          if (user) {
            const ctx: PluginContext = {
              userId: user.uid,
              goalId,
              goal,
              logger: {
                info: (msg: string) => console.log(`[Calendar] ${msg}`),
                error: (msg: string, err?: unknown) => console.error(`[Calendar] ${msg}`, err),
                warn: (msg: string) => console.warn(`[Calendar] ${msg}`),
                success: (msg: string) => console.log(`[Calendar] ✓ ${msg}`),
                progress: (msg: string) => console.log(`[Calendar] ... ${msg}`),
              },
              firestore: {} as any, // Not used by calendar
            }
            setContext(ctx)
          }
          return
        }
        
        // Otherwise, load a plugin
        const pluginId = pluginSegments[0]
        let yearParam: number | undefined
        
        // If there's a second segment and it's a number, it's the year
        if (pluginSegments.length > 1) {
          const parsedYear = parseInt(pluginSegments[1])
          if (!isNaN(parsedYear)) {
            yearParam = parsedYear
          }
        }
        
        const loadedPlugin = pluginReg.getPlugin(pluginId)
        
        if (!loadedPlugin) {
          console.error(`Plugin not found: ${pluginId}`)
          return
        }
        
        // Find the matching route
        const route = loadedPlugin.routes.find(r => {
          if (r.requiresYear) {
            return yearParam !== undefined
          }
          return true
        })
        
        if (!route) {
          console.error(`No matching route for plugin: ${pluginId}`)
          return
        }
        
        setPlugin(loadedPlugin)
        setPluginComponent(() => route.component)
        setYear(yearParam)
        
        // Create plugin context
        if (user) {
          const ctx = pluginReg.createContext(user.uid, goalId, loadedPlugin.id, goal)
          setContext(ctx)
        }
        
      } catch (error) {
        console.error('Failed to resolve plugin:', error)
      }
    }

    resolveRoute()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pluginPath, user?.uid, goalId, registryLoading]) // goal and pluginReg are singletons, don't need to be in deps

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/')
    }
  }, [authLoading, user, router])

  // Loading state
  if (authLoading || goalsLoading || registryLoading) {
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
          <h1 className="text-2xl font-semibold text-white/90 mb-4">Goal Not Found</h1>
          <p className="text-white/50 mb-6">This goal doesn&apos;t exist or was deleted.</p>
        </div>
      </div>
    )
  }

  // Component not loaded yet
  if (!PluginComponent || !context) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-background">
          <div className="orb-1" />
          <div className="orb-2" />
        </div>
        <div className="noise-overlay" />
        <div className="relative z-10 text-center">
          <div className="text-6xl mb-4 opacity-80">🔌</div>
          <h1 className="text-2xl font-semibold text-white/90 mb-4">Loading...</h1>
          <p className="text-white/50 mb-6">Please wait...</p>
        </div>
      </div>
    )
  }

  // Get current year for tab navigation
  const currentYear = year || new Date().getFullYear()

  return (
    <div className="min-h-screen">
      <div className="glass-background">
        <div className="orb-1" />
        <div className="orb-2" />
      </div>
      <div className="noise-overlay" />

      <Navbar
        goalId={goalId}
        goalName={goal.name}
        goalDescription={goal.description}
      >
        <GroupedTabBar
          goalId={goalId}
          currentAddon={(plugin?.id || 'calendar') as any}
          currentYear={currentYear}
          enabledAddons={enabledAddons}
          onManageAddons={() => setShowAddonsManager(true)}
        />
      </Navbar>

      <div className="relative z-10 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <PluginComponent
            context={context}
            params={params}
            year={year}
          />
        </div>
      </div>

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
