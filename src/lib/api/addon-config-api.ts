import { doc, getDoc, setDoc } from 'firebase/firestore'
import { getDb } from '@/lib/firebase'
import type { GoalAddonsConfig } from '@/types/addon-config'
import { pluginRegistry } from '@/core/plugin-registry'

function getDefaultAddons(): string[] {
  const coreAddons = ['calendar', 'analytics']
  const pluginDefaults = pluginRegistry.getAllPlugins()
    .filter(p => p.metadata.enabledByDefault)
    .map(p => p.id)
  return [...coreAddons, ...pluginDefaults]
}

/**
 * Load goal add-ons configuration from Firebase
 */
export async function loadGoalAddonsConfig(
  userId: string,
  goalId: string
): Promise<GoalAddonsConfig> {
  try {
    const db = getDb()
    const docRef = doc(db, 'users', userId, 'goals', goalId, 'config', 'addons')
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return docSnap.data() as GoalAddonsConfig
    }

    // Return default config if not found
    return { enabled: getDefaultAddons() }
  } catch (error) {
    console.error('Error loading goal addons config:', error)
    return { enabled: getDefaultAddons() }
  }
}

/**
 * Save goal add-ons configuration to Firebase
 */
export async function saveGoalAddonsConfig(
  userId: string,
  goalId: string,
  config: GoalAddonsConfig
): Promise<void> {
  try {
    const db = getDb()
    const docRef = doc(db, 'users', userId, 'goals', goalId, 'config', 'addons')
    await setDoc(docRef, config)
  } catch (error) {
    console.error('Error saving goal addons config:', error)
    throw error
  }
}
