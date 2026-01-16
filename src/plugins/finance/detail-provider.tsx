'use client'

import type { ReactNode } from 'react'
import type { PluginDetailProvider } from '@/sdk'
import type { FinanceTransactionData } from './types'

export class FinanceDetailProviderImpl
  implements PluginDetailProvider<FinanceTransactionData>
{
  renderDetail(
    data: FinanceTransactionData | null,
    date: string,
    onUpdate: (updates: Partial<FinanceTransactionData>) => Promise<void>,
  ): ReactNode {
    return null
  }
}
