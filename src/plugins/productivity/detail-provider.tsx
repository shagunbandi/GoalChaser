'use client'

import type { ReactNode } from 'react'
import { useState, useEffect } from 'react'
import type { PluginDetailProvider } from '@/sdk'
import type { ProductivityDayData } from './types'
import { StatusSelector } from './components/StatusSelector'
import { AreaEntries } from './components/AreaEntries'

/**
 * Productivity Detail Provider
 * Renders the productivity section in the detail view
 */
export class ProductivityDetailProviderImpl implements PluginDetailProvider<ProductivityDayData> {
  renderDetail(
    data: ProductivityDayData | null,
    date: string,
    onUpdate: (updates: Partial<ProductivityDayData>) => Promise<void>,
    context?: {
      areaConfigs?: any[]
      onAddArea?: (name: string) => void
      onAddTopic?: (areaId: string, topic: string) => void
      isTopicInUse?: (areaId: string, topic: string) => boolean
    }
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
  // Draft state for all fields
  const [draftData, setDraftData] = useState<Partial<ProductivityDayData>>({
    status: data?.status || null,
    areas: data?.areas || [],
    notes: data?.notes || '',
  })
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Initialize draft data when data changes (e.g., switching days)
  useEffect(() => {
    setDraftData({
      status: data?.status || null,
      areas: data?.areas || [],
      notes: data?.notes || '',
    })
    setHasUnsavedChanges(false)
  }, [date, data])

  const handleSave = async () => {
    await onUpdate(draftData)
    setHasUnsavedChanges(false)
  }

  const handleCancel = () => {
    setDraftData({
      status: data?.status || null,
      areas: data?.areas || [],
      notes: data?.notes || '',
    })
    setHasUnsavedChanges(false)
  }

  const handleStatusChange = (status: number | null) => {
    setDraftData((prev) => ({ ...prev, status }))
    setHasUnsavedChanges(true)
  }

  const handleAreasChange = (areas: any[]) => {
    setDraftData((prev) => ({ ...prev, areas }))
    setHasUnsavedChanges(true)
  }

  const handleNotesChange = (notes: string) => {
    setDraftData((prev) => ({ ...prev, notes }))
    setHasUnsavedChanges(true)
  }

  const availableAreas = areaConfigs.map((a) => a.name)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white/90 flex items-center gap-2">
          <span>📊</span> Productivity
        </h3>
      </div>

      {/* Status Selector */}
      <StatusSelector value={draftData.status || null} onChange={handleStatusChange} />

      {/* Areas */}
      <AreaEntries
        currentAreas={draftData.areas || []}
        areaConfigs={areaConfigs}
        availableAreas={availableAreas}
        selectedDate={date}
        onUpdateAreas={handleAreasChange}
        onAddArea={onAddArea}
        onAddTopic={onAddTopic}
        isTopicInUse={isTopicInUse}
      />

      {/* Notes */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-white/60">
          📝 Productivity Notes
        </label>
        <textarea
          value={draftData.notes || ''}
          onChange={(e) => handleNotesChange(e.target.value)}
          placeholder="Notes about your productivity today..."
          rows={3}
          className="
            w-full px-4 py-3
            bg-white/[0.03] backdrop-blur-xl
            border border-white/[0.08] rounded-2xl
            text-white placeholder-white/30
            focus:outline-none focus:border-[#FF9500]/50
            focus:shadow-[0_0_0_3px_rgba(255,149,0,0.1)]
            transition-all duration-200 resize-none
          "
        />
      </div>

      {/* Save/Cancel Buttons */}
      {hasUnsavedChanges && (
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleSave}
            className="
              flex-1 py-2.5 px-4
              bg-[#30D158] hover:bg-[#30D158]/90
              text-white font-medium rounded-xl
              transition-all duration-200
              shadow-[0_0_20px_rgba(48,209,88,0.3)]
            "
          >
            Save Changes
          </button>
          <button
            onClick={handleCancel}
            className="
              px-4 py-2.5
              bg-white/[0.05] hover:bg-white/[0.1]
              text-white/60 rounded-xl
              transition-all duration-200
            "
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}
