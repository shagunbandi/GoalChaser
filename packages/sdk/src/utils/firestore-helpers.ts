/**
 * Common Firestore utility functions for plugins
 * Reduces boilerplate in plugin API files
 */

import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  deleteDoc,
  query, 
  where,
  type Firestore 
} from 'firebase/firestore'

/**
 * Remove undefined fields from an object (Firestore doesn't accept undefined)
 */
export function removeUndefinedFields<T extends Record<string, any>>(obj: T): Partial<T> {
  const cleaned: any = {}
  Object.entries(obj).forEach(([key, value]) => {
    if (value !== undefined) {
      if (Array.isArray(value)) {
        cleaned[key] = value.map(item => 
          typeof item === 'object' && item !== null ? removeUndefinedFields(item) : item
        )
      } else if (value && typeof value === 'object' && !(value instanceof Date)) {
        cleaned[key] = removeUndefinedFields(value)
      } else {
        cleaned[key] = value
      }
    }
  })
  return cleaned
}

/**
 * Load a single document from Firestore
 */
export async function loadDocument<T>(
  db: Firestore,
  path: string[]
): Promise<T | null> {
  try {
    const docRef = doc(db, path[0], ...path.slice(1))
    const docSnap = await getDoc(docRef)
    
    if (!docSnap.exists()) {
      return null
    }
    
    return docSnap.data() as T
  } catch (error) {
    console.error('Failed to load document:', error)
    return null
  }
}

/**
 * Save a document to Firestore (with merge)
 */
export async function saveDocument<T extends Record<string, any>>(
  db: Firestore,
  path: string[],
  data: T,
  options: { merge?: boolean } = { merge: true }
): Promise<boolean> {
  try {
    const docRef = doc(db, path[0], ...path.slice(1))
    const cleanData = removeUndefinedFields(data)
    
    await setDoc(docRef, cleanData, { merge: options.merge })
    return true
  } catch (error) {
    console.error('Failed to save document:', error)
    return false
  }
}

/**
 * Delete a document from Firestore
 */
export async function deleteDocument(
  db: Firestore,
  path: string[]
): Promise<boolean> {
  try {
    const docRef = doc(db, path[0], ...path.slice(1))
    await deleteDoc(docRef)
    return true
  } catch (error) {
    console.error('Failed to delete document:', error)
    return false
  }
}

/**
 * Load documents from a collection
 */
export async function loadCollection<T>(
  db: Firestore,
  path: string[]
): Promise<T[]> {
  try {
    const collectionRef = collection(db, path[0], ...path.slice(1))
    const snapshot = await getDocs(collectionRef)
    
    const results: T[] = []
    snapshot.forEach((doc) => {
      results.push({ id: doc.id, ...doc.data() } as T)
    })
    
    return results
  } catch (error) {
    console.error('Failed to load collection:', error)
    return []
  }
}

/**
 * Load documents from a date range
 */
export async function loadDateRange<T>(
  db: Firestore,
  path: string[],
  startDate: string,
  endDate: string
): Promise<Record<string, T>> {
  try {
    const collectionRef = collection(db, path[0], ...path.slice(1))
    const q = query(
      collectionRef,
      where('__name__', '>=', startDate),
      where('__name__', '<=', endDate)
    )
    
    const snapshot = await getDocs(q)
    const result: Record<string, T> = {}
    
    snapshot.forEach((docSnap) => {
      result[docSnap.id] = docSnap.data() as T
    })
    
    return result
  } catch (error) {
    console.error('Failed to load date range:', error)
    return {}
  }
}

/**
 * Build a Firestore path for a plugin
 */
export function buildPluginPath(
  userId: string,
  goalId: string,
  pluginId: string,
  ...segments: string[]
): string[] {
  return ['users', userId, 'goals', goalId, 'addons', pluginId, ...segments]
}

/**
 * Build a Firestore path for plugin day data
 */
export function buildPluginDayPath(
  userId: string,
  goalId: string,
  pluginId: string,
  date: string
): string[] {
  return buildPluginPath(userId, goalId, pluginId, 'days', date)
}

/**
 * Build a Firestore path for plugin config
 */
export function buildPluginConfigPath(
  userId: string,
  goalId: string,
  pluginId: string
): string[] {
  return buildPluginPath(userId, goalId, pluginId, 'settings', 'config')
}
