import type { Plugin, PluginContext } from '@/sdk/interfaces/plugin.interface'
import { getDb } from '@/lib/firebase'
import { createPluginFirestore, createPluginLogger } from '@/sdk/services'
import type { Goal } from '@/types'

/**
 * Plugin Registry
 * Central registry for discovering, loading, and managing plugins
 * 
 * This registry:
 * - Discovers plugins from the manifest
 * - Creates plugin contexts
 * - Provides plugin metadata to the UI
 * - Never imports from plugin packages directly (uses dynamic imports)
 */

class PluginRegistry {
  private plugins: Map<string, Plugin> = new Map()
  private initialized = false
  private initPromise: Promise<void> | null = null

  /**
   * Check if the registry is already initialized
   */
  isInitialized(): boolean {
    return this.initialized
  }

  /**
   * Initialize the registry by loading all plugins from the manifest
   * Uses promise-based guard to prevent race conditions
   */
  async initialize(): Promise<void> {
    // If already initialized, return immediately
    if (this.initialized) return

    // If initialization is in progress, wait for it
    if (this.initPromise) return this.initPromise

    // Start initialization and store the promise
    this.initPromise = this.doInitialize()
    return this.initPromise
  }

  private async doInitialize(): Promise<void> {
    const { AVAILABLE_PLUGINS } = await import('./manifest')
    
    for (const entry of AVAILABLE_PLUGINS) {
      if (!entry.enabled) continue

      try {
        const plugin = entry.plugin

        if (!this.validatePlugin(plugin)) {
          console.error(`[PluginRegistry] Invalid plugin:`, plugin)
          continue
        }

        this.plugins.set(plugin.id, plugin)
        console.log(`[PluginRegistry] Loaded plugin: ${plugin.id}`)
      } catch (error) {
        console.error(`[PluginRegistry] Failed to load plugin:`, error)
      }
    }

    this.initialized = true
  }

  /**
   * Validate that a plugin implements the required interface
   */
  private validatePlugin(plugin: any): plugin is Plugin {
    return (
      typeof plugin === 'object' &&
      typeof plugin.id === 'string' &&
      typeof plugin.metadata === 'object' &&
      Array.isArray(plugin.routes) &&
      typeof plugin.dataProvider === 'object'
    )
  }

  /**
   * Get a plugin by ID
   */
  getPlugin(pluginId: string): Plugin | undefined {
    return this.plugins.get(pluginId)
  }

  /**
   * Get all registered plugins
   */
  getAllPlugins(): Plugin[] {
    return Array.from(this.plugins.values())
  }

  /**
   * Get enabled plugins for a goal
   */
  getEnabledPlugins(enabledIds: string[]): Plugin[] {
    return enabledIds
      .map(id => this.plugins.get(id))
      .filter((p): p is Plugin => p !== undefined)
  }

  /**
   * Get primary plugins (always enabled)
   */
  getPrimaryPlugins(): Plugin[] {
    return this.getAllPlugins().filter(p => p.metadata.isPrimary)
  }

  /**
   * Get manageable plugins (can be enabled/disabled)
   */
  getManageablePlugins(): Plugin[] {
    return this.getAllPlugins().filter(p => !p.metadata.isPrimary)
  }

  /**
   * Create a plugin context for a specific user, goal, and plugin
   */
  createContext(userId: string, goalId: string, pluginId: string, goal?: Goal): PluginContext {
    const db = getDb()
    
    return {
      userId,
      goalId,
      firestore: createPluginFirestore(db, userId, goalId, pluginId),
      logger: createPluginLogger(pluginId),
      goal: goal ? {
        name: goal.name,
        color: goal.color,
        startDate: goal.startDate,
        endDate: goal.endDate,
      } : undefined,
    }
  }

  /**
   * Get all routes for enabled plugins
   */
  getRoutes(enabledPluginIds: string[]): PluginRouteInfo[] {
    const routes: PluginRouteInfo[] = []
    
    for (const pluginId of enabledPluginIds) {
      const plugin = this.plugins.get(pluginId)
      if (!plugin) continue

      for (const route of plugin.routes) {
        routes.push({
          pluginId: plugin.id,
          pluginName: plugin.metadata.name,
          path: route.path,
          component: route.component,
          requiresYear: route.requiresYear,
        })
      }
    }

    return routes
  }
}

/**
 * Plugin route information
 */
export interface PluginRouteInfo {
  pluginId: string
  pluginName: string
  path: string
  component: React.ComponentType<any>
  requiresYear?: boolean
}

// Singleton instance
const registry = new PluginRegistry()

export { registry as pluginRegistry }
export type { PluginRegistry }
