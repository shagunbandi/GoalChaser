import { getFirebaseAuth, getFirebaseDb, isUsingEmulator } from '@/lib/firebase-service'
import { collection, getDocs, query, limit } from 'firebase/firestore'
import { logger } from '@/lib/logger'

export interface FirebaseDiagnostics {
  isAuthenticated: boolean
  userId: string | null
  email: string | null
  tokenExpiration: Date | null
  tokenExpiresIn: string | null
  isTokenExpired: boolean
  firestoreAccessWorking: boolean
  usingEmulator: boolean
  error: string | null
}

export async function checkFirebaseAccess(): Promise<FirebaseDiagnostics> {
  const auth = getFirebaseAuth()
  const user = auth.currentUser
  
  const diagnostics: FirebaseDiagnostics = {
    isAuthenticated: !!user,
    userId: user?.uid || null,
    email: user?.email || null,
    tokenExpiration: null,
    tokenExpiresIn: null,
    isTokenExpired: false,
    firestoreAccessWorking: false,
    usingEmulator: isUsingEmulator(),
    error: null,
  }

  // Check if user is authenticated
  if (!user) {
    diagnostics.error = 'No user is currently authenticated'
    return diagnostics
  }

  try {
    const idTokenResult = await user.getIdTokenResult()
    const expirationTime = new Date(idTokenResult.expirationTime)
    const now = new Date()
    
    diagnostics.tokenExpiration = expirationTime
    diagnostics.isTokenExpired = now >= expirationTime
    
    const msUntilExpiration = expirationTime.getTime() - now.getTime()
    if (msUntilExpiration > 0) {
      const hours = Math.floor(msUntilExpiration / (1000 * 60 * 60))
      const minutes = Math.floor((msUntilExpiration % (1000 * 60 * 60)) / (1000 * 60))
      diagnostics.tokenExpiresIn = `${hours}h ${minutes}m`
    } else {
      diagnostics.tokenExpiresIn = 'Expired'
    }

    const db = getFirebaseDb()
    const testQuery = query(collection(db, 'users', user.uid, 'goals'), limit(1))
    await getDocs(testQuery)
    
    diagnostics.firestoreAccessWorking = true
  } catch (error) {
    diagnostics.error = error instanceof Error ? error.message : 'Unknown error'
    diagnostics.firestoreAccessWorking = false
  }

  return diagnostics
}

export async function refreshAuthToken(): Promise<boolean> {
  try {
    const auth = getFirebaseAuth()
    const user = auth.currentUser
    
    if (!user) {
      logger.error('No user authenticated')
      return false
    }

    await user.getIdToken(true)
    logger.success('Token refreshed')
    return true
  } catch (error) {
    logger.error('Token refresh failed', error)
    return false
  }
}
