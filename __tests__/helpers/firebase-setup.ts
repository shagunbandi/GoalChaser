import { 
  initializeApp, 
  getApps, 
  deleteApp,
  type FirebaseApp 
} from 'firebase/app'
import { 
  getAuth, 
  type Auth,
  connectAuthEmulator
} from 'firebase/auth'
import {
  getFirestore,
  connectFirestoreEmulator,
  type Firestore
} from 'firebase/firestore'

const AUTH_EMULATOR_URL = 'http://127.0.0.1:9099'
const FIRESTORE_EMULATOR_HOST = '127.0.0.1'
const FIRESTORE_EMULATOR_PORT = 8080

const TEST_FIREBASE_CONFIG = {
  apiKey: 'demo-api-key',
  authDomain: 'demo-test.firebaseapp.com',
  projectId: 'demo-test',
  storageBucket: 'demo-test.appspot.com',
  messagingSenderId: '123456789',
  appId: 'demo-app-id',
}

let testApp: FirebaseApp | null = null
let testAuth: Auth | null = null
let testFirestore: Firestore | null = null
let firestoreConnected = false

function ensureTestAppInitialized(): FirebaseApp {
  if (!testApp) {
    // Clean up any existing test apps
    const existingApps = getApps()
    existingApps.forEach(app => {
      if (app.name === 'test-app') {
        deleteApp(app)
      }
    })

    testApp = initializeApp(TEST_FIREBASE_CONFIG, 'test-app')
  }
  return testApp
}

export function getTestFirebase(): { auth: Auth } {
  const app = ensureTestAppInitialized()
  
  if (!testAuth) {
    testAuth = getAuth(app)
    try {
      connectAuthEmulator(testAuth, AUTH_EMULATOR_URL, { disableWarnings: true })
    } catch (e) {
      // Already connected, ignore
    }
  }
  
  return { auth: testAuth }
}

export function getTestFirestore(): Firestore {
  const app = ensureTestAppInitialized()
  
  if (!testFirestore) {
    testFirestore = getFirestore(app)
  }
  
  if (!firestoreConnected) {
    try {
      connectFirestoreEmulator(testFirestore, FIRESTORE_EMULATOR_HOST, FIRESTORE_EMULATOR_PORT)
      firestoreConnected = true
    } catch (e) {
      // Already connected, ignore
    }
  }
  
  return testFirestore
}
