import { useState, useEffect } from 'react'
import type { SIPPlan, SIPFrequency } from '@/types'

interface SIPFormProps {
  initialData?: Partial<SIPPlan>
  onSubmit: (data: {
    name: string
    amount: number
    frequency: SIPFrequency
    startDate: string
    endDate: string
    expectedReturn?: number
    color: string
    note: string
  }) => void | Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

export function SIPForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: SIPFormProps) {
  const [name, setName] = useState(initialData?.name || '')
  const [amount, setAmount] = useState(initialData?.amount?.toString() || '')
  const [frequency, setFrequency] = useState<SIPFrequency>(initialData?.frequency || 'monthly')
  const [startDate, setStartDate] = useState(initialData?.startDate || '')
  const [endDate, setEndDate] = useState(initialData?.endDate || '')
  const [expectedReturn, setExpectedReturn] = useState(initialData?.expectedReturn?.toString() || '12')
  const [color, setColor] = useState(initialData?.color || '#10B981')
  const [note, setNote] = useState(initialData?.note || '')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '')
      setAmount(initialData.amount?.toString() || '')
      setFrequency(initialData.frequency || 'monthly')
      setStartDate(initialData.startDate || '')
      setEndDate(initialData.endDate || '')
      setExpectedReturn(initialData.expectedReturn?.toString() || '12')
      setColor(initialData.color || '#10B981')
      setNote(initialData.note || '')
    }
  }, [initialData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim() || !amount || !startDate || !endDate) {
      setError('Name, amount, and dates are required')
      return
    }

    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Amount must be a positive number')
      return
    }

    if (startDate > endDate) {
      setError('End date must be after start date')
      return
    }

    const returnNum = parseFloat(expectedReturn) || 12
    if (isNaN(returnNum) || returnNum < 0) {
      setError('Expected return must be a valid percentage')
      return
    }

    setError(null)
    await onSubmit({
      name: name.trim(),
      amount: amountNum,
      frequency,
      startDate,
      endDate,
      expectedReturn: returnNum,
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
        <label className="text-xs text-white/60">SIP Name *</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-[#007AFF]/50"
          placeholder="e.g., Monthly SIP - Index Fund"
          required
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs text-white/60">Investment Amount (₹) *</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-[#007AFF]/50"
            placeholder="5000"
            required
            min="1"
            step="100"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-white/60">Frequency *</label>
          <select
            value={frequency}
            onChange={(e) => setFrequency(e.target.value as SIPFrequency)}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-[#007AFF]/50"
            required
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs text-white/60">Start Date *</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-[#007AFF]/50"
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-white/60">End Date *</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-[#007AFF]/50"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs text-white/60">Expected Annual Return (%)</label>
          <input
            type="number"
            value={expectedReturn}
            onChange={(e) => setExpectedReturn(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-[#007AFF]/50"
            placeholder="12"
            step="0.1"
            min="0"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-white/60">Color</label>
          <div className="flex gap-2">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-10 w-12 cursor-pointer rounded-xl border border-white/10 bg-transparent"
            />
            <input
              type="text"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none transition-colors focus:border-[#007AFF]/50"
              placeholder="#10B981"
            />
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs text-white/60">Notes</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-[#007AFF]/50"
          placeholder="Add any notes about this SIP..."
          rows={3}
        />
      </div>

      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="
            flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white
            transition-colors hover:bg-white/10
          "
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="
            flex-1 rounded-xl bg-gradient-to-r from-[#007AFF] to-[#AF52DE] px-4 py-2 text-sm font-medium text-white
            transition-all hover:shadow-[0_0_20px_rgba(0,122,255,0.3)]
            disabled:opacity-50 disabled:cursor-not-allowed
          "
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : initialData?.id ? 'Update SIP' : 'Create SIP'}
        </button>
      </div>
    </form>
  )
}
