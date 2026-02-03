import { useState, useEffect } from 'react'
import type { ExecutiveGoal, ExecutiveGoalInput } from '../types'

interface ExecutiveGoalFormProps {
  initialData?: Partial<ExecutiveGoal>
  onSubmit: (data: ExecutiveGoalInput) => void | Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
  hideNotesField?: boolean
  hideDateFields?: boolean
}

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0]
}

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
  hideNotesField = false,
  hideDateFields = false,
}: ExecutiveGoalFormProps) {
  const [title, setTitle] = useState(initialData?.title || '')
  const [plan, setPlan] = useState(initialData?.plan || '')
  const [startDate, setStartDate] = useState(
    initialData?.startDate || getTodayDate(),
  )
  const [endDate, setEndDate] = useState(
    initialData?.endDate || getOneWeekLater(),
  )
  const [color, setColor] = useState(initialData?.color || '#8B5CF6')
  const [note, setNote] = useState(initialData?.note || '')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '')
      setPlan(initialData.plan || '')
      setStartDate(initialData.startDate || getTodayDate())
      setEndDate(initialData.endDate || getOneWeekLater())
      setColor(initialData.color || '#8B5CF6')
      setNote(initialData.note || '')
    }
  }, [initialData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !startDate || !endDate) {
      setError('Title and dates are required')
      return
    }
    if (!hideDateFields && startDate > endDate) {
      setError('End date must be after start date')
      return
    }
    setError(null)
    await onSubmit({
      title: title.trim(),
      plan: plan.trim(),
      startDate,
      endDate,
      color,
      note: note.trim(),
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
        <label className="text-xs text-white/60">Plan</label>
        <textarea
          value={plan}
          onChange={(e) => setPlan(e.target.value)}
          rows={3}
          placeholder="Phase plan or key objectives for the goal..."
          className="
            w-full rounded-xl border border-white/10 bg-white/5
            px-3 py-2 text-sm text-white placeholder-white/40
            focus:border-[#8B5CF6]/60 focus:outline-none
            resize-none
          "
          disabled={isSubmitting}
        />
      </div>

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
            : initialData?.id
            ? 'Update goal'
            : 'Save goal'}
        </button>
      </div>
    </form>
  )
}
