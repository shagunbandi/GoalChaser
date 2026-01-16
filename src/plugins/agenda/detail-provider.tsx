'use client'

import type { ReactNode } from 'react'
import type { PluginDetailProvider } from '@/sdk'
import type { AgendaItem } from './types'
import { AgendaManager } from './components/AgendaManager'

/**
 * Agenda Detail Provider  
 * Wraps the existing AgendaManager component
 */
export class AgendaDetailProviderImpl implements PluginDetailProvider<AgendaItem[]> {
  renderDetail(
    data: AgendaItem[] | null,
    date: string,
    onUpdate: (updates: any) => Promise<void>,
    context?: {
      todayISO?: string
      dayDetails?: Record<string, any>
      availableSubjects?: string[]
      onStatus?: (status: any) => void
    }
  ): ReactNode {
    // Agenda is rendered via AgendaManager in the main DetailView
    // Kept integrated in core detail view for now
    return null
  }
}
