import type { PluginLogger } from '../interfaces/plugin.interface'

/**
 * Create a scoped logger for a plugin.
 * Uses console so SDK has no host dependency; host can replace via context if needed.
 */
export function createPluginLogger(pluginId: string): PluginLogger {
  const prefix = `[${pluginId}]`

  return {
    info: (message: string) => console.log(`${prefix} ${message}`),
    error: (message: string, error?: unknown) =>
      console.error(`${prefix} ${message}`, error),
    warn: (message: string) => console.warn(`${prefix} ${message}`),
    success: (message: string) => console.log(`${prefix} ✓ ${message}`),
    progress: (message: string) => console.log(`${prefix} ... ${message}`),
  }
}
