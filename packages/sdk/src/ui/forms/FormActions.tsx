'use client'

interface FormActionsProps {
  onSave: () => void
  onCancel: () => void
  saveLabel?: string
  cancelLabel?: string
  hasChanges?: boolean
  isSaving?: boolean
  disabled?: boolean
}

export function FormActions({
  onSave,
  onCancel,
  saveLabel = 'Save Changes',
  cancelLabel = 'Cancel',
  hasChanges = true,
  isSaving = false,
  disabled = false,
}: FormActionsProps) {
  if (!hasChanges && !isSaving) {
    return null
  }

  return (
    <div className="flex gap-3 pt-2">
      <button
        onClick={onSave}
        disabled={disabled || isSaving}
        className="
          flex-1 py-2.5 px-4
          bg-[#30D158] hover:bg-[#30D158]/90
          text-white font-medium rounded-xl
          transition-all duration-200
          shadow-[0_0_20px_rgba(48,209,88,0.3)]
          disabled:opacity-50 disabled:cursor-not-allowed
        "
      >
        {isSaving ? 'Saving...' : saveLabel}
      </button>
      <button
        onClick={onCancel}
        disabled={isSaving}
        className="
          px-4 py-2.5
          bg-white/[0.05] hover:bg-white/[0.1]
          text-white/60 rounded-xl
          transition-all duration-200
          disabled:opacity-50 disabled:cursor-not-allowed
        "
      >
        {cancelLabel}
      </button>
    </div>
  )
}
