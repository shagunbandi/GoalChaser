// API layer for day details operations

import type { DayDetails, PlannedItem } from '@/types'
import { getFirebaseDb, isFirebaseAvailable } from './firebase-client'

/**
 * Recursively removes undefined values from an object
 * Firebase doesn't support undefined values, so we need to clean them
 */
function removeUndefinedFields<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map(item => removeUndefinedFields(item)) as T
  }

  if (typeof obj === 'object') {
    const cleaned: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = removeUndefinedFields(value)
      }
    }
    return cleaned as T
  }

  return obj
}

export async function loadDayDetailsFromFirebase(
  userId: string,
  goalId: string,
): Promise<Record<string, DayDetails> | null> {
  console.log('📖 Loading day details from Firebase:', { userId, goalId })
  
  if (!isFirebaseAvailable()) {
    console.log('🔴 Firebase not available for loading')
    return null
  }
  
  if (!getFirebaseDb()) {
    console.log('🔴 Firebase DB instance not available')
    return null
  }

  try {
    const { collection, getDocs } = await import('firebase/firestore')
    const db = getFirebaseDb()
    if (!db) {
      console.log('🔴 DB is null after import')
      return null
    }

    const path = `users/${userId}/goals/${goalId}/days`
    console.log('📖 Firebase path:', path)
    
    const colRef = collection(db, 'users', userId, 'goals', goalId, 'days')
    const querySnapshot = await getDocs(colRef)

    console.log('📖 Firebase query completed, docs found:', querySnapshot.size)

    const result: Record<string, DayDetails> = {}
    let travelDocsCount = 0
    
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      const legacyTravel = data.travel
      const travelPlans = data.travelPlans
        ? data.travelPlans
        : legacyTravel
        ? Array.isArray(legacyTravel)
          ? legacyTravel
          : [legacyTravel]
        : []

      // Log travel data
      if (travelPlans && travelPlans.length > 0) {
        travelDocsCount++
        console.log(`🛫 Travel data found for ${doc.id}:`, {
          rawTravelPlans: data.travelPlans,
          rawLegacyTravel: data.travel,
          normalizedTravelPlans: travelPlans,
        })
      }

      result[doc.id] = {
        status: data.status || null,
        subject: data.subject || '',
        topic: data.topic || '',
        subjects: data.subjects || [],
        note: data.note || '',
        directHours: data.directHours || 0,
        plannedItems: (data.plannedItems || []).map((item: PlannedItem) => ({
          ...item,
          subjects: item.subjects || [],
          completed: item.completed || false,
        })),
        travelPlans,
      }
    })

    console.log(`✅ Firebase load complete. Total docs: ${querySnapshot.size}, Docs with travel: ${travelDocsCount}`)
    console.log('📊 All loaded data:', result)

    return result
  } catch (error) {
    console.error('🔴 Firebase read failed:', error)
    return null
  }
}

export async function saveDayDetailsToFirebase(
  userId: string,
  goalId: string,
  date: string,
  details: DayDetails,
): Promise<boolean> {
  console.log(`💾 Attempting Firebase save for ${date}`)
  console.log('💾 Firebase available:', isFirebaseAvailable())
  console.log('💾 DB instance available:', !!getFirebaseDb())
  
  if (!isFirebaseAvailable() || !getFirebaseDb()) {
    console.log('🔴 Firebase not available for saving')
    return false
  }

  try {
    const { doc, setDoc } = await import('firebase/firestore')
    const db = getFirebaseDb()
    if (!db) {
      console.log('🔴 DB is null after import')
      return false
    }

    const path = `users/${userId}/goals/${goalId}/days/${date}`
    console.log('💾 Firebase save path:', path)
    
    const docRef = doc(db, 'users', userId, 'goals', goalId, 'days', date)
    
    // Clean undefined values before saving (Firebase doesn't support undefined)
    const cleanedDetails = removeUndefinedFields({
      ...details,
      updatedAt: new Date().toISOString(),
    })
    
    // Always log for travel plans
    if (details.travelPlans && details.travelPlans.length > 0) {
      console.log(`🛫 SAVING TRAVEL to ${date}:`, {
        path,
        travelPlansCount: details.travelPlans.length,
        originalTravelPlans: JSON.stringify(details.travelPlans, null, 2),
        cleanedTravelPlans: JSON.stringify(cleanedDetails.travelPlans, null, 2),
        fullDataKeys: Object.keys(cleanedDetails),
      })
    }
    
    console.log(`💾 Calling setDoc for ${date}...`)
    await setDoc(docRef, cleanedDetails)
    console.log(`💾 setDoc completed for ${date}`)
    
    if (details.travelPlans && details.travelPlans.length > 0) {
      console.log(`✅ TRAVEL SAVE CONFIRMED for ${date}`)
      
      // Verify the save by reading it back immediately
      console.log(`🔍 Verifying save by reading back ${date}...`)
      const { getDoc } = await import('firebase/firestore')
      const verifyDoc = await getDoc(docRef)
      if (verifyDoc.exists()) {
        const verifyData = verifyDoc.data()
        console.log(`✅ Verification successful for ${date}:`, {
          travelPlans: verifyData.travelPlans,
          travelPlansCount: verifyData.travelPlans?.length || 0
        })
      } else {
        console.log(`🔴 Verification FAILED - doc doesn't exist for ${date}`)
      }
    }
    
    return true
  } catch (error) {
    console.error(`🔴 Firebase write failed for ${date}:`, error)
    console.error('🔴 Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
    return false
  }
}

