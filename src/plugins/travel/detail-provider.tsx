'use client'

import type { ReactNode } from 'react'
import type { PluginDetailProvider } from '@/sdk'
import type { TravelPlan } from './types'

export class TravelDetailProviderImpl implements PluginDetailProvider<TravelPlan[]> {
  renderDetail(
    data: TravelPlan[] | null,
    date: string,
    onUpdate: (updates: any) => Promise<void>
  ): ReactNode {
    return null
  }
}
