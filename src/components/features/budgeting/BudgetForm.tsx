import { useState } from 'react'
import type { BudgetPlan, BudgetCategory } from '@/types'

interface BudgetFormProps {
  initialData?: Partial<BudgetPlan>
  onSubmit: (data: {
    name: string
    income: number
    categories: BudgetCategory[]
    frequency: 'one-time' | 'monthly' | 'weekly'
    startDate?: string
    endDate?: string
    startDay?: number
    firstPeriodStart?: string
    durationType?: 'count' | 'endDate'
    durationValue?: number | string
    note: string
  }) => void | Promise<void>
  onCancel: () => void
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

const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export function BudgetForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: BudgetFormProps) {
  const [name, setName] = useState(initialData?.name || '')
  const [income, setIncome] = useState(initialData?.income?.toString() || '')
  const [categories, setCategories] = useState<BudgetCategory[]>(
    initialData?.categories || []
  )
  const [frequency, setFrequency] = useState<'one-time' | 'monthly' | 'weekly'>(
    initialData?.isRecurring 
      ? (initialData?.frequency || 'monthly')
      : 'one-time'
  )
  
  // One-time budget fields
  const [startDate, setStartDate] = useState(initialData?.startDate || '')
  const [endDate, setEndDate] = useState(initialData?.endDate || '')
  
  // Recurring budget fields
  const [startDay, setStartDay] = useState(initialData?.startDay?.toString() || '1')
  const [firstPeriodStart, setFirstPeriodStart] = useState(initialData?.startDate || '')
  const [durationType, setDurationType] = useState<'count' | 'endDate'>('count')
  const [durationCount, setDurationCount] = useState('6')
  const [durationEndDate, setDurationEndDate] = useState('')
  
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

    // Validate based on frequency
    if (frequency === 'one-time') {
      if (!startDate || !endDate) {
        setError('Start and end dates are required')
        return
      }
      if (startDate > endDate) {
        setError('End date must be after start date')
        return
      }
    } else {
      if (!firstPeriodStart) {
        setError(`First ${frequency === 'monthly' ? 'month' : 'week'} is required`)
        return
      }
      if (durationType === 'count') {
        const count = parseInt(durationCount)
        if (isNaN(count) || count < 1) {
          setError('Duration must be at least 1')
          return
        }
      } else {
        if (!durationEndDate) {
          setError('End date is required')
          return
        }
      }
    }

    setError(null)
    await onSubmit({
      name: name.trim(),
      income: incomeNum,
      categories,
      frequency,
      startDate: frequency === 'one-time' ? startDate : undefined,
      endDate: frequency === 'one-time' ? endDate : undefined,
      startDay: frequency !== 'one-time' ? parseInt(startDay) : undefined,
      firstPeriodStart: frequency !== 'one-time' ? firstPeriodStart : undefined,
      durationType: frequency !== 'one-time' ? durationType : undefined,
      durationValue: frequency !== 'one-time' 
        ? (durationType === 'count' ? parseInt(durationCount) : durationEndDate)
        : undefined,
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
        <label className="text-xs text-white/60">Monthly Income (₹) *</label>
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

      {/* Frequency Selection */}
      <div className="space-y-1">
        <label className="text-xs text-white/60">Frequency *</label>
        <select
          value={frequency}
          onChange={(e) => setFrequency(e.target.value as 'one-time' | 'monthly' | 'weekly')}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-[#007AFF]/50"
        >
          <option value="one-time">One-time</option>
          <option value="monthly">Monthly</option>
          <option value="weekly">Weekly</option>
        </select>
      </div>

      {/* Date inputs based on frequency */}
      {frequency === 'one-time' ? (
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
      ) : frequency === 'monthly' ? (
        <>
          <div className="space-y-1">
            <label className="text-xs text-white/60">Start Date *</label>
            <input
              type="date"
              value={firstPeriodStart}
              onChange={(e) => {
                setFirstPeriodStart(e.target.value)
                // Extract day of month from the selected date
                if (e.target.value) {
                  const date = new Date(e.target.value)
                  setStartDay(date.getDate().toString())
                }
              }}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-[#007AFF]/50"
              required
            />
            <p className="text-xs text-white/40 mt-1">
              Budget will repeat on day {startDay || '1'} of each month
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-white/60">Duration *</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={durationType === 'count'}
                  onChange={() => setDurationType('count')}
                  className="text-blue-500"
                />
                <span className="text-sm text-white/80">Repeat for</span>
                <input
                  type="number"
                  value={durationCount}
                  onChange={(e) => setDurationCount(e.target.value)}
                  disabled={durationType !== 'count'}
                  className="w-20 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-sm text-white outline-none disabled:opacity-50"
                  min="1"
                />
                <span className="text-sm text-white/80">months</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={durationType === 'endDate'}
                  onChange={() => setDurationType('endDate')}
                  className="text-blue-500"
                />
                <span className="text-sm text-white/80">End on</span>
                <input
                  type="date"
                  value={durationEndDate}
                  onChange={(e) => setDurationEndDate(e.target.value)}
                  disabled={durationType !== 'endDate'}
                  className="flex-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-sm text-white outline-none disabled:opacity-50"
                />
              </label>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="space-y-1">
            <label className="text-xs text-white/60">Start Date *</label>
            <input
              type="date"
              value={firstPeriodStart}
              onChange={(e) => {
                setFirstPeriodStart(e.target.value)
                // Extract day of week from the selected date
                if (e.target.value) {
                  const date = new Date(e.target.value)
                  setStartDay(date.getDay().toString())
                }
              }}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-[#007AFF]/50"
              required
            />
            <p className="text-xs text-white/40 mt-1">
              Budget will repeat every {firstPeriodStart ? WEEKDAY_NAMES[new Date(firstPeriodStart).getDay()] : 'week'}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-white/60">Duration *</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={durationType === 'count'}
                  onChange={() => setDurationType('count')}
                  className="text-blue-500"
                />
                <span className="text-sm text-white/80">Repeat for</span>
                <input
                  type="number"
                  value={durationCount}
                  onChange={(e) => setDurationCount(e.target.value)}
                  disabled={durationType !== 'count'}
                  className="w-20 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-sm text-white outline-none disabled:opacity-50"
                  min="1"
                />
                <span className="text-sm text-white/80">weeks</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={durationType === 'endDate'}
                  onChange={() => setDurationType('endDate')}
                  className="text-blue-500"
                />
                <span className="text-sm text-white/80">End on</span>
                <input
                  type="date"
                  value={durationEndDate}
                  onChange={(e) => setDurationEndDate(e.target.value)}
                  disabled={durationType !== 'endDate'}
                  className="flex-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-sm text-white outline-none disabled:opacity-50"
                />
              </label>
            </div>
          </div>
        </>
      )}

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
