import { logger } from '@/lib/logger'
import type { BudgetPlan, SIPPlan, Expense, Income } from '@/types'

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

// ============ Budget Plans ============

export async function loadBudgetsFromFirebase(
  userId: string,
  goalId: string,
): Promise<BudgetPlan[]> {
  if (!isFirebaseAvailable() || !getFirebaseDb()) {
    return []
  }

  try {
    const { collection, getDocs } = await import('firebase/firestore')
    const db = getFirebaseDb()
    if (!db) return []

    const budgetsRef = collection(db, 'users', userId, 'goals', goalId, 'budgets')
    const snapshot = await getDocs(budgetsRef)
    
    const budgets: BudgetPlan[] = []
    snapshot.forEach((doc) => {
      budgets.push({ id: doc.id, ...doc.data() } as BudgetPlan)
    })
    
    return budgets
  } catch (error) {
    logger.error('Failed to load budgets', error)
    return []
  }
}

export async function saveBudgetToFirebase(
  userId: string,
  goalId: string,
  budget: BudgetPlan,
): Promise<boolean> {
  logger.progress('Saving budget...')
  
  if (!isFirebaseAvailable() || !getFirebaseDb()) {
    logger.error('Save failed')
    return false
  }

  try {
    const { doc, setDoc } = await import('firebase/firestore')
    const db = getFirebaseDb()
    if (!db) {
      logger.error('Save failed')
      return false
    }
    
    const budgetRef = doc(db, 'users', userId, 'goals', goalId, 'budgets', budget.id)
    
    const cleanedBudget = removeUndefinedFields({
      ...budget,
      updatedAt: new Date().toISOString(),
    })
    
    await setDoc(budgetRef, cleanedBudget)
    logger.success('Budget saved')
    return true
  } catch (error) {
    logger.error('Save failed', error)
    return false
  }
}

export async function deleteBudgetFromFirebase(
  userId: string,
  goalId: string,
  budgetId: string,
): Promise<boolean> {
  logger.progress('Removing budget...')
  
  if (!isFirebaseAvailable() || !getFirebaseDb()) {
    logger.error('Remove failed')
    return false
  }

  try {
    const { doc, deleteDoc } = await import('firebase/firestore')
    const db = getFirebaseDb()
    if (!db) {
      logger.error('Remove failed')
      return false
    }
    
    const budgetRef = doc(db, 'users', userId, 'goals', goalId, 'budgets', budgetId)
    await deleteDoc(budgetRef)
    logger.success('Budget removed')
    return true
  } catch (error) {
    logger.error('Remove failed', error)
    return false
  }
}

// ============ SIP Plans ============

export async function loadSIPsFromFirebase(
  userId: string,
  goalId: string,
): Promise<SIPPlan[]> {
  if (!isFirebaseAvailable() || !getFirebaseDb()) {
    return []
  }

  try {
    const { collection, getDocs } = await import('firebase/firestore')
    const db = getFirebaseDb()
    if (!db) return []

    const sipsRef = collection(db, 'users', userId, 'goals', goalId, 'sips')
    const snapshot = await getDocs(sipsRef)
    
    const sips: SIPPlan[] = []
    snapshot.forEach((doc) => {
      sips.push({ id: doc.id, ...doc.data() } as SIPPlan)
    })
    
    return sips
  } catch (error) {
    logger.error('Failed to load SIPs', error)
    return []
  }
}

export async function saveSIPToFirebase(
  userId: string,
  goalId: string,
  sip: SIPPlan,
): Promise<boolean> {
  logger.progress('Saving SIP...')
  
  if (!isFirebaseAvailable() || !getFirebaseDb()) {
    logger.error('Save failed')
    return false
  }

  try {
    const { doc, setDoc } = await import('firebase/firestore')
    const db = getFirebaseDb()
    if (!db) {
      logger.error('Save failed')
      return false
    }
    
    const sipRef = doc(db, 'users', userId, 'goals', goalId, 'sips', sip.id)
    
    const cleanedSIP = removeUndefinedFields({
      ...sip,
      updatedAt: new Date().toISOString(),
    })
    
    await setDoc(sipRef, cleanedSIP)
    logger.success('SIP saved')
    return true
  } catch (error) {
    logger.error('Save failed', error)
    return false
  }
}

export async function deleteSIPFromFirebase(
  userId: string,
  goalId: string,
  sipId: string,
): Promise<boolean> {
  logger.progress('Removing SIP...')
  
  if (!isFirebaseAvailable() || !getFirebaseDb()) {
    logger.error('Remove failed')
    return false
  }

  try {
    const { doc, deleteDoc } = await import('firebase/firestore')
    const db = getFirebaseDb()
    if (!db) {
      logger.error('Remove failed')
      return false
    }
    
    const sipRef = doc(db, 'users', userId, 'goals', goalId, 'sips', sipId)
    await deleteDoc(sipRef)
    logger.success('SIP removed')
    return true
  } catch (error) {
    logger.error('Remove failed', error)
    return false
  }
}
