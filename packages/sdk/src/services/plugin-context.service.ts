import type { PluginContext } from '../interfaces/plugin.interface'
import type { PluginGoalInfo } from '../types'
import { createPluginFirestore } from './firestore.service'
import { createPluginLogger } from './logger.service'

/**
 * Create a plugin context for data loading.
 * Host passes its Firestore instance (db); SDK does not import from host.
 */
export function createPluginContext(params: {
  userId: string
  goalId: string
  pluginId: string
  db: unknown
  goal?: PluginGoalInfo
}): PluginContext {
  const { userId, goalId, pluginId, db, goal } = params

  return {
    userId,
    goalId,
    goal,
    firestore: createPluginFirestore(db as any, userId, goalId, pluginId),
    logger: createPluginLogger(pluginId),
  }
}
