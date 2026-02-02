'use client'

import { createContext } from 'react'

/**
 * Value provided by the host so usePluginPage can work without importing host hooks.
 * The host wraps plugin routes in PluginScopeProvider with this value.
 */
export interface PluginScopeValue {
  goal: unknown
  isLoading: boolean
  todayISO: string
  pluginData: Record<string, unknown> | undefined
  pluginConfigs: Record<string, unknown> | undefined
  handleUpdateData: (
    pluginId: string,
    iso: string,
    updates: Record<string, unknown>
  ) => Promise<void>
  handleUpdateDataBatch: (
    pluginId: string,
    updates: Array<{ date: string; updates: Record<string, unknown> }>
  ) => Promise<void>
  updateConfig: (pluginId: string, config: Record<string, unknown>) => Promise<void>
  reload: () => Promise<void>
  router: { push: (url: string) => void; replace: (url: string, opts?: { scroll?: boolean }) => void }
  searchParams: { get: (key: string) => string | null }
}

export const PluginScopeContext =
  createContext<PluginScopeValue | null>(null)
