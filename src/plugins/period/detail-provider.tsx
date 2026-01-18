'use client'

import type { ReactNode } from 'react'
import type { PluginDetailProvider } from '@/sdk'
import { NotesField } from '@/sdk'
import type { PeriodDayData } from './types'
import { PeriodToggle } from './components/PeriodToggle'
import { DaysSinceDisplay } from './components/DaysSinceDisplay'

/**
 * Period Detail Provider
 * Renders the period section in the detail view
 */
export class PeriodDetailProviderImpl
  implements PluginDetailProvider<PeriodDayData>
{
  renderDetail(
    data: PeriodDayData | null,
    date: string,
    onUpdate: (updates: Partial<PeriodDayData>) => Promise<void>,
    context?: {
      allData?: Record<string, PeriodDayData>
    },
  ): ReactNode {
    return (
      <PeriodDetailSection
        data={data}
        date={date}
        onUpdate={onUpdate}
        allData={context?.allData || {}}
      />
    )
  }
}

interface PeriodDetailSectionProps {
  data: PeriodDayData | null
  date: string
  onUpdate: (updates: Partial<PeriodDayData>) => Promise<void>
  allData: Record<string, PeriodDayData>
}

function PeriodDetailSection({
  data,
  date,
  onUpdate,
  allData,
}: PeriodDetailSectionProps) {
  const isPeriod = data?.isPeriod ?? false

  // Toggle period status
  const handleToggle = async (newValue: boolean) => {
    await onUpdate({ isPeriod: newValue })
  }

  // Save notes
  const handleNotesSave = async (notes: string) => {
    await onUpdate({ notes })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white/90 flex items-center gap-2">
          <span>🩸</span> Period Tracker
        </h3>
        {isPeriod && (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">
            Period Day
          </span>
        )}
      </div>

      {/* Period Toggle */}
      <PeriodToggle
        isPeriod={isPeriod}
        onToggle={handleToggle}
        date={date}
        allData={allData}
      />

      {/* Days Since Display (only when not a period day) */}
      {!isPeriod && (
        <DaysSinceDisplay
          date={date}
          allData={allData}
        />
      )}

      {/* Notes */}
      <NotesField
        value={data?.notes || ''}
        onSave={handleNotesSave}
        label="Notes"
        placeholder="Add notes for this day..."
        icon="📝"
        accentColor="#F472B6"
        resetKey={date}
      />
    </div>
  )
}
