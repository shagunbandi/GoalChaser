import { 
  getAuth, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  type Auth
} from 'firebase/auth'
import { getTestFirebase } from '../helpers/firebase-test-helpers'

export interface SeedUserOptions {
  email?: string
  password?: string
  displayName?: string
}

export interface SeedUserResult {
  user: {
    uid: string
    email: string
    displayName: string | null
  }
  credentials: {
    email: string
    password: string
  }
}

const DEFAULT_TEST_USER = {
  email: 'test@goalchaser.test',
  password: 'TestPassword123!',
  displayName: 'Test User'
}

/**
 * Seeds a user directly in the Firebase Auth database.
 * This bypasses the UI and creates the user via Firebase SDK.
 */
export async function seedUser(
  options?: SeedUserOptions
): Promise<SeedUserResult> {
  const email = options?.email || DEFAULT_TEST_USER.email
  const password = options?.password || DEFAULT_TEST_USER.password
  const displayName = options?.displayName || DEFAULT_TEST_USER.displayName

  const { auth } = getTestFirebase()
  
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    )
    
    if (displayName) {
      await updateProfile(userCredential.user, {
        displayName,
      })
    }
    
    return {
      user: {
        uid: userCredential.user.uid,
        email: userCredential.user.email!,
        displayName: displayName || userCredential.user.displayName,
      },
      credentials: {
        email,
        password,
      }
    }
  } catch (error) {
    // If user already exists, sign in and return their info
    if (error && typeof error === 'object' && 'code' in error && error.code === 'auth/email-already-in-use') {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      )
      return {
        user: {
          uid: userCredential.user.uid,
          email: userCredential.user.email!,
          displayName: userCredential.user.displayName,
        },
        credentials: {
          email,
          password,
        }
      }
    }
    throw error
  }
}

