import {
  collection,
  doc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
} from 'firebase/firestore'
import type { PluginFirestore } from '../interfaces/plugin.interface'

/**
 * Create a scoped Firestore service for a plugin
 * All paths are automatically scoped to: users/{userId}/goals/{goalId}/addons/{pluginId}/
 * 
 * @param db Firestore database instance
 * @param userId User ID
 * @param goalId Goal ID
 * @param pluginId Plugin ID
 */
export function createPluginFirestore(
  db: any,
  userId: string,
  goalId: string,
  pluginId: string
): PluginFirestore {
  const basePath = `users/${userId}/goals/${goalId}/addons/${pluginId}`

  /**
   * Scope a relative path to the plugin's base path
   */
  function scopePath(path: string): string {
    // Remove leading/trailing slashes
    const cleanPath = path.replace(/^\/+|\/+$/g, '')
    return `${basePath}/${cleanPath}`
  }

  return {
    collection: (path: string) => {
      return collection(db, scopePath(path))
    },

    doc: (path: string) => {
      return doc(db, scopePath(path))
    },

    query,
    where,
    orderBy,
    limit,
    getDocs,
    getDoc,
    setDoc,
    deleteDoc,
  }
}
