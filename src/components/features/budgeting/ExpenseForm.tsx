import { useState } from 'react'
import type { BudgetCategory } from '@/types'

interface ExpenseFormProps {
  date: string // ISO date
  categories: BudgetCategory[]
  onSubmit: (data: {
    categoryId: string
    categoryName: string
    amount: number
    description: string
    date: string
    budgetId?: string
  }) => void | Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
  activeBudgetId?: string
}

export function ExpenseForm({
  date,
  categories,
  onSubmit,
  onCancel,
  isSubmitting = false,
  activeBudgetId,
}: ExpenseFormProps) {
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
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

    setError(null)
    await onSubmit({
      categoryId,
      categoryName: category.name,
      amount: amountNum,
      description: description.trim(),
      date,
      budgetId: activeBudgetId,
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
                {cat.name} (₹{cat.allocatedAmount.toLocaleString('en-IN')} budgeted)
              </option>
            ))
          )}
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-xs text-white/60">Amount (₹) *</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-[#007AFF]/50"
          placeholder="150"
          required
          min="0.01"
          step="0.01"
          autoFocus
        />
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
          className="flex-1 rounded-xl bg-gradient-to-r from-[#007AFF] to-[#AF52DE] px-4 py-2 text-sm font-medium text-white transition-all hover:shadow-[0_0_20px_rgba(0,122,255,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isSubmitting || categories.length === 0}
        >
          {isSubmitting ? 'Adding...' : 'Add Expense'}
        </button>
      </div>
    </form>
  )
}
