#!/usr/bin/env node

/**
 * Setup script to create Firebase test user
 * Run: node scripts/setup-test-user.mjs
 */

import { initializeApp } from 'firebase/app'
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth'

const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'test@goalchaser.test'
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'TestPassword123!'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

async function createTestUser() {
  try {
    console.log('🔧 Initializing Firebase...')
    const app = initializeApp(firebaseConfig)
    const auth = getAuth(app)

    console.log(`📧 Creating test user: ${TEST_EMAIL}`)
    await createUserWithEmailAndPassword(auth, TEST_EMAIL, TEST_PASSWORD)
    
    console.log('✅ Test user created successfully!')
    console.log('\nAdd these to your .env.test file:')
    console.log(`TEST_USER_EMAIL=${TEST_EMAIL}`)
    console.log(`TEST_USER_PASSWORD=${TEST_PASSWORD}`)
    
    process.exit(0)
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log('ℹ️  Test user already exists')
      console.log('You can use these credentials:')
      console.log(`TEST_USER_EMAIL=${TEST_EMAIL}`)
      console.log(`TEST_USER_PASSWORD=${TEST_PASSWORD}`)
      process.exit(0)
    }
    
    console.error('❌ Error creating test user:', error.message)
    process.exit(1)
  }
}

createTestUser()

