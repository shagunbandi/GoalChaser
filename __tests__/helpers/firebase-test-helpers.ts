import { 
  initializeApp, 
  getApps, 
  deleteApp,
  type FirebaseApp 
} from 'firebase/app'
import { 
  getAuth, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
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

export const TEST_USER_EMAIL = 'test@goalchaser.test'
export const TEST_USER_PASSWORD = 'TestPassword123!'
export const TEST_USER_NAME = 'Test User'

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

function getTestFirebase(): { auth: Auth } {
  if (!testAuth) {
    const { auth } = initializeTestFirebase()
    return { auth }
  }
  return { auth: testAuth }
}

export interface CreateTestUserOptions {
  email: string
  password: string
  displayName?: string
}

export interface CreateTestUserResult {
  uid: string
  email: string
  displayName: string | null
}

export async function createTestUser(
  options: CreateTestUserOptions
): Promise<CreateTestUserResult> {
  const { auth } = getTestFirebase()
  
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      options.email,
      options.password
    )
    
    if (options.displayName) {
      await updateProfile(userCredential.user, {
        displayName: options.displayName,
      })
    }
    
    return {
      uid: userCredential.user.uid,
      email: userCredential.user.email!,
      displayName: options.displayName || userCredential.user.displayName,
    }
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'auth/email-already-in-use') {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        options.email,
        options.password
      )
      return {
        uid: userCredential.user.uid,
        email: userCredential.user.email!,
        displayName: userCredential.user.displayName,
      }
    }
    throw error
  }
}

export async function setupTestUserWithAuth(
  options?: Partial<CreateTestUserOptions>
): Promise<{
  user: CreateTestUserResult
  credentials: { email: string; password: string }
}> {
  const email = options?.email || TEST_USER_EMAIL
  const password = options?.password || TEST_USER_PASSWORD
  const displayName = options?.displayName || TEST_USER_NAME
  
  const user = await createTestUser({
    email,
    password,
    displayName,
  })
  
  return {
    user,
    credentials: { email, password },
  }
}
