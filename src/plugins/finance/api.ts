import { logger } from '@/lib/logger'
import type { FinanceTransactionData } from './types'
import { collection, doc, getDocs, setDoc, getDoc, query, where } from 'firebase/firestore'

let firebaseDb: any = null

function getFirebaseDb() {
  return firebaseDb
}

function isFirebaseAvailable(): boolean {
  return firebaseDb !== null
}

export function setFirebaseDb(db: any) {
  firebaseDb = db
}

// Helper to remove undefined fields
function removeUndefinedFields(obj: any): any {
  const cleaned: any = {}
  Object.entries(obj).forEach(([key, value]) => {
    if (value !== undefined) {
      if (Array.isArray(value)) {
        cleaned[key] = value.map(item => 
          typeof item === 'object' ? removeUndefinedFields(item) : item
        )
      } else if (value && typeof value === 'object') {
        cleaned[key] = removeUndefinedFields(value)
      } else {
        cleaned[key] = value
      }
    }
  })
  return cleaned
}

// ============ Finance Transactions ============

/**
 * Load finance transaction data for a date range
 */
export async function loadFinanceTransactions(
  userId: string,
  goalId: string,
  startDate: string,
  endDate: string
): Promise<Record<string, FinanceTransactionData>> {
  if (!isFirebaseAvailable() || !getFirebaseDb()) {
    return {}
  }

  try {
    const db = getFirebaseDb()
    if (!db) return {}

    const transactionsRef = collection(db, 'users', userId, 'goals', goalId, 'addons', 'finance', 'transactions')
    const q = query(
      transactionsRef,
      where('__name__', '>=', startDate),
      where('__name__', '<=', endDate)
    )
    
    const snapshot = await getDocs(q)
    
    const result: Record<string, FinanceTransactionData> = {}
    snapshot.forEach((docSnap) => {
      const data = docSnap.data()
      result[docSnap.id] = {
        expenses: data.expenses || [],
        income: data.income || [],
        investments: data.investments || []
      }
    })

    return result
  } catch (error) {
    logger.error('Failed to load finance transactions', error)
    return {}
  }
}

/**
 * Save finance transaction data for a specific day
 */
export async function saveFinanceTransaction(
  userId: string,
  goalId: string,
  date: string,
  data: Partial<FinanceTransactionData>
): Promise<boolean> {
  logger.progress('Saving transaction...')

  if (!isFirebaseAvailable() || !getFirebaseDb()) {
    logger.error('Save failed')
    return false
  }

  try {
    const db = getFirebaseDb()
    if (!db) {
      logger.error('Save failed')
      return false
    }

    const docRef = doc(db, 'users', userId, 'goals', goalId, 'addons', 'finance', 'transactions', date)
    
    // Get existing data
    const docSnap = await getDoc(docRef)
    let existingData: FinanceTransactionData = { expenses: [], income: [], investments: [] }
    
    if (docSnap.exists()) {
      existingData = docSnap.data() as FinanceTransactionData
    }

    const updatedData: FinanceTransactionData = {
      expenses: data.expenses !== undefined ? data.expenses : existingData.expenses,
      income: data.income !== undefined ? data.income : existingData.income,
      investments: data.investments !== undefined ? data.investments : existingData.investments,
      notes: data.notes !== undefined ? data.notes : existingData.notes,
    }

    // Clean undefined fields before saving
    const cleanedData = removeUndefinedFields({
      ...updatedData,
      updatedAt: new Date().toISOString()
    })

    await setDoc(docRef, cleanedData)

    logger.success('Transaction saved')
    return true
  } catch (error) {
    logger.error('Save failed', error)
    return false
  }
}
