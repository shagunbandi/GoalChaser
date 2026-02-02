import { useState } from 'react'
import type {
  TransactionCategory,
  Currency,
} from '../types'
import { CURRENCIES } from '../types'

interface ExpenseFormProps {
  date: string // ISO date
  categories: TransactionCategory[]
  defaultCurrency?: Currency
  onSubmit: (data: {
    categoryId: string
    categoryName: string
    amount: number
    currency: Currency
    description: string
    date: string
    isRecurring?: boolean
    frequency?: 'daily' | 'weekly' | 'monthly'
    endDate?: string
  }) => void | Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

export function ExpenseForm({
  date,
  categories,
  defaultCurrency = '₹',
  onSubmit,
  onCancel,
  isSubmitting = false,
}: ExpenseFormProps) {
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState<Currency>(defaultCurrency)
  const [description, setDescription] = useState('')
  const [isRecurring, setIsRecurring] = useState(false)
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('monthly')
  const [endDate, setEndDate] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!categoryId || !amount) {
      setError('Category and amount are required')
      return
    }

    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Amount must be a positive number')
      return
    }

    const category = categories.find((c) => c.id === categoryId)
    if (!category) {
      setError('Invalid category selected')
      return
    }

    if (isRecurring && !endDate) {
      setError('End date is required for recurring expenses')
      return
    }

    if (isRecurring && endDate < date) {
      setError('End date must be after start date')
      return
    }

    setError(null)
    await onSubmit({
      categoryId,
      categoryName: category.name,
      amount: amountNum,
      currency,
      description: description.trim(),
      date,
      isRecurring,
      frequency: isRecurring ? frequency : undefined,
      endDate: isRecurring ? endDate : undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-white/10 bg-white/5 p-3">
        <div className="text-sm font-medium text-white/90 mb-1">Date</div>
        <div className="text-sm text-white/60">
          {new Date(`${date}T00:00:00`).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs text-white/60">Category *</label>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-[#007AFF]/50"
          required
        >
          {categories.length === 0 ? (
            <option value="">No categories available</option>
          ) : (
            categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.icon ? `${cat.icon} ` : ''}
                {cat.name}
              </option>
            ))
          )}
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-xs text-white/60">Amount *</label>
        <div className="flex gap-2">
          {/* Currency Selector */}
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as Currency)}
            className="w-20 rounded-xl border border-white/10 bg-white/5 px-2 py-2 text-sm text-white outline-none transition-colors focus:border-[#007AFF]/50"
          >
            {CURRENCIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.value}
              </option>
            ))}
          </select>
          {/* Amount Input */}
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-[#007AFF]/50"
            placeholder="150"
            required
            min="0.01"
            step="0.01"
            autoFocus
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs text-white/60">Description</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-[#007AFF]/50"
          placeholder="Lunch at cafe, groceries, etc."
        />
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isRecurring}
            onChange={(e) => setIsRecurring(e.target.checked)}
            className="w-4 h-4 rounded border-white/20 bg-white/10 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
          />
          <span className="text-sm text-white/90">Recurring Expense</span>
        </label>

        {isRecurring && (
          <div className="mt-3 space-y-3 pl-6 border-l-2 border-white/10">
            <div className="space-y-1">
              <label className="text-xs text-white/60">Frequency *</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as 'daily' | 'weekly' | 'monthly')}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-[#007AFF]/50"
                required
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-white/60">End Date *</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={date}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-[#007AFF]/50"
                required
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition-colors hover:bg-white/10"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 rounded-xl bg-gradient-to-r from-red-500 to-rose-500 px-4 py-2 text-sm font-medium text-white transition-all hover:shadow-[0_0_20px_rgba(239,68,68,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isSubmitting || categories.length === 0}
        >
          {isSubmitting ? 'Adding...' : 'Add Expense'}
        </button>
      </div>
    </form>
  )
}
