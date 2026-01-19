'use client'

import { useState, useEffect } from 'react'

interface CalendarDetailPanelProps {
  selectedDate: string
  notes: string
  onUpdateNotes: (notes: string) => Promise<void>
  pluginSummariesElement?: React.ReactNode
}

/**
 * Simplified Calendar Detail Panel
 * Core responsibility: Display and edit notes for a selected day
 * Plugins inject their summaries via the pluginSummariesElement prop
 */
export function CalendarDetailPanel({
  selectedDate,
  notes,
  onUpdateNotes,
  pluginSummariesElement,
}: CalendarDetailPanelProps) {
  const [localNotes, setLocalNotes] = useState(notes)
  const [isSaving, setIsSaving] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Update local notes when date changes or notes prop changes
  useEffect(() => {
    console.log('[calendar] Initializing notes for:', selectedDate, notes)
    setLocalNotes(notes)
    setHasUnsavedChanges(false)
  }, [selectedDate, notes])

  const handleNotesChange = (value: string) => {
    console.log('[calendar] Notes changed, length:', value.length)
    setLocalNotes(value)
    setHasUnsavedChanges(value !== notes)
  }

  const handleSave = async () => {
    if (!hasUnsavedChanges) return
    
    setIsSaving(true)
    try {
      console.log('[calendar] Saving notes:', localNotes)
      await onUpdateNotes(localNotes)
      setHasUnsavedChanges(false)
      console.log('[calendar] Notes saved successfully')
    } catch (error) {
      console.error('[calendar] Failed to save notes:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    console.log('[calendar] Changes cancelled')
    setLocalNotes(notes)
    setHasUnsavedChanges(false)
  }

  const formattedDate = new Date(selectedDate).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="p-4 sm:p-5 md:p-6 space-y-5">
      {/* Date Header */}
      <h2 className="text-lg md:text-xl font-semibold text-white/90">
        {formattedDate}
      </h2>

      {/* Notes Section - Core Calendar Feature */}
      <div className="space-y-3">
        <label className="flex items-center justify-between text-sm font-medium text-white/60">
          <span>Notes</span>
          {isSaving && (
            <span className="text-xs text-white/40">Saving...</span>
          )}
          {hasUnsavedChanges && !isSaving && (
            <span className="text-xs text-orange-400">Unsaved changes</span>
          )}
        </label>
        <textarea
          value={localNotes}
          onChange={(e) => handleNotesChange(e.target.value)}
          placeholder="Write notes for this day..."
          className="
            w-full min-h-[120px] px-4 py-3
            bg-white/5 border border-white/10
            rounded-xl text-white placeholder-white/30
            focus:outline-none focus:ring-2 focus:ring-[#007AFF]/50
            focus:border-[#007AFF]/30
            transition-all duration-200
            resize-none
          "
        />
        
        {/* Save/Cancel Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleCancel}
            disabled={!hasUnsavedChanges || isSaving}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/80 border border-white/10 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!hasUnsavedChanges || isSaving}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm bg-[#007AFF] text-white hover:bg-[#0066DD] border border-[#007AFF] transition-all duration-200 font-medium disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save Notes'}
          </button>
        </div>
      </div>

      {/* Plugin Summaries Section */}
      {pluginSummariesElement && (
        <div className="space-y-3 pt-2">
          <h3 className="text-sm font-medium text-white/60">
            Track this day
          </h3>
          {pluginSummariesElement}
        </div>
      )}
    </div>
  )
}
