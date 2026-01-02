import { useState, useEffect } from 'react'
import type { TravelPlan } from '@/types'

interface TravelFormProps {
  initialData?: Partial<TravelPlan>
  onSubmit: (data: {
    title: string
    destination: string
    startDate: string
    endDate: string
    color: string
    note: string
  }) => void | Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

export function TravelForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: TravelFormProps) {
  const [title, setTitle] = useState(initialData?.title || '')
  const [destination, setDestination] = useState(initialData?.destination || '')
  const [startDate, setStartDate] = useState(initialData?.startDate || '')
  const [endDate, setEndDate] = useState(initialData?.endDate || '')
  const [color, setColor] = useState(initialData?.color || '#0EA5E9')
  const [note, setNote] = useState(initialData?.note || '')
  const [error, setError] = useState<string | null>(null)

  // Update form when initialData changes
  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '')
      setDestination(initialData.destination || '')
      setStartDate(initialData.startDate || '')
      setEndDate(initialData.endDate || '')
      setColor(initialData.color || '#0EA5E9')
      setNote(initialData.note || '')
    }
  }, [initialData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim() || !startDate || !endDate) {
      setError('Title and dates are required')
      return
    }

    if (startDate > endDate) {
      setError('End date must be after start date')
      return
    }

    setError(null)
    await onSubmit({
      title: title.trim(),
      destination: destination.trim(),
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

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs text-white/60">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Work trip to NYC"
            className="
              w-full rounded-xl border border-white/10 bg-white/5
              px-3 py-2 text-sm text-white placeholder-white/40
              focus:border-[#AF52DE]/60 focus:outline-none
            "
            disabled={isSubmitting}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-white/60">Destination (optional)</label>
          <input
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="City or country"
            className="
              w-full rounded-xl border border-white/10 bg-white/5
              px-3 py-2 text-sm text-white placeholder-white/40
              focus:border-[#AF52DE]/60 focus:outline-none
            "
            disabled={isSubmitting}
          />
        </div>
      </div>

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
              focus:border-[#AF52DE]/60 focus:outline-none
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
              focus:border-[#AF52DE]/60 focus:outline-none
            "
            disabled={isSubmitting}
          />
        </div>
      </div>

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
          <span className="text-xs text-white/50">Used to highlight travel days</span>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs text-white/60">Notes (optional)</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="Details, tickets, confirmation numbers..."
          className="
            w-full rounded-xl border border-white/10 bg-white/5
            px-3 py-2 text-sm text-white placeholder-white/40
            focus:border-[#AF52DE]/60 focus:outline-none
            resize-none
          "
          disabled={isSubmitting}
        />
      </div>

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
            bg-gradient-to-r from-[#007AFF] to-[#AF52DE]
            text-white hover:shadow-[0_0_20px_rgba(0,122,255,0.3)]
            transition-all duration-150
            disabled:opacity-50 disabled:cursor-not-allowed
          "
        >
          {isSubmitting ? 'Saving…' : initialData?.id ? 'Update travel' : 'Save travel'}
        </button>
      </div>
    </form>
  )
}

