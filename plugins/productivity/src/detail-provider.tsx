'use client'

import type { ReactNode } from 'react'
import type { PluginDetailProvider } from '@goal-chaser/sdk'
import { NotesField } from '@goal-chaser/sdk'
import type { ProductivityDayData } from './types'
import { StatusSelector } from './components/StatusSelector'
import { AreaEntries } from './components/AreaEntries'

/**
 * Productivity Detail Provider
 * Renders the productivity section in the detail view
 */
export class ProductivityDetailProviderImpl
  implements PluginDetailProvider<ProductivityDayData>
{
  renderDetail(
    data: ProductivityDayData | null,
    date: string,
    onUpdate: (updates: Partial<ProductivityDayData>) => Promise<void>,
    context?: {
      areaConfigs?: any[]
      onAddArea?: (name: string) => void
      onAddTopic?: (areaId: string, topic: string) => void
      isTopicInUse?: (areaId: string, topic: string) => boolean
    },
  ): ReactNode {
    return (
      <ProductivityDetailSection
        data={data}
        date={date}
        onUpdate={onUpdate}
        areaConfigs={context?.areaConfigs || []}
        onAddArea={context?.onAddArea || (() => {})}
        onAddTopic={context?.onAddTopic || (() => {})}
        isTopicInUse={context?.isTopicInUse || (() => false)}
      />
    )
  }
}

interface ProductivityDetailSectionProps {
  data: ProductivityDayData | null
  date: string
  onUpdate: (updates: Partial<ProductivityDayData>) => Promise<void>
  areaConfigs: any[]
  onAddArea: (name: string) => void
  onAddTopic: (areaId: string, topic: string) => void
  isTopicInUse: (areaId: string, topic: string) => boolean
}

function ProductivityDetailSection({
  data,
  date,
  onUpdate,
  areaConfigs,
  onAddArea,
  onAddTopic,
  isTopicInUse,
}: ProductivityDetailSectionProps) {
  // Auto-save handler for status changes
  const handleStatusChange = async (status: number | null) => {
    await onUpdate({ status })
  }

  // Auto-save handler for areas changes
  const handleAreasChange = async (areas: any[]) => {
    await onUpdate({ areas })
  }

  // Save handler for notes (only saves when user clicks save)
  const handleNotesSave = async (notes: string) => {
    await onUpdate({ notes })
  }

  const availableAreas = areaConfigs.map((a) => a.name)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-white/90 flex items-center gap-2">
          <span>📊</span> Productivity
        </h3>
      </div>

      {/* Status Selector - Auto-saves on change */}
      <StatusSelector
        value={data?.status ?? null}
        onChange={handleStatusChange}
      />

      {/* Areas - Auto-saves on change */}
      <AreaEntries
        currentAreas={data?.areas || []}
        areaConfigs={areaConfigs}
        availableAreas={availableAreas}
        selectedDate={date}
        onUpdateAreas={handleAreasChange}
        onAddArea={onAddArea}
        onAddTopic={onAddTopic}
        isTopicInUse={isTopicInUse}
      />

      {/* Notes - Has its own save/cancel buttons */}
      <NotesField
        value={data?.notes || ''}
        onSave={handleNotesSave}
        label="Productivity Notes"
        placeholder="Notes about your productivity today..."
        icon="📝"
        accentColor="#FF9500"
        resetKey={date}
      />
    </div>
  )
}
