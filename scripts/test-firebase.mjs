// Firebase Connection Test Script
// Run with: node scripts/test-firebase.mjs

import { initializeApp } from 'firebase/app'
import { getFirestore, doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore'

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAK60ylS6WjcRlLYWTY5vKXw1sm4NRwtvI",
  authDomain: "goal-chaser-abb35.firebaseapp.com",
  projectId: "goal-chaser-abb35",
  storageBucket: "goal-chaser-abb35.firebasestorage.app",
  messagingSenderId: "1089401702860",
  appId: "1:1089401702860:web:268d2a6c8d274e6e6eb569",
}

console.log('🔥 Testing Firebase Connection...\n')
console.log('Config:', {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
})

async function testFirebase() {
  try {
    // Step 1: Initialize Firebase
    console.log('\n1️⃣ Initializing Firebase...')
    const app = initializeApp(firebaseConfig)
    console.log('   ✅ Firebase initialized')

    // Step 2: Get Firestore
    console.log('\n2️⃣ Connecting to Firestore...')
    const db = getFirestore(app)
    console.log('   ✅ Firestore instance created')

    // Step 3: Write test data
    console.log('\n3️⃣ Writing test document...')
    const testDocRef = doc(db, 'test', 'connection-test')
    await setDoc(testDocRef, {
      message: 'Hello from Goal Chaser!',
      timestamp: new Date().toISOString(),
      test: true,
    })
    console.log('   ✅ Document written successfully')

    // Step 4: Read test data
    console.log('\n4️⃣ Reading test document...')
    const docSnap = await getDoc(testDocRef)
    if (docSnap.exists()) {
      console.log('   ✅ Document read successfully')
      console.log('   📄 Data:', docSnap.data())
    } else {
      console.log('   ❌ Document not found')
    }

    // Step 5: Delete test data
    console.log('\n5️⃣ Cleaning up test document...')
    await deleteDoc(testDocRef)
    console.log('   ✅ Test document deleted')

    console.log('\n' + '='.repeat(50))
    console.log('🎉 SUCCESS! Firebase is working correctly!')
    console.log('='.repeat(50))
    console.log('\nYour app should now be able to save data to Firebase.')
    console.log('Check your Firebase Console to see the data:')
    console.log('https://console.firebase.google.com/project/goal-chaser-abb35/firestore')

  } catch (error) {
    console.log('\n' + '='.repeat(50))
    console.log('❌ ERROR: Firebase connection failed')
    console.log('='.repeat(50))
    console.log('\nError details:', error.message)
    
    if (error.code === 'permission-denied') {
      console.log('\n🔒 SOLUTION: Update Firestore Security Rules')
      console.log('   1. Go to Firebase Console → Firestore → Rules')
      console.log('   2. Set rules to test mode (allow all reads/writes)')
    } else if (error.message.includes('not found') || error.message.includes('does not exist')) {
      console.log('\n📦 SOLUTION: Create Firestore Database')
      console.log('   1. Go to Firebase Console → Firestore Database')
      console.log('   2. Click "Create database"')
      console.log('   3. Select "Test mode"')
      console.log('   4. Choose a location and click Enable')
    } else if (error.message.includes('offline') || error.message.includes('network')) {
      console.log('\n🌐 SOLUTION: Check Network')
      console.log('   - Make sure you have internet connection')
      console.log('   - Check if firewall is blocking Firebase')
    }
    
    console.log('\n📖 Full error:', error)
    process.exit(1)
  }
}

testFirebase()

