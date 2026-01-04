import type { Page } from '@playwright/test'
import { getTestFirestore } from '../helpers/firebase-setup'
import { collection, query, where, getDocs } from 'firebase/firestore'

/**
 * Finds an agenda item ID by title in Firestore
 */
export async function getAgendaIdByTitle(
  userId: string,
  goalId: string,
  date: string,
  title: string
): Promise<string | null> {
  const db = getTestFirestore()
  
  try {
    const dayDocRef = collection(db, 'users', userId, 'goals', goalId, 'days')
    const dayQuery = query(dayDocRef, where('__name__', '==', date))
    const daySnapshot = await getDocs(dayQuery)
    
    if (daySnapshot.empty) {
      return null
    }
    
    const dayData = daySnapshot.docs[0].data()
    const agendaItems = dayData.agendaItems || []
    const matchingItem = agendaItems.find((item: { title?: string; id?: string }) => item.title === title)
    
    return matchingItem?.id || null
  } catch (error) {
    console.error('Error finding agenda item by title:', error)
    return null
  }
}

/**
 * Polls Firestore until an agenda item appears
 */
export async function waitForAgendaItemInDb(
  userId: string,
  goalId: string,
  date: string,
  title: string,
  timeout = 5000
): Promise<string> {
  const startTime = Date.now()
  
  while (Date.now() - startTime < timeout) {
    const agendaId = await getAgendaIdByTitle(userId, goalId, date, title)
    
    if (agendaId) {
      return agendaId
    }
    
    await new Promise(resolve => setTimeout(resolve, 200))
  }
  
  throw new Error(`Timeout waiting for agenda item "${title}" to appear in database`)
}

/**
 * Waits for a Firestore commit operation
 */
export async function waitForFirestoreCommit(page: Page, timeout = 10000) {
  return await page.waitForResponse(
    response => 
      response.url().includes('firestore.googleapis.com') && 
      response.url().includes(':commit') &&
      response.request().method() === 'POST',
    { timeout }
  )
}

/**
 * Extracts a goal ID from a Firestore commit response
 */
export async function extractGoalIdFromFirestore(
  firestoreResponse: { request: () => { postDataJSON: () => { writes?: Array<{ update?: { name?: string } }> } } }
): Promise<string | null> {
  try {
    const requestBody = firestoreResponse.request().postDataJSON()
    
    if (!requestBody?.writes) {
      return null
    }
    
    for (const write of requestBody.writes) {
      if (write.update?.name) {
        const match = write.update.name.match(/goals\/([^/]+)/)
        if (match) {
          return match[1]
        }
      }
    }
    
    return null
  } catch (error) {
    console.error('Error extracting goal ID from Firestore response:', error)
    return null
  }
}

