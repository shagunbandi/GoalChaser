'use client'

import { useState, useEffect } from 'react'

export interface NotesFieldProps {
  /** Current notes value from the data source */
  value: string
  /** Callback when notes should be saved */
  onSave: (notes: string) => void | Promise<void>
  /** Label text (default: "Notes") */
  label?: string
  /** Placeholder text */
  placeholder?: string
  /** Number of rows for the textarea (default: 3) */
  rows?: number
  /** Icon to show next to label */
  icon?: string
  /** Accent color for focus state */
  accentColor?: string
  /** Show the unsaved indicator (default: true) */
  showUnsavedIndicator?: boolean
  /** Show save/cancel buttons (default: true) */
  showButtons?: boolean
  /** Custom class name for the container */
  className?: string
  /** Unique key to reset state when switching contexts (e.g., date) */
  resetKey?: string
}

export function NotesField({
  value,
  onSave,
  label = 'Notes',
  placeholder = 'Write notes...',
  rows = 3,
  icon = '📝',
  accentColor = '#FF9500',
  showUnsavedIndicator = true,
  showButtons = true,
  className = '',
  resetKey,
}: NotesFieldProps) {
  const [localNotes, setLocalNotes] = useState(value)
  const [isSaving, setIsSaving] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Reset local state when value or resetKey changes
  useEffect(() => {
    setLocalNotes(value)
    setHasUnsavedChanges(false)
  }, [value, resetKey])

  const handleChange = (newValue: string) => {
    setLocalNotes(newValue)
    setHasUnsavedChanges(newValue !== value)
  }

  const handleSave = async () => {
    if (!hasUnsavedChanges) return

    setIsSaving(true)
    try {
      await onSave(localNotes)
      setHasUnsavedChanges(false)
    } catch (error) {
      console.error('[NotesField] Failed to save:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setLocalNotes(value)
    setHasUnsavedChanges(false)
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Label with status */}
      <label className="flex items-center justify-between text-sm font-medium text-white/60">
        <span className="flex items-center gap-1.5">
          {icon && <span>{icon}</span>}
          {label}
        </span>
        {showUnsavedIndicator && (
          <span className="text-xs">
            {isSaving && <span className="text-white/40">Saving...</span>}
            {hasUnsavedChanges && !isSaving && (
              <span className="text-orange-400">Unsaved changes</span>
            )}
          </span>
        )}
      </label>

      {/* Textarea */}
      <textarea
        value={localNotes}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="
          w-full px-4 py-3
          bg-white/[0.03] backdrop-blur-xl
          border border-white/[0.08] rounded-2xl
          text-white placeholder-white/30
          focus:outline-none
          transition-all duration-200 resize-none
        "
        style={{
          borderColor: hasUnsavedChanges ? `${accentColor}40` : undefined,
          boxShadow: hasUnsavedChanges
            ? `0 0 0 3px ${accentColor}15`
            : undefined,
        }}
      />

      {/* Save/Cancel Buttons */}
      {showButtons && (
        <div className="flex gap-3">
          <button
            onClick={handleCancel}
            disabled={!hasUnsavedChanges || isSaving}
            className="
              flex-1 px-4 py-2.5 rounded-xl text-sm
              bg-white/[0.05] text-white/60
              hover:bg-white/[0.08] hover:text-white/80
              border border-white/10
              transition-all duration-200
              disabled:opacity-40 disabled:cursor-not-allowed
            "
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!hasUnsavedChanges || isSaving}
            className="
              flex-1 px-4 py-2.5 rounded-xl text-sm font-medium
              text-white
              transition-all duration-200
              disabled:opacity-40 disabled:cursor-not-allowed
            "
            style={{
              backgroundColor: accentColor,
              borderColor: accentColor,
              borderWidth: '1px',
              borderStyle: 'solid',
            }}
          >
            {isSaving ? 'Saving...' : 'Save Notes'}
          </button>
        </div>
      )}
    </div>
  )
}
