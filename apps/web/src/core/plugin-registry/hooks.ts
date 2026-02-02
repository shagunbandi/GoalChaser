/**
 * Plugin Registry Hook
 * 
 * Provides access to the plugin registry in React components
 */

import { useEffect, useState } from 'react'
import { pluginRegistry } from './index'
import type { Plugin } from '@goal-chaser/sdk'

/**
 * Hook to use the plugin registry
 * Automatically initializes the registry on first use
 * Uses registry's actual state as initial value to avoid unnecessary re-renders
 */
export function usePluginRegistry() {
  // Use the actual registry state as initial value - prevents re-renders on navigation
  const [initialized, setInitialized] = useState(() => pluginRegistry.isInitialized())
  const [loading, setLoading] = useState(() => !pluginRegistry.isInitialized())

  useEffect(() => {
    // If already initialized, no need to do anything
    if (pluginRegistry.isInitialized()) {
      setInitialized(true)
      setLoading(false)
      return
    }

    async function init() {
      try {
        await pluginRegistry.initialize()
        setInitialized(true)
      } catch (error) {
        console.error('[usePluginRegistry] Failed to initialize', error)
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [])

  return {
    registry: pluginRegistry,
    initialized,
    loading,
  }
}

/**
 * Hook to get enabled plugins for a goal
 */
export function useEnabledPlugins(enabledIds: string[]): {
  plugins: Plugin[]
  loading: boolean
} {
  const { registry, loading: registryLoading } = usePluginRegistry()
  const [plugins, setPlugins] = useState<Plugin[]>([])

  useEffect(() => {
    if (!registryLoading) {
      setPlugins(registry.getEnabledPlugins(enabledIds))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabledIds, registryLoading]) // registry is a singleton, don't include it

  return { plugins, loading: registryLoading }
}

/**
 * Hook to get all manageable plugins
 */
export function useManageablePlugins(): {
  plugins: Plugin[]
  loading: boolean
} {
  const { registry, loading: registryLoading } = usePluginRegistry()
  const [plugins, setPlugins] = useState<Plugin[]>([])

  useEffect(() => {
    if (!registryLoading) {
      setPlugins(registry.getManageablePlugins())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registryLoading]) // registry is a singleton, don't include it

  return { plugins, loading: registryLoading }
}
