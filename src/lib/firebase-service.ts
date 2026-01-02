/**
 * Centralized Firebase Service
 * 
 * This service handles all Firebase initialization and automatically
 * detects whether to use emulators (for testing) or production Firebase.
 * 
 * Usage:
 *   import { getFirebaseAuth, getFirebaseDb } from '@/lib/firebase-service'
 *   
 *   const auth = getFirebaseAuth()
 *   const db = getFirebaseDb()
 */

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getAuth, connectAuthEmulator, type Auth } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator, type Firestore } from 'firebase/firestore'

// Singleton instances
let app: FirebaseApp | null = null
let auth: Auth | null = null
let db: Firestore | null = null

// Connection state flags
let isAuthEmulatorConnected = false
let isFirestoreEmulatorConnected = false
let isInitialized = false

/**
 * Detects if we should use Firebase emulators
 */
function shouldUseEmulator(): boolean {
  // Explicit flag from environment (used in tests)
  if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
    return true
  }
  
  // For local development (optional - can be removed if you don't want auto-detection)
  if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
    // Only auto-enable for localhost if explicitly wanted
    // Commented out by default to avoid accidents
    // return window.location.hostname === 'localhost'
  }
  
  return false
}

/**
 * Gets Firebase configuration based on environment
 */
function getFirebaseConfig() {
  const useEmulator = shouldUseEmulator()
  
  if (useEmulator) {
    // Emulator configuration - safe fake values
    return {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'fake-api-key-for-emulator',
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'localhost',
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'demo-test',
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'demo-test.appspot.com',
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '123456789',
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:123456789:web:abcdef',
    }
  }
  
  // Production configuration from environment variables
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  }
}

/**
 * Initializes Firebase App (singleton)
 */
function initializeFirebaseApp(): FirebaseApp {
  if (!app) {
    const config = getFirebaseConfig()
    
    if (!config.projectId) {
      throw new Error('Firebase configuration missing: projectId is required')
    }
    
    app = getApps().length === 0 ? initializeApp(config) : getApps()[0]
    console.log('🔥 Firebase App initialized')
  }
  
  return app
}

/**
 * Gets Firebase Auth instance with automatic emulator connection
 */
export function getFirebaseAuth(): Auth {
  if (!auth) {
    const app = initializeFirebaseApp()
    auth = getAuth(app)
    
    // Connect to emulator if needed
    if (shouldUseEmulator() && !isAuthEmulatorConnected) {
      try {
        const host = process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST || 'localhost:9099'
        const [hostname, port] = host.split(':')
        
        connectAuthEmulator(auth, `http://${hostname}:${port}`, { disableWarnings: true })
        isAuthEmulatorConnected = true
        console.log(`✅ Connected to Auth Emulator at ${hostname}:${port}`)
      } catch (error) {
        if (error instanceof Error && !error.message.includes('already been called')) {
          console.error('❌ Error connecting to Auth Emulator:', error)
          throw error
        }
        isAuthEmulatorConnected = true
      }
    }
  }
  
  return auth
}

/**
 * Gets Firestore instance with automatic emulator connection
 */
export function getFirebaseDb(): Firestore {
  if (!db) {
    const app = initializeFirebaseApp()
    db = getFirestore(app)
    
    // Connect to emulator if needed
    if (shouldUseEmulator() && !isFirestoreEmulatorConnected) {
      try {
        const host = process.env.NEXT_PUBLIC_FIREBASE_FIRESTORE_EMULATOR_HOST || 'localhost:8080'
        const [hostname, port] = host.split(':')
        
        connectFirestoreEmulator(db, hostname, parseInt(port, 10))
        isFirestoreEmulatorConnected = true
        console.log(`✅ Connected to Firestore Emulator at ${hostname}:${port}`)
      } catch (error) {
        if (error instanceof Error && !error.message.includes('already been called')) {
          console.error('❌ Error connecting to Firestore Emulator:', error)
          throw error
        }
        isFirestoreEmulatorConnected = true
      }
    }
  }
  
  return db
}

/**
 * Gets the Firebase App instance
 */
export function getFirebaseApp(): FirebaseApp {
  return initializeFirebaseApp()
}

/**
 * Checks if using emulator mode
 */
export function isUsingEmulator(): boolean {
  return shouldUseEmulator()
}

/**
 * Initializes all Firebase services at once (optional - services auto-initialize on first use)
 */
export function initializeFirebase(): void {
  if (isInitialized) return
  
  getFirebaseAuth()
  getFirebaseDb()
  isInitialized = true
  
  const mode = shouldUseEmulator() ? 'EMULATOR' : 'PRODUCTION'
  console.log(`🚀 Firebase initialized in ${mode} mode`)
}

