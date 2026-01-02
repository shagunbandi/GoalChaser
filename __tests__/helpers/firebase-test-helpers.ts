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

const AUTH_EMULATOR_URL = 'http://127.0.0.1:9099'

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

function initializeTestFirebase(): { app: FirebaseApp; auth: Auth } {
  const existingApps = getApps()
  if (existingApps.length > 0) {
    existingApps.forEach(app => {
      if (app.name === 'test-app') {
        deleteApp(app)
      }
    })
  }

  testApp = initializeApp(TEST_FIREBASE_CONFIG, 'test-app')
  testAuth = getAuth(testApp)

  connectAuthEmulator(testAuth, AUTH_EMULATOR_URL, { disableWarnings: true })

  return { app: testApp, auth: testAuth }
}

export function getTestFirebase(): { auth: Auth } {
  if (!testAuth) {
    const { auth } = initializeTestFirebase()
    return { auth }
  }
  return { auth: testAuth }
}
