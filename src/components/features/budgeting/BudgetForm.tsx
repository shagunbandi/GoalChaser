import { useState } from 'react'
import type { BudgetPlan, BudgetCategory } from '@/types'

interface BudgetFormProps {
  initialData?: Partial<BudgetPlan>
  onSubmit: (data: {
    name: string
    income: number
    categories: BudgetCategory[]
    startMonth: number
    startYear: number
    repeatCount: number
    note: string
  }) => void | Promise<void>
  onCancel: () => void
  onView?: () => void
  isSubmitting?: boolean
}

const DEFAULT_CATEGORIES = [
  { name: 'Rent', isFixed: true, color: '#EF4444' },
  { name: 'Utilities', isFixed: true, color: '#F97316' },
  { name: 'Groceries', isFixed: false, color: '#F59E0B' },
  { name: 'Transportation', isFixed: false, color: '#84CC16' },
  { name: 'Entertainment', isFixed: false, color: '#06B6D4' },
  { name: 'Shopping', isFixed: false, color: '#8B5CF6' },
  { name: 'Healthcare', isFixed: false, color: '#EC4899' },
  { name: 'Other', isFixed: false, color: '#6B7280' },
]

export function BudgetForm({
  initialData,
  onSubmit,
  onCancel,
  onView,
  isSubmitting = false,
}: BudgetFormProps) {
  const [name, setName] = useState(initialData?.name || '')
  const [income, setIncome] = useState(initialData?.income?.toString() || '')
  const [categories, setCategories] = useState<BudgetCategory[]>(
    initialData?.categories || []
  )
  const [startMonth, setStartMonth] = useState<number>(
    initialData?.startDate ? new Date(initialData.startDate).getMonth() : new Date().getMonth()
  )
  const [startYear, setStartYear] = useState<number>(
    initialData?.startDate ? new Date(initialData.startDate).getFullYear() : new Date().getFullYear()
  )
  const [repeatCount, setRepeatCount] = useState(initialData?.isRecurring ? '6' : '1')
  const [note, setNote] = useState(initialData?.note || '')
  const [error, setError] = useState<string | null>(null)

  // New category inputs
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryAmount, setNewCategoryAmount] = useState('')

  const incomeNum = parseFloat(income) || 0
  const totalBudgeted = categories.reduce((sum, c) => sum + c.allocatedAmount, 0)
  const remainingBudget = incomeNum - totalBudgeted

  const addCategory = () => {
    if (!newCategoryName.trim() || !newCategoryAmount) return
    const amount = parseFloat(newCategoryAmount)
    if (isNaN(amount) || amount <= 0) return

    const newCat: BudgetCategory = {
      id: `cat_${Date.now()}`,
      name: newCategoryName.trim(),
      allocatedAmount: amount,
      isFixed: false,
      color: '#F59E0B',
    }

    setCategories([...categories, newCat])
    setNewCategoryName('')
    setNewCategoryAmount('')
  }

  const addDefaultCategory = (defaultCat: typeof DEFAULT_CATEGORIES[0]) => {
    const newCat: BudgetCategory = {
      id: `cat_${Date.now()}`,
      name: defaultCat.name,
      allocatedAmount: 0,
      isFixed: defaultCat.isFixed,
      color: defaultCat.color,
    }
    setCategories([...categories, newCat])
  }

  const removeCategory = (id: string) => {
    setCategories(categories.filter((c) => c.id !== id))
  }

  const updateCategoryAmount = (id: string, amount: number) => {
    setCategories(
      categories.map((c) =>
        c.id === id ? { ...c, allocatedAmount: amount } : c
      )
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim() || !income) {
      setError('Name and income are required')
      return
    }

    const incomeNum = parseFloat(income)
    if (isNaN(incomeNum) || incomeNum <= 0) {
      setError('Income must be a positive number')
      return
    }

    if (categories.length === 0) {
      setError('Add at least one budget category')
      return
    }

    const repeatNum = parseInt(repeatCount)
    if (!repeatNum || repeatNum < 1) {
      setError('Repeat count must be at least 1')
      return
    }

    setError(null)
    await onSubmit({
      name: name.trim(),
      income: incomeNum,
      categories,
      startMonth,
      startYear,
      repeatCount: repeatNum,
      note: note.trim(),
    })
  }

  const availableDefaults = DEFAULT_CATEGORIES.filter(
    (def) => !categories.some((cat) => cat.name === def.name)
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="space-y-1">
        <label className="text-xs text-white/60">Budget Name *</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-[#007AFF]/50"
          placeholder="January 2026 Budget"
          required
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs text-white/60">Monthly Budget (₹) *</label>
        <input
          type="number"
          value={income}
          onChange={(e) => setIncome(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-[#007AFF]/50"
          placeholder="50000"
          required
          min="1"
        />
      </div>

      {/* Month Selection */}
      <div className="space-y-2">
        <label className="text-xs text-white/60">Start Month *</label>
        <div className="grid grid-cols-6 gap-2">
          {[
            { label: 'Jan', value: 0 },
            { label: 'Feb', value: 1 },
            { label: 'Mar', value: 2 },
            { label: 'Apr', value: 3 },
            { label: 'May', value: 4 },
            { label: 'Jun', value: 5 },
            { label: 'Jul', value: 6 },
            { label: 'Aug', value: 7 },
            { label: 'Sep', value: 8 },
            { label: 'Oct', value: 9 },
            { label: 'Nov', value: 10 },
            { label: 'Dec', value: 11 },
          ].map((month) => (
            <button
              key={month.value}
              type="button"
              onClick={() => setStartMonth(month.value)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                startMonth === month.value
                  ? 'bg-gradient-to-r from-[#007AFF] to-[#5856D6] text-white shadow-lg shadow-blue-500/30'
                  : 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:border-white/20'
              }`}
            >
              {month.label}
            </button>
          ))}
        </div>
      </div>

      {/* Year Selection */}
      <div className="space-y-2">
        <label className="text-xs text-white/60">Start Year *</label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setStartYear(startYear - 1)}
            className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:border-white/20 transition-all"
          >
            ‹
          </button>
          <div className="flex-1 grid grid-cols-3 gap-2">
            {[startYear - 1, startYear, startYear + 1].map((year) => (
              <button
                key={year}
                type="button"
                onClick={() => setStartYear(year)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  startYear === year
                    ? 'bg-gradient-to-r from-[#007AFF] to-[#5856D6] text-white shadow-lg shadow-blue-500/30'
                    : 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:border-white/20'
                }`}
              >
                {year}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setStartYear(startYear + 1)}
            className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:border-white/20 transition-all"
          >
            ›
          </button>
        </div>
      </div>

      {/* Repeat Count */}
      <div className="space-y-1">
        <label className="text-xs text-white/60">Repeat for (months) *</label>
        <input
          type="number"
          value={repeatCount}
          onChange={(e) => setRepeatCount(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-[#007AFF]/50"
          placeholder="1"
          min="1"
          required
        />
        <p className="text-xs text-white/40 mt-1">
          Create {repeatCount || '1'} consecutive monthly budget{parseInt(repeatCount) !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Budget Categories */}
      <div className="space-y-2">
        <label className="text-xs text-white/60">Budget Categories *</label>
        
        {/* Quick Add Default Categories */}
        {availableDefaults.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {availableDefaults.map((def) => (
              <button
                key={def.name}
                type="button"
                onClick={() => addDefaultCategory(def)}
                className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-xs text-white/70 transition-colors"
              >
                + {def.name}
              </button>
            ))}
          </div>
        )}

        {/* Custom Category Add */}
        <div className="flex gap-2 items-end">
          <div className="flex-1 space-y-1">
            <input
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none focus:border-[#007AFF]/50"
              placeholder="Category name"
            />
          </div>
          <div className="w-24 space-y-1">
            <input
              type="number"
              value={newCategoryAmount}
              onChange={(e) => setNewCategoryAmount(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none focus:border-[#007AFF]/50"
              placeholder="₹"
            />
          </div>
          <button
            type="button"
            onClick={addCategory}
            className="px-3 py-2 rounded-xl bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 text-xs whitespace-nowrap"
          >
            + Add
          </button>
        </div>

        {/* Category List */}
        {categories.length > 0 && (
          <div className="space-y-1 mt-2">
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2"
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: category.color }}
                />
                <span className="text-xs text-white/80 flex-1 min-w-0 truncate">
                  {category.name}
                </span>
                <input
                  type="number"
                  value={category.allocatedAmount}
                  onChange={(e) =>
                    updateCategoryAmount(
                      category.id,
                      parseFloat(e.target.value) || 0
                    )
                  }
                  className="w-24 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-white outline-none focus:border-[#007AFF]/50"
                  min="0"
                />
                <button
                  type="button"
                  onClick={() => removeCategory(category.id)}
                  className="text-white/40 hover:text-red-400 transition-colors"
                >
                  ✕
                </button>
              </div>
            ))}
            <div className="flex justify-between items-center text-xs pt-2 border-t border-white/10">
              <span className="text-white/60">Total Budgeted:</span>
              <span className="text-white font-medium">
                ₹{totalBudgeted.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Budget Summary */}
      <div className={`p-3 rounded-xl border ${
        remainingBudget >= 0
          ? 'bg-gradient-to-br from-green-500/10 to-blue-500/10 border-green-500/20'
          : 'bg-gradient-to-br from-red-500/10 to-orange-500/10 border-red-500/20'
      }`}>
        <div className="text-xs text-white/60 mb-1">Available for Savings</div>
        <div className={`text-2xl font-bold ${
          remainingBudget >= 0 ? 'text-green-400' : 'text-red-400'
        }`}>
          ₹{Math.abs(remainingBudget).toLocaleString('en-IN')}
        </div>
        {remainingBudget < 0 && (
          <div className="text-xs text-red-300 mt-1">
            ⚠️ Budget exceeds income by ₹{Math.abs(remainingBudget).toLocaleString('en-IN')}
          </div>
        )}
        {remainingBudget >= 0 && incomeNum > 0 && (
          <div className="text-xs text-white/50 mt-1">
            {((remainingBudget / incomeNum) * 100).toFixed(1)}% of income
          </div>
        )}
      </div>

      <div className="space-y-1">
        <label className="text-xs text-white/60">Notes</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-[#007AFF]/50"
          placeholder="Budget goals, special considerations..."
          rows={2}
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
        {initialData?.id && onView && (
          <button
            type="button"
            onClick={onView}
            className="flex-1 rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm text-blue-400 transition-colors hover:bg-blue-500/20"
            disabled={isSubmitting}
          >
            View Budget
          </button>
        )}
        <button
          type="submit"
          className="flex-1 rounded-xl bg-gradient-to-r from-[#007AFF] to-[#AF52DE] px-4 py-2 text-sm font-medium text-white transition-all hover:shadow-[0_0_20px_rgba(0,122,255,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Creating...' : initialData?.id ? 'Update Budget' : 'Create Budget'}
        </button>
      </div>
    </form>
  )
}
