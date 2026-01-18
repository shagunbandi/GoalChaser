import { doc, getDoc, setDoc } from 'firebase/firestore'
import { getDb } from '@/lib/firebase'

export interface AnalyticsConfig {
  /** Plugin IDs that are visible in analytics */
  visiblePlugins: string[]
}

/**
 * Load analytics configuration from Firebase
 */
export async function loadAnalyticsConfig(
  userId: string,
  goalId: string
): Promise<AnalyticsConfig | null> {
  try {
    const db = getDb()
    const docRef = doc(db, 'users', userId, 'goals', goalId, 'config', 'analytics')
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return docSnap.data() as AnalyticsConfig
    }

    // Return null if not found (will use all enabled addons as default)
    return null
  } catch (error) {
    console.error('Error loading analytics config:', error)
    return null
  }
}

/**
 * Save analytics configuration to Firebase
 */
export async function saveAnalyticsConfig(
  userId: string,
  goalId: string,
  config: AnalyticsConfig
): Promise<void> {
  try {
    const db = getDb()
    const docRef = doc(db, 'users', userId, 'goals', goalId, 'config', 'analytics')
    await setDoc(docRef, config)
  } catch (error) {
    console.error('Error saving analytics config:', error)
    throw error
  }
}
