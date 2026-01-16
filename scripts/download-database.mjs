#!/usr/bin/env node

/**
 * Download Entire Firestore Database
 * 
 * This script recursively exports all collections and subcollections from Firestore
 * to a JSON file. It supports both production Firebase and emulators.
 * 
 * Usage:
 *   # Download from production (requires .env with Firebase config)
 *   node scripts/download-database.mjs
 * 
 *   # Download from emulator
 *   NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true node scripts/download-database.mjs
 * 
 *   # Specify output file
 *   node scripts/download-database.mjs --output=backup-2026.json
 */

import { initializeApp, getApps } from 'firebase/app'
import { getFirestore, connectFirestoreEmulator, collection, getDocs, getDoc, doc } from 'firebase/firestore'
import { writeFileSync, existsSync } from 'fs'
import { resolve } from 'path'
import dotenv from 'dotenv'

// Load environment variables - try .env.local first, then .env
if (existsSync('.env.local')) {
  dotenv.config({ path: '.env.local' })
} else {
  dotenv.config()
}

// Parse command-line arguments
const args = process.argv.slice(2)
const outputArg = args.find(arg => arg.startsWith('--output='))
const outputFile = outputArg ? outputArg.split('=')[1] : `database-backup-${new Date().toISOString().split('T')[0]}.json`

// Check if we should use emulator
const useEmulator = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true'

console.log(`\n🔥 Firebase Database Download Script`)
console.log(`📍 Mode: ${useEmulator ? 'EMULATOR' : 'PRODUCTION'}`)
console.log(`📄 Output: ${outputFile}\n`)

// Firebase configuration
function getFirebaseConfig() {
  if (useEmulator) {
    return {
      apiKey: 'fake-api-key-for-emulator',
      authDomain: 'localhost',
      projectId: 'demo-test',
      storageBucket: 'demo-test.appspot.com',
      messagingSenderId: '123456789',
      appId: '1:123456789:web:abcdef',
    }
  }

  // Production configuration
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  }
}

// Initialize Firebase
const config = getFirebaseConfig()
if (!config.projectId) {
  console.error('❌ Error: Firebase configuration missing. Set NEXT_PUBLIC_FIREBASE_* environment variables.')
  process.exit(1)
}

const app = getApps().length === 0 ? initializeApp(config) : getApps()[0]
const db = getFirestore(app)

// Connect to emulator if needed
if (useEmulator) {
  try {
    const host = process.env.NEXT_PUBLIC_FIREBASE_FIRESTORE_EMULATOR_HOST || 'localhost:8080'
    const [hostname, port] = host.split(':')
    connectFirestoreEmulator(db, hostname, parseInt(port, 10))
    console.log(`✅ Connected to Firestore Emulator at ${hostname}:${port}\n`)
  } catch (error) {
    if (!error.message.includes('already been called')) {
      console.error('❌ Error connecting to Firestore Emulator:', error)
      process.exit(1)
    }
  }
}

// Statistics
const stats = {
  collections: 0,
  documents: 0,
  subcollections: 0,
}

/**
 * Recursively export a collection and all its subcollections
 */
async function exportCollection(collectionRef, path = []) {
  const collectionName = collectionRef.id || collectionRef.path.split('/').pop()
  const currentPath = [...path, collectionName]
  
  console.log(`📂 Reading: ${currentPath.join('/')}`)
  stats.collections++

  const snapshot = await getDocs(collectionRef)
  const documents = {}

  for (const docSnap of snapshot.docs) {
    stats.documents++
    const docData = docSnap.data()
    const docId = docSnap.id

    // Store document data
    documents[docId] = {
      _data: docData,
      _subcollections: {},
    }

    // Check for known subcollections based on the path
    const subcollectionsToCheck = getKnownSubcollections(currentPath, docId)

    // Export each subcollection
    for (const subCollectionName of subcollectionsToCheck) {
      try {
        const subCollectionRef = collection(db, ...currentPath, docId, subCollectionName)
        const subSnapshot = await getDocs(subCollectionRef)
        
        if (!subSnapshot.empty) {
          stats.subcollections++
          documents[docId]._subcollections[subCollectionName] = await exportCollection(
            subCollectionRef,
            [...currentPath, docId]
          )
        }
      } catch (error) {
        // Subcollection doesn't exist or can't be read, skip it
      }
    }
  }

  return documents
}

/**
 * Get known subcollections based on the current path
 * This helps us discover nested collections
 */
function getKnownSubcollections(path, docId) {
  const pathStr = path.join('/')

  // Root level: users collection
  if (pathStr === 'users') {
    return ['goals', 'settings']
  }

  // User's goals
  if (pathStr === 'users/goals') {
    return ['days', 'config', 'subjectConfigs', 'travelPlans', 'budgetPlans', 'sipPlans']
  }

  // Goal's config
  if (pathStr.match(/^users\/goals\/config$/)) {
    return ['addons']
  }

  // User's settings
  if (pathStr === 'users/settings') {
    return ['suggestions']
  }

  // No known subcollections
  return []
}

/**
 * Export all root collections
 */
async function exportDatabase() {
  console.log('🚀 Starting database export...\n')

  const database = {}

  // Known root collections
  const rootCollections = ['users']

  for (const collectionName of rootCollections) {
    try {
      const collectionRef = collection(db, collectionName)
      database[collectionName] = await exportCollection(collectionRef)
    } catch (error) {
      console.error(`❌ Error exporting collection "${collectionName}":`, error.message)
    }
  }

  return database
}

/**
 * Main execution
 */
async function main() {
  try {
    const startTime = Date.now()

    // Export the database
    const database = await exportDatabase()

    // Add metadata
    const output = {
      _metadata: {
        exportedAt: new Date().toISOString(),
        mode: useEmulator ? 'emulator' : 'production',
        projectId: config.projectId,
        stats: {
          collections: stats.collections,
          documents: stats.documents,
          subcollections: stats.subcollections,
        },
      },
      data: database,
    }

    // Write to file
    const outputPath = resolve(process.cwd(), outputFile)
    writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8')

    const duration = ((Date.now() - startTime) / 1000).toFixed(2)

    console.log('\n✅ Export completed successfully!')
    console.log(`\n📊 Statistics:`)
    console.log(`   Collections: ${stats.collections}`)
    console.log(`   Documents: ${stats.documents}`)
    console.log(`   Subcollections: ${stats.subcollections}`)
    console.log(`   Duration: ${duration}s`)
    console.log(`\n📁 Saved to: ${outputPath}`)
    console.log(`   Size: ${(JSON.stringify(output).length / 1024 / 1024).toFixed(2)} MB\n`)

  } catch (error) {
    console.error('\n❌ Export failed:', error)
    process.exit(1)
  }
}

// Run the script
main()
