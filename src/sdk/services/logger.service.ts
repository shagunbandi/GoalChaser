import type { PluginLogger } from '../interfaces/plugin.interface'
import { logger as coreLogger } from '@/lib/logger'

/**
 * Create a scoped logger for a plugin
 * @param pluginId Plugin identifier
 */
export function createPluginLogger(pluginId: string): PluginLogger {
  const prefix = `[${pluginId}]`

  return {
    info: (message: string) => {
      coreLogger.info(`${prefix} ${message}`)
    },
    error: (message: string, error?: unknown) => {
      coreLogger.error(`${prefix} ${message}`, error)
    },
    warn: (message: string) => {
      // Core logger doesn't have warn, use info instead
      coreLogger.info(`${prefix} ⚠️ ${message}`)
    },
    success: (message: string) => {
      coreLogger.success(`${prefix} ${message}`)
    },
    progress: (message: string) => {
      coreLogger.progress(`${prefix} ${message}`)
    },
  }
}
