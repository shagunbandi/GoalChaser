/**
 * Plugin Registry Hook
 * 
 * Provides access to the plugin registry in React components
 */

import { useEffect, useState } from 'react'
import { pluginRegistry } from './index'
import type { Plugin } from '@/sdk'

/**
 * Hook to use the plugin registry
 * Automatically initializes the registry on first use
 */
export function usePluginRegistry() {
  const [initialized, setInitialized] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
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
