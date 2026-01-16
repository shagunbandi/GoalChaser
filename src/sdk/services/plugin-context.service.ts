import type { PluginContext } from '../interfaces/plugin.interface'
import type { PluginGoalInfo } from '../types'
import { createPluginFirestore } from './firestore.service'
import { createPluginLogger } from './logger.service'
import { getFirebaseDb } from '@/lib/firebase-service'

/**
 * Create a plugin context for data loading
 */
export function createPluginContext(params: {
  userId: string
  goalId: string
  pluginId: string
  goal?: PluginGoalInfo
}): PluginContext {
  const { userId, goalId, pluginId, goal } = params
  const db = getFirebaseDb()

  return {
    userId,
    goalId,
    goal,
    firestore: createPluginFirestore(db, userId, goalId, pluginId),
    logger: createPluginLogger(pluginId),
  }
}
