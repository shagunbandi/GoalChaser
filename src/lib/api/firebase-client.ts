// Firebase client initialization and instance management

let firebaseAvailable = true
let db: ReturnType<typeof import('firebase/firestore').getFirestore> | null = null

export async function initFirebase() {
  if (!firebaseAvailable) {
    console.log('🔴 Firebase already marked as unavailable')
    return null
  }

  try {
    console.log('🔵 Initializing Firebase...')
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

    console.log('🔵 Firebase config:', {
      hasApiKey: !!firebaseConfig.apiKey,
      hasAuthDomain: !!firebaseConfig.authDomain,
      projectId: firebaseConfig.projectId,
      hasStorageBucket: !!firebaseConfig.storageBucket,
      hasMessagingSenderId: !!firebaseConfig.messagingSenderId,
      hasAppId: !!firebaseConfig.appId,
    })

    if (!firebaseConfig.projectId) {
      console.warn('🔴 Firebase config missing, using localStorage only')
      firebaseAvailable = false
      return null
    }

    const app =
      getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
    db = getFirestore(app)
    console.log('✅ Firebase initialized successfully')
    console.log('🔵 Firestore instance:', !!db)
    return db
  } catch (error) {
    console.error('🔴 Firebase initialization failed:', error)
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

