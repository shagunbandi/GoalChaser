import { logger } from '@/utils/logger'

let firebaseAvailable = true
let db: ReturnType<typeof import('firebase/firestore').getFirestore> | null = null
let isUsingEmulator = false

export async function initFirebase() {
  if (!firebaseAvailable) {
    logger.error('Firebase not available - previously failed to initialize')
    return null
  }

  try {
    logger.progress('Initializing Firebase...')
    const { initializeApp, getApps } = await import('firebase/app')
    const { getFirestore, connectFirestoreEmulator } = await import('firebase/firestore')
    const { getAuth, connectAuthEmulator } = await import('firebase/auth')

    const useEmulator = process.env.NEXT_PUBLIC_USE_EMULATOR === 'true' || 
                        process.env.USE_EMULATOR === 'true' ||
                        typeof window !== 'undefined' && window.location.hostname === 'localhost'

    const firebaseConfig = useEmulator ? {
      apiKey: 'demo-api-key',
      authDomain: 'localhost',
      projectId: 'demo-test',
      storageBucket: 'demo-test.appspot.com',
      messagingSenderId: '123456789',
      appId: 'demo-app-id',
    } : {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    }

    if (!useEmulator && !firebaseConfig.projectId) {
      logger.error('Firebase config missing (no projectId), using localStorage only')
      firebaseAvailable = false
      return null
    }

    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
    db = getFirestore(app)

    if (useEmulator && !isUsingEmulator) {
      logger.info('🔧 Connecting to Firebase Emulators...')
      const auth = getAuth(app)
      connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true })
      connectFirestoreEmulator(db, 'localhost', 8080)
      isUsingEmulator = true
      logger.success('✅ Connected to Firebase Emulators')
    } else {
      logger.success('Firebase initialized successfully')
    }
    
    return db
  } catch (error) {
    logger.error('Firebase initialization failed', error)
    firebaseAvailable = false
    return null
  }
}

export function getFirebaseDb() {
  return db
}

export function isFirebaseAvailable() {
  return firebaseAvailable
}

export function isFirebaseEmulator() {
  return isUsingEmulator
}
