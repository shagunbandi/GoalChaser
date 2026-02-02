import { logger } from '@/lib/logger'
import { getFirebaseDb as getDbFromService, initializeFirebase } from '@/lib/firebase-service'

let firebaseAvailable = true
let db: ReturnType<typeof import('firebase/firestore').getFirestore> | null = null

export async function initFirebase() {
  if (!firebaseAvailable) return null

  try {
    // Initialize (handles emulator/prod selection via NEXT_PUBLIC_USE_FIREBASE_EMULATOR)
    initializeFirebase()
    db = getDbFromService()
    return db
  } catch (error) {
    logger.error('Firebase initialization failed', error)
    firebaseAvailable = false
    db = null
    return null
  }
}

export function getFirebaseDb() {
  return db
}

export function isFirebaseAvailable() {
  return firebaseAvailable
}

