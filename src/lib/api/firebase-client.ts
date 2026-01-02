// Firebase client initialization and instance management

import { logger } from '@/lib/logger'

let firebaseAvailable = true
let db: ReturnType<typeof import('firebase/firestore').getFirestore> | null = null

export async function initFirebase() {
  if (!firebaseAvailable) {
    logger.error('Firebase not available - previously failed to initialize')
    return null
  }

  try {
    logger.progress('Initializing Firebase...')
    const { initializeApp, getApps } = await import('firebase/app')
    const { getFirestore } = await import('firebase/firestore')

    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    }

    if (!firebaseConfig.projectId) {
      logger.error('Firebase config missing (no projectId), using localStorage only')
      firebaseAvailable = false
      return null
    }

    const app =
      getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
    db = getFirestore(app)
    logger.success('Firebase initialized successfully')
    return db
  } catch (error) {
    logger.error('Firebase initialization failed', error)
    firebaseAvailable = false
    return null
  }
}

export function getFirebaseDb() {
  if (!db) {
    logger.info('Firebase DB not available')
  }
  return db
}

export function isFirebaseAvailable() {
  return firebaseAvailable
}

