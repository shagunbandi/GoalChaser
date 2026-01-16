// Finance Plugin Data Provider - simplified, full implementation would mirror budget-api.ts
import type { PluginDataProvider, PluginContext } from '@/sdk'
import type { FinanceTransactionData, BudgetPlan, SIPPlan } from './types'

export class FinanceDataProvider implements PluginDataProvider<FinanceTransactionData> {
  async loadDayData(context: PluginContext, date: string): Promise<FinanceTransactionData | null> {
    try {
      const docRef = context.firestore.doc(`transactions/${date}`)
      const docSnap = await context.firestore.getDoc(docRef)
      if (docSnap.exists()) {
        const data = docSnap.data()
        return { expenses: data.expenses || [], income: data.income || [] }
      }
      return null
    } catch (error) {
      context.logger.error('Failed to load day data', error)
      return null
    }
  }

  async loadDateRange(context: PluginContext, startDate: string, endDate: string): Promise<Record<string, FinanceTransactionData>> {
    try {
      const transactionsRef = context.firestore.collection('transactions')
      const q = context.firestore.query(transactionsRef, context.firestore.where('__name__', '>=', startDate), context.firestore.where('__name__', '<=', endDate))
      const snapshot = await context.firestore.getDocs(q)
      const result: Record<string, FinanceTransactionData> = {}
      snapshot.forEach((docSnap: any) => {
        const data = docSnap.data()
        result[docSnap.id] = { expenses: data.expenses || [], income: data.income || [] }
      })
      return result
    } catch (error) {
      context.logger.error('Failed to load date range', error)
      return {}
    }
  }

  async saveDayData(context: PluginContext, date: string, data: Partial<FinanceTransactionData>): Promise<boolean> {
    context.logger.progress('Saving transaction...')
    try {
      const docRef = context.firestore.doc(`transactions/${date}`)
      const docSnap = await context.firestore.getDoc(docRef)
      let existingData: FinanceTransactionData = { expenses: [], income: [] }
      if (docSnap.exists()) existingData = docSnap.data() as FinanceTransactionData
      const updatedData: FinanceTransactionData = {
        expenses: data.expenses !== undefined ? data.expenses : existingData.expenses,
        income: data.income !== undefined ? data.income : existingData.income,
      }
      await context.firestore.setDoc(docRef, { ...updatedData, updatedAt: new Date().toISOString() })
      context.logger.success('Transaction saved')
      return true
    } catch (error) {
      context.logger.error('Save failed', error)
      return false
    }
  }
}
