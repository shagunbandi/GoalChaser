import { useState, useEffect } from 'react'
import type { ExecutiveGoalPlan } from '@/plugins/executive-goal/types'

interface ExecutiveGoalFormProps {
  initialData?: Partial<ExecutiveGoalPlan>
  onSubmit: (data: {
    title: string
    description: string
    startDate: string
    endDate: string
    color: string
    note: string
    parentExecutiveGoalId?: string
  }) => void | Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
  availableExecutiveGoals?: ExecutiveGoalPlan[]
  hideParentGoalSelector?: boolean
  hideNotesField?: boolean
  hideDateFields?: boolean
  singleDayDate?: string
  isTask?: boolean
}

// Helper function to get today's date in YYYY-MM-DD format
function getTodayDate(): string {
  const today = new Date()
  return today.toISOString().split('T')[0]
}

// Helper function to get date 1 week from today in YYYY-MM-DD format
function getOneWeekLater(): string {
  const today = new Date()
  const oneWeekLater = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
  return oneWeekLater.toISOString().split('T')[0]
}

export function ExecutiveGoalForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
  availableExecutiveGoals = [],
  hideParentGoalSelector = false,
  hideNotesField = false,
  hideDateFields = false,
  singleDayDate,
  isTask = false,
}: ExecutiveGoalFormProps) {
  const [title, setTitle] = useState(initialData?.title || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [startDate, setStartDate] = useState(
    initialData?.startDate || getTodayDate(),
  )
  const [endDate, setEndDate] = useState(
    initialData?.endDate || getOneWeekLater(),
  )
  const [color, setColor] = useState(initialData?.color || '#8B5CF6')
  const [note, setNote] = useState(initialData?.note || '')
  const [parentExecutiveGoalId, setParentExecutiveGoalId] = useState(initialData?.parentExecutiveGoalId || '')
  const [error, setError] = useState<string | null>(null)

  // Update form when initialData changes
  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '')
      setDescription(initialData.description || '')
      setStartDate(initialData.startDate || getTodayDate())
      setEndDate(initialData.endDate || getOneWeekLater())
      setColor(initialData.color || '#8B5CF6')
      setNote(initialData.note || '')
      setParentExecutiveGoalId(initialData.parentExecutiveGoalId || '')
    }
  }, [initialData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim() || !startDate || !endDate) {
      setError('Title and dates are required')
      return
    }

    // For single-day tasks, use the provided date for both start and end
    const finalStartDate = hideDateFields && singleDayDate ? singleDayDate : startDate
    const finalEndDate = hideDateFields && singleDayDate ? singleDayDate : endDate

    if (!hideDateFields && startDate > endDate) {
      setError('End date must be after start date')
      return
    }

    // Validate parent executive goal dates if a parent is selected (skip for hidden date fields)
    if (parentExecutiveGoalId && !hideDateFields) {
      const parentGoal = availableExecutiveGoals.find(t => t.id === parentExecutiveGoalId)
      if (parentGoal) {
        if (finalStartDate < parentGoal.startDate || finalEndDate > parentGoal.endDate) {
          setError('Task dates must be within parent goal dates')
          return
        }
      }
    }

    setError(null)
    await onSubmit({
      title: title.trim(),
      description: description.trim(),
      startDate: finalStartDate,
      endDate: finalEndDate,
      color,
      note: note.trim(),
      parentExecutiveGoalId: parentExecutiveGoalId || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="space-y-1">
        <label className="text-xs text-white/60">Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Q1 Strategic Planning"
          className="
            w-full rounded-xl border border-white/10 bg-white/5
            px-3 py-2 text-sm text-white placeholder-white/40
            focus:border-[#8B5CF6]/60 focus:outline-none
          "
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs text-white/60">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Brief description of the goal and its objectives..."
          className="
            w-full rounded-xl border border-white/10 bg-white/5
            px-3 py-2 text-sm text-white placeholder-white/40
            focus:border-[#8B5CF6]/60 focus:outline-none
            resize-none
          "
          disabled={isSubmitting}
        />
      </div>

      {/* Parent Goal Selector */}
      {!hideParentGoalSelector && availableExecutiveGoals.length > 0 && (
        <div className="space-y-1">
          <label className="text-xs text-white/60">Parent Goal (optional)</label>
          <select
            value={parentExecutiveGoalId}
            onChange={(e) => setParentExecutiveGoalId(e.target.value)}
            className="
              w-full rounded-xl border border-white/10 bg-white/5
              px-3 py-2 text-sm text-white
              focus:border-[#8B5CF6]/60 focus:outline-none
              appearance-none cursor-pointer
            "
            disabled={isSubmitting}
          >
            <option value="" className="bg-[#1a1a1a] text-white">None (Standalone goal)</option>
            {availableExecutiveGoals
              .filter(t => {
                // Don't show self
                if (t.id === initialData?.id) return false
                // Don't show goals that already have parents (keep nesting to 1 level)
                if (t.parentExecutiveGoalId) return false
                // Only show goals that overlap with current date range
                if (startDate && endDate) {
                  return !(t.endDate < startDate || t.startDate > endDate)
                }
                return true
              })
              .map(goal => (
                <option key={goal.id} value={goal.id} className="bg-[#1a1a1a] text-white">
                  {goal.title} ({goal.startDate} → {goal.endDate})
                </option>
              ))
            }
          </select>
          {parentExecutiveGoalId && (
            <p className="text-xs text-white/40 mt-1">
              This goal will be grouped under the selected main goal
            </p>
          )}
        </div>
      )}

      {!hideDateFields && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs text-white/60">Start date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="
                w-full rounded-xl border border-white/10 bg-white/5
                px-3 py-2 text-sm text-white placeholder-white/40
                focus:border-[#8B5CF6]/60 focus:outline-none
              "
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-white/60">End date</label>
            <input
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="
                w-full rounded-xl border border-white/10 bg-white/5
                px-3 py-2 text-sm text-white placeholder-white/40
                focus:border-[#8B5CF6]/60 focus:outline-none
              "
              disabled={isSubmitting}
            />
          </div>
        </div>
      )}

      <div className="space-y-1">
        <label className="text-xs text-white/60">Color</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-10 w-12 rounded-lg border border-white/10 bg-transparent"
            disabled={isSubmitting}
          />
          <span className="text-xs text-white/50">
            Used to highlight goal days
          </span>
        </div>
      </div>

      {!hideNotesField && (
        <div className="space-y-1">
          <label className="text-xs text-white/60">Notes (optional)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="Details, objectives, key milestones..."
            className="
              w-full rounded-xl border border-white/10 bg-white/5
              px-3 py-2 text-sm text-white placeholder-white/40
              focus:border-[#8B5CF6]/60 focus:outline-none
              resize-none
            "
            disabled={isSubmitting}
          />
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="
            px-4 py-2 rounded-xl text-sm font-medium
            bg-white/[0.05] text-white/70 hover:bg-white/[0.1]
            transition-all duration-150
          "
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="
            px-4 py-2 rounded-xl text-sm font-medium
            bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED]
            text-white hover:shadow-[0_0_20px_rgba(139,92,246,0.3)]
            transition-all duration-150
            disabled:opacity-50 disabled:cursor-not-allowed
          "
        >
          {isSubmitting
            ? 'Saving…'
            : isTask
            ? 'Add task'
            : initialData?.id
            ? 'Update goal'
            : 'Save goal'}
        </button>
      </div>
    </form>
  )
}
