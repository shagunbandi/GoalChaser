'use client'

import type { ReactNode } from 'react'
import type { PluginDetailProvider } from '@/sdk'
import type { HoursDayData } from './types'

export class HoursDetailProviderImpl implements PluginDetailProvider<HoursDayData> {
  renderDetail(
    data: HoursDayData | null,
    date: string,
    onUpdate: (updates: Partial<HoursDayData>) => Promise<void>
  ): ReactNode {
    return null
  }
}
