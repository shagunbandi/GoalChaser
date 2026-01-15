'use client'

import { useMemo, useState, useCallback } from 'react'
import type {
  DayDetails,
  SIPPlan,
  BudgetPlan,
  SIPFrequency,
  Expense,
  Income,
  ButtonConfig,
} from '@/types'
import type { YearViewConfig } from '@/types/year-view-config'
import { Card, Modal } from '@/components/ui'
import { GenericYearView } from './year-view/GenericYearView'
import {
  SIPForm,
  SIPCard,
  BudgetForm,
  BudgetCard,
  BudgetViewModal,
  ExpenseForm,
  IncomeForm,
} from './budgeting'
import { computeMonthInfo } from '@/utils'
import { generateSIPDates } from '@/lib/utils/sip-utils'

interface BudgetingViewProps {
  year: number
  todayISO: string
  dayDetails: Record<string, DayDetails>
  budgets: BudgetPlan[]
  sips: SIPPlan[]
  onPrevYear: () => void
  onNextYear: () => void
  onUpdateDay: (iso: string, updates: Partial<DayDetails>) => Promise<void>
  onSaveBudget: (budget: BudgetPlan) => Promise<void>
  onDeleteBudget: (budgetId: string) => Promise<void>
  onSaveSIP: (sip: SIPPlan) => Promise<void>
  onDeleteSIP: (sipId: string) => Promise<void>
  onJumpToDay?: (iso: string) => void
  initialSelectedDay?: string | null
}

export function BudgetingView({
  year,
  todayISO,
  dayDetails,
  budgets,
  sips,
  onPrevYear,
  onNextYear,
  onUpdateDay,
  onSaveBudget,
  onDeleteBudget,
  onSaveSIP,
  onDeleteSIP,
  onJumpToDay,
  initialSelectedDay,
}: BudgetingViewProps) {
  const [selectedDay, setSelectedDay] = useState<string | null>(
    initialSelectedDay || null,
  )
  const [showAddSIP, setShowAddSIP] = useState(false)
  const [showAddBudget, setShowAddBudget] = useState(false)
  const [editingBudget, setEditingBudget] = useState<BudgetPlan | null>(null)
  const [viewingBudget, setViewingBudget] = useState<BudgetPlan | null>(null)
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [showAddIncome, setShowAddIncome] = useState(false)

  // Reset expense/income modals when day changes
  const handleDaySelect = useCallback((date: string | null) => {
    setSelectedDay(date)
    if (date && onJumpToDay) {
      // Update URL with selected date
      onJumpToDay(date)
    }
    if (!date) {
      // Close expense/income modals when day modal closes
      setShowAddExpense(false)
      setShowAddIncome(false)
    }
  }, [onJumpToDay])

  const months = useMemo(
    () => Array.from({ length: 12 }, (_, i) => computeMonthInfo(year, i + 1)),
    [year],
  )

  // Get all expenses
  const allExpenses = useMemo(() => {
    const expenses: Expense[] = []
    Object.values(dayDetails).forEach((details) => {
      if (details.expenses) expenses.push(...details.expenses)
    })
    return expenses
  }, [dayDetails])

  // Get all income
  const allIncome = useMemo(() => {
    const income: Income[] = []
    Object.values(dayDetails).forEach((details) => {
      if (details.income) income.push(...details.income)
    })
    return income
  }, [dayDetails])

  // Check what's on a day
  const getDayInfo = (iso: string) => {
    const details = dayDetails[iso] || {}
    const hasSIP = getSIPsForDate(iso).length > 0
    const hasExpense = (details.expenses?.length || 0) > 0
    const hasIncome = (details.income?.length || 0) > 0
    return { hasSIP, hasExpense, hasIncome }
  }

  // Get all budgets for a specific month
  const getMonthBudgets = (year: number, month: number) => {
    // month is 1-12
    const monthStart = `${year}-${String(month).padStart(2, '0')}-01`
    const daysInMonth = new Date(year, month, 0).getDate()
    const monthEnd = `${year}-${String(month).padStart(2, '0')}-${String(
      daysInMonth,
    ).padStart(2, '0')}`

    // Find all budgets that overlap with this month
    return budgets.filter(
      (b) => b.startDate <= monthEnd && b.endDate >= monthStart,
    )
  }

  // Get active budget for expense form
  const getActiveBudget = (iso: string) => {
    return budgets.find((b) => iso >= b.startDate && iso <= b.endDate)
  }

  // Get SIP for a specific date
  const getSIPsForDate = (iso: string) => {
    return sips.filter((s) => {
      const sipDates = generateSIPDates(s.startDate, s.endDate, s.frequency)
      return sipDates.includes(iso)
    })
  }

  // Get all SIPs that have dates in a specific month
  const getMonthSIPs = (year: number, month: number) => {
    // month is 1-12
    const monthStart = `${year}-${String(month).padStart(2, '0')}-01`
    const daysInMonth = new Date(year, month, 0).getDate()
    const monthEnd = `${year}-${String(month).padStart(2, '0')}-${String(
      daysInMonth,
    ).padStart(2, '0')}`

    return sips.filter((s) => {
      const sipDates = generateSIPDates(s.startDate, s.endDate, s.frequency)
      // Check if any SIP dates fall within this month
      return sipDates.some((date) => date >= monthStart && date <= monthEnd)
    })
  }

  // Calculate SIP progress for a month
  const getSIPMonthProgress = (sip: SIPPlan, year: number, month: number) => {
    const monthStart = `${year}-${String(month).padStart(2, '0')}-01`
    const daysInMonth = new Date(year, month, 0).getDate()
    const monthEnd = `${year}-${String(month).padStart(2, '0')}-${String(
      daysInMonth,
    ).padStart(2, '0')}`

    const sipDates = generateSIPDates(sip.startDate, sip.endDate, sip.frequency)
    const monthDates = sipDates.filter(
      (date) => date >= monthStart && date <= monthEnd,
    )
    const completedInMonth = monthDates.filter((date) =>
      sip.completedDates?.includes(date),
    )

    return {
      totalInMonth: monthDates.length,
      completed: completedInMonth.length,
      amount: completedInMonth.length * sip.amount,
      pending: (monthDates.length - completedInMonth.length) * sip.amount,
    }
  }

  // Calculate remaining amount for a budget
  const getBudgetRemaining = (budget: BudgetPlan) => {
    const budgetExpenses = allExpenses.filter((e) => e.budgetId === budget.id)
    const budgetIncome = allIncome.filter((i) => i.budgetId === budget.id)

    const totalSpent = budgetExpenses.reduce((sum, e) => sum + e.amount, 0)
    const totalEarned = budgetIncome.reduce((sum, i) => sum + i.amount, 0)

    return budget.income + totalEarned - totalSpent
  }

  // Add SIP
  const handleAddSIP = async (data: {
    name: string
    amount: number
    frequency: SIPFrequency
    startDate: string
    endDate: string
    expectedReturn?: number
    color: string
    note: string
  }) => {
    const newPlan: SIPPlan = {
      id: `sip_${Date.now()}`,
      ...data,
      completedDates: [],
    }

    await onSaveSIP(newPlan)
    setShowAddSIP(false)
  }

  // Add or Update Budget
  const handleSaveBudget = async (data: {
    name: string
    income: number
    categories: BudgetPlan['categories']
    startMonth: number
    startYear: number
    repeatCount: number
    note: string
  }) => {
    if (editingBudget) {
      // Update existing budget
      const updatedPlan: BudgetPlan = {
        ...editingBudget,
        name: data.name,
        income: data.income,
        categories: data.categories,
        note: data.note,
      }

      await onSaveBudget(updatedPlan)
      setEditingBudget(null)
    } else {
      // Generate monthly budgets
      let currentMonth = data.startMonth
      let currentYear = data.startYear
      const parentId = `budget_${Date.now()}`

      for (let i = 0; i < data.repeatCount; i++) {
        // Create ISO dates directly to avoid timezone issues
        const monthIndex = currentMonth + 1 // Convert 0-indexed to 1-indexed
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()

        const startDateISO = `${currentYear}-${String(monthIndex).padStart(
          2,
          '0',
        )}-01`
        const endDateISO = `${currentYear}-${String(monthIndex).padStart(
          2,
          '0',
        )}-${String(daysInMonth).padStart(2, '0')}`

        const monthNames = [
          'Jan',
          'Feb',
          'Mar',
          'Apr',
          'May',
          'Jun',
          'Jul',
          'Aug',
          'Sep',
          'Oct',
          'Nov',
          'Dec',
        ]
        const budgetName =
          data.repeatCount > 1
            ? `${data.name} - ${monthNames[currentMonth]} ${currentYear}`
            : data.name

        const period: BudgetPlan = {
          id: `${parentId}_${i}`,
          name: budgetName,
          income: data.income,
          categories: data.categories.map((c) => ({ ...c })),
          startDate: startDateISO,
          endDate: endDateISO,
          note: data.note,
          isRecurring: data.repeatCount > 1,
          frequency: 'monthly',
          startDay: 1,
          parentBudgetId: data.repeatCount > 1 ? parentId : undefined,
          periodIndex: i,
        }

        await onSaveBudget(period)

        // Move to next month
        currentMonth++
        if (currentMonth > 11) {
          currentMonth = 0
          currentYear++
        }
      }
    }

    setShowAddBudget(false)
  }

  // Add Expense
  const handleAddExpense = useCallback(
    async (data: {
      categoryId: string
      categoryName: string
      amount: number
      description: string
      date: string
      budgetId?: string
      isRecurring?: boolean
      frequency?: 'daily' | 'weekly' | 'monthly'
      endDate?: string
    }) => {
      if (data.isRecurring && data.frequency && data.endDate) {
        // Generate recurring expenses
        const dates = generateSIPDates(
          data.date,
          data.endDate,
          data.frequency as any,
        )
        const parentId = `expense_${Date.now()}`

        for (let i = 0; i < dates.length; i++) {
          const expenseDate = dates[i]
          const expense: Expense = {
            id: `${parentId}_${i}`,
            categoryId: data.categoryId,
            categoryName: data.categoryName,
            amount: data.amount,
            description: data.description,
            date: expenseDate,
            budgetId: data.budgetId,
            isRecurring: true,
            frequency: data.frequency,
            endDate: data.endDate,
            parentExpenseId: parentId,
            occurrenceIndex: i,
          }

          const existing = dayDetails[expenseDate]?.expenses || []
          await onUpdateDay(expenseDate, { expenses: [...existing, expense] })
        }
      } else {
        // Single expense
        const newExpense: Expense = {
          id: `expense_${Date.now()}`,
          categoryId: data.categoryId,
          categoryName: data.categoryName,
          amount: data.amount,
          description: data.description,
          date: data.date,
          budgetId: data.budgetId,
        }
        const existing = dayDetails[data.date]?.expenses || []
        await onUpdateDay(data.date, { expenses: [...existing, newExpense] })
      }

      setShowAddExpense(false)
    },
    [dayDetails, onUpdateDay],
  )

  // Add Income
  const handleAddIncome = useCallback(
    async (data: {
      categoryId: string
      categoryName: string
      amount: number
      description: string
      date: string
      budgetId?: string
      isRecurring?: boolean
      frequency?: 'daily' | 'weekly' | 'monthly'
      endDate?: string
    }) => {
      if (data.isRecurring && data.frequency && data.endDate) {
        // Generate recurring income
        const dates = generateSIPDates(
          data.date,
          data.endDate,
          data.frequency as any,
        )
        const parentId = `income_${Date.now()}`

        for (let i = 0; i < dates.length; i++) {
          const incomeDate = dates[i]
          const income: Income = {
            id: `${parentId}_${i}`,
            categoryId: data.categoryId,
            categoryName: data.categoryName,
            amount: data.amount,
            description: data.description,
            date: incomeDate,
            budgetId: data.budgetId,
            isRecurring: true,
            frequency: data.frequency,
            endDate: data.endDate,
            parentIncomeId: parentId,
            occurrenceIndex: i,
          }

          const existing = dayDetails[incomeDate]?.income || []
          await onUpdateDay(incomeDate, { income: [...existing, income] })
        }
      } else {
        // Single income
        const newIncome: Income = {
          id: `income_${Date.now()}`,
          categoryId: data.categoryId,
          categoryName: data.categoryName,
          amount: data.amount,
          description: data.description,
          date: data.date,
          budgetId: data.budgetId,
        }
        const existing = dayDetails[data.date]?.income || []
        await onUpdateDay(data.date, { income: [...existing, newIncome] })
      }

      setShowAddIncome(false)
    },
    [dayDetails, onUpdateDay],
  )

  // Remove handlers
  const removeSIP = async (
    plan: SIPPlan,
    type: 'single' | 'all' = 'single',
  ) => {
    // For now, SIPs don't have parent tracking, so just delete the single SIP
    await onDeleteSIP(plan.id)
  }

  const updateSIPFromNow = async (plan: SIPPlan) => {
    const today = new Date().toISOString().split('T')[0]

    // Generate new SIP dates from today for 7 months
    const endDate = new Date()
    endDate.setMonth(endDate.getMonth() + 7)
    const endDateISO = endDate.toISOString().split('T')[0]

    // Create updated SIP with new dates
    const updatedSIP: SIPPlan = {
      ...plan,
      id: `sip_${Date.now()}`, // New ID to track this as separate period
      startDate: today,
      endDate: endDateISO,
      completedDates: [], // Reset completed dates for new period
    }

    await onSaveSIP(updatedSIP)
  }

  const removeBudget = async (plan: BudgetPlan, type: 'single' | 'all') => {
    if (type === 'all' && plan.isRecurring && plan.parentBudgetId) {
      // Delete all budgets with the same parentBudgetId
      const allPeriods = budgets.filter(
        (b) =>
          b.parentBudgetId === plan.parentBudgetId ||
          b.id === plan.parentBudgetId,
      )
      for (const budget of allPeriods) {
        await onDeleteBudget(budget.id)
      }
    } else {
      // Delete just this budget
      await onDeleteBudget(plan.id)
    }
  }

  const updateBudgetFromNow = async (plan: BudgetPlan) => {
    const today = new Date()
    const currentMonth = today.getMonth() // 0-11
    const currentYear = today.getFullYear()

    // Generate 7 months from now
    const monthsToGenerate = 7
    const parentId = plan.parentBudgetId || plan.id

    for (let i = 0; i < monthsToGenerate; i++) {
      const targetMonth = (currentMonth + i) % 12
      const targetYear = currentYear + Math.floor((currentMonth + i) / 12)

      // Create start and end dates
      const monthIndex = targetMonth + 1
      const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate()

      const startDateISO = `${targetYear}-${String(monthIndex).padStart(
        2,
        '0',
      )}-01`
      const endDateISO = `${targetYear}-${String(monthIndex).padStart(
        2,
        '0',
      )}-${String(daysInMonth).padStart(2, '0')}`

      // Check if budget already exists for this month
      const existingBudget = budgets.find(
        (b) =>
          (b.parentBudgetId === parentId || b.id === parentId) &&
          b.startDate === startDateISO,
      )

      const monthNames = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ]
      const budgetName = `${plan.name.split(' - ')[0]} - ${
        monthNames[targetMonth]
      } ${targetYear}`

      const budgetData: BudgetPlan = {
        id: existingBudget?.id || `${parentId}_${Date.now()}_${i}`,
        name: budgetName,
        income: plan.income,
        categories: plan.categories.map((c) => ({ ...c })),
        startDate: startDateISO,
        endDate: endDateISO,
        note: plan.note,
        isRecurring: true,
        frequency: 'monthly',
        startDay: 1,
        parentBudgetId: parentId,
        periodIndex: i,
      }

      await onSaveBudget(budgetData)
    }
  }

  const removeExpense = async (expense: Expense) => {
    const existing = dayDetails[expense.date]?.expenses || []
    await onUpdateDay(expense.date, {
      expenses: existing.filter((e) => e.id !== expense.id),
    })
  }

  const removeIncome = async (income: Income) => {
    const existing = dayDetails[income.date]?.income || []
    await onUpdateDay(income.date, {
      income: existing.filter((i) => i.id !== income.id),
    })
  }

  const toggleSIPDone = async (planId: string, iso: string) => {
    const sip = sips.find((s) => s.id === planId)
    if (!sip) return

    const completed = sip.completedDates || []
    const updatedSIP: SIPPlan = {
      ...sip,
      completedDates: completed.includes(iso)
        ? completed.filter((d) => d !== iso)
        : [...completed, iso],
    }

    await onSaveSIP(updatedSIP)
  }

  // Build year view configuration
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const config: YearViewConfig = useMemo(
    () => ({
      year,
      todayISO,
      onDaySelect: handleDaySelect,
      header: {
        icon: '💰',
        title: 'Finance',
        legends: [
          { label: 'Income', color: 'rgb(74, 222, 128)' },
          { label: 'Expense', color: 'rgb(248, 113, 113)' },
          { label: 'SIP', color: 'rgb(96, 165, 250)' },
        ],
        actions: [
          {
            id: 'add-sip',
            label: '+ SIP',
            onClick: () => setShowAddSIP(true),
            color: 'info' as const,
          },
          {
            id: 'add-budget',
            label: '+ Budget Plan',
            onClick: () => setShowAddBudget(true),
            color: 'success' as const,
          },
        ],
      },
      months: months.map((month) => {
        const monthBudgets = getMonthBudgets(year, month.month)
        const monthSIPs = getMonthSIPs(year, month.month)

        return {
          month: month.month,
          year: month.year,
          days: month.days.map((day) => {
            const info = getDayInfo(day.iso)
            const indicators = []
            if (info.hasSIP) indicators.push({ type: 'sip' as const })
            if (info.hasIncome) indicators.push({ type: 'income' as const })
            if (info.hasExpense) indicators.push({ type: 'expense' as const })

            return {
              iso: day.iso,
              dayOfMonth: day.dayOfMonth,
              weekdayIndex: day.weekdayIndex,
              indicators,
            }
          }),
          footer: [
            ...monthBudgets.map((budget) => {
              const remaining = getBudgetRemaining(budget)
              const isOverBudget = remaining < 0

              return {
                id: budget.id,
                type: 'budget' as const,
                title: budget.name,
                subtitle: `₹${budget.income.toLocaleString('en-IN')} • ${
                  isOverBudget
                    ? `₹${Math.abs(remaining).toLocaleString('en-IN')} over`
                    : `₹${remaining.toLocaleString('en-IN')} left`
                }`,
                actionButton: {
                  icon: '👁️',
                  onClick: () => setViewingBudget(budget),
                },
              }
            }),
            ...monthSIPs.map((sip) => {
              const progress = getSIPMonthProgress(sip, year, month.month)

              return {
                id: sip.id,
                type: 'sip' as const,
                title: sip.name,
                subtitle: `₹${progress.amount.toLocaleString('en-IN')} / ₹${(
                  progress.amount + progress.pending
                ).toLocaleString('en-IN')} • ${progress.completed}/${
                  progress.totalInMonth
                } done`,
              }
            }),
          ],
        }
      }),
      modal: {
        getSections: (date: string) => {
          const details = dayDetails[date] || {}
          const daySips = getSIPsForDate(date)
          const expenses = details.expenses || []
          const income = details.income || []
          const activeBudget = getActiveBudget(date)

          const budgetExpenses = activeBudget
            ? allExpenses.filter((e) => e.budgetId === activeBudget.id)
            : []
          const budgetIncome = activeBudget
            ? allIncome.filter((i) => i.budgetId === activeBudget.id)
            : []
          const totalSpent = budgetExpenses.reduce(
            (sum, e) => sum + e.amount,
            0,
          )
          const totalEarned = budgetIncome.reduce((sum, i) => sum + i.amount, 0)
          const remaining = activeBudget
            ? activeBudget.income + totalEarned - totalSpent
            : 0

          const sections = []

          // Budget Summary Section - Simple button to view budget
          if (activeBudget) {
            sections.push({
              id: 'budget-summary',
              type: 'custom' as const,
              content: (
                <div className="rounded-xl border border-green-500/30 bg-linear-to-r from-green-500/10 to-emerald-500/10 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-lg">💵</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-white truncate">
                          {activeBudget.name}
                        </div>
                        <div className="text-xs text-white/60">
                          {new Date(activeBudget.startDate).toLocaleDateString(
                            'en-US',
                            { month: 'short', day: 'numeric' },
                          )}{' '}
                          →{' '}
                          {new Date(activeBudget.endDate).toLocaleDateString(
                            'en-US',
                            { month: 'short', day: 'numeric' },
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setViewingBudget(activeBudget)
                      }}
                      className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white text-sm font-medium border border-white/20 transition-all duration-150 whitespace-nowrap"
                    >
                      View Budget
                    </button>
                  </div>
                </div>
              ),
            })
          }

          // SIPs Section
          if (daySips.length > 0) {
            sections.push({
              id: 'sips',
              type: 'custom' as const,
              content: (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-white/60 uppercase tracking-wide">
                    SIP Investments
                  </h4>
                  {daySips.map((sip) => {
                    const done = sip.completedDates?.includes(date)
                    return (
                      <div
                        key={sip.id}
                        className="rounded-lg border border-white/10 bg-white/5 p-3"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="text-sm text-white">{sip.name}</div>
                            <div className="text-xs text-white/60">
                              ₹{sip.amount.toLocaleString('en-IN')} •{' '}
                              {sip.frequency}
                            </div>
                          </div>
                          <button
                            onClick={() => toggleSIPDone(sip.id, date)}
                            className={`px-3 py-1 rounded text-xs font-medium ${
                              done
                                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                : 'bg-white/10 text-white/70 border border-white/20'
                            }`}
                          >
                            {done ? '✓ Done' : 'Mark'}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ),
            })
          }

          // Expenses Section
          if (activeBudget && expenses.length > 0) {
            sections.push({
              id: 'expenses',
              type: 'custom' as const,
              content: (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-white/60 uppercase tracking-wide">
                    Expenses Today
                  </h4>
                  {expenses.map((e) => {
                    const category = activeBudget.categories.find(
                      (c) => c.id === e.categoryId,
                    )
                    const categoryExpenses = budgetExpenses.filter(
                      (ex) => ex.categoryId === e.categoryId,
                    )
                    const totalSpentInCategory = categoryExpenses.reduce(
                      (sum, ex) => sum + ex.amount,
                      0,
                    )
                    const categoryRemaining = category
                      ? category.allocatedAmount - totalSpentInCategory
                      : 0
                    const isOver = categoryRemaining < 0

                    return (
                      <div
                        key={e.id}
                        className={`rounded-lg border p-3 transition-colors ${
                          isOver
                            ? 'border-red-500/30 bg-red-500/10'
                            : 'border-white/10 bg-white/5'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-white font-medium">
                              {e.categoryName}
                            </div>
                            {e.description && (
                              <div className="text-xs text-white/60 mt-0.5 truncate">
                                {e.description}
                              </div>
                            )}
                            {category && (
                              <div
                                className={`text-[10px] mt-1.5 font-medium ${
                                  isOver ? 'text-red-400' : 'text-green-400'
                                }`}
                              >
                                {isOver ? (
                                  <>
                                    ⚠️ Over by ₹
                                    {Math.abs(categoryRemaining).toLocaleString(
                                      'en-IN',
                                    )}
                                  </>
                                ) : (
                                  <>
                                    ✓ ₹
                                    {categoryRemaining.toLocaleString('en-IN')}{' '}
                                    left in budget
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-red-400">
                              -₹{e.amount.toLocaleString('en-IN')}
                            </span>
                            <button
                              onClick={() => removeExpense(e)}
                              className="text-white/40 hover:text-red-400 transition-colors"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ),
            })
          }

          // Income Section
          if (activeBudget && income.length > 0) {
            sections.push({
              id: 'income',
              type: 'custom' as const,
              content: (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-white/60 uppercase tracking-wide">
                    Income Today
                  </h4>
                  {income.map((i) => (
                    <div
                      key={i.id}
                      className="rounded-lg border border-green-500/30 bg-green-500/5 p-3"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-white font-medium">
                            {i.categoryName}
                          </div>
                          {i.description && (
                            <div className="text-xs text-white/60 mt-0.5 truncate">
                              {i.description}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-green-400 font-semibold">
                            +₹{i.amount.toLocaleString('en-IN')}
                          </span>
                          <button
                            onClick={() => removeIncome(i)}
                            className="text-white/40 hover:text-red-400 transition-colors"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ),
            })
          }

          // No data message
          if (
            !activeBudget &&
            daySips.length === 0 &&
            expenses.length === 0 &&
            income.length === 0
          ) {
            sections.push({
              id: 'no-data',
              type: 'custom' as const,
              content: (
                <p className="text-sm text-white/40 text-center py-4">
                  No financial activity for this day
                </p>
              ),
            })
          }

          return sections
        },
        getActions: (date: string) => {
          const activeBudget = getActiveBudget(date)
          const actions: ButtonConfig[] = []

          if (activeBudget) {
            actions.push({
              id: 'add-expense',
              label: '+ Expense',
              onClick: () => {
                setShowAddExpense(true)
              },
              color: 'danger',
            })
            actions.push({
              id: 'add-income',
              label: '+ Income',
              onClick: () => {
                setShowAddIncome(true)
              },
              color: 'success',
            })
          }

          if (onJumpToDay) {
            actions.push({
              id: 'open-day',
              label: 'Open Day View',
              onClick: () => {
                onJumpToDay(date)
              },
              color: 'secondary',
            })
          }

          return actions
        },
      },
      onPrevYear,
      onNextYear,
    }),
    [
      year,
      todayISO,
      months,
      dayDetails,
      allExpenses,
      allIncome,
      onPrevYear,
      onNextYear,
      onJumpToDay,
      handleDaySelect,
      handleAddExpense,
      handleAddIncome,
    ],
  )

  return (
    <>
      <div className="space-y-4">
        <GenericYearView
          config={config}
          initialSelectedDay={initialSelectedDay}
        />

        {/* Lists */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-white mb-3">
              📈 SIPs ({sips.length})
            </h3>
            {sips.length === 0 ? (
              <p className="text-xs text-white/40">No SIPs scheduled</p>
            ) : (
              <div className="space-y-2">
                {sips.map((p) => (
                  <SIPCard
                    key={p.id}
                    sip={p}
                    onRemove={() => removeSIP(p)}
                    onUpdateFromNow={() => updateSIPFromNow(p)}
                  />
                ))}
              </div>
            )}
          </Card>

          <Card className="p-4">
            <h3 className="text-sm font-semibold text-white mb-3">
              💵 Budgets ({budgets.length})
            </h3>
            {budgets.length === 0 ? (
              <p className="text-xs text-white/40">No budgets created</p>
            ) : (
              <div className="space-y-2">
                {budgets.map((p) => (
                  <BudgetCard
                    key={p.id}
                    budget={p}
                    expenses={allExpenses.filter((e) => e.budgetId === p.id)}
                    onRemove={(type) => removeBudget(p, type)}
                    onUpdateFromNow={
                      p.isRecurring ? () => updateBudgetFromNow(p) : undefined
                    }
                  />
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Forms */}
      <Modal
        open={showAddSIP}
        onClose={() => setShowAddSIP(false)}
        title="Schedule SIP"
      >
        <SIPForm
          onSubmit={handleAddSIP}
          onCancel={() => setShowAddSIP(false)}
        />
      </Modal>

      <Modal
        open={showAddBudget}
        onClose={() => {
          setShowAddBudget(false)
          setEditingBudget(null)
        }}
        title={editingBudget ? 'Edit Budget' : 'Create Budget'}
      >
        <BudgetForm
          initialData={editingBudget || undefined}
          onSubmit={handleSaveBudget}
          onCancel={() => {
            setShowAddBudget(false)
            setEditingBudget(null)
          }}
          onView={
            editingBudget
              ? () => {
                  setViewingBudget(editingBudget)
                  setShowAddBudget(false)
                  setEditingBudget(null)
                }
              : undefined
          }
        />
      </Modal>

      {viewingBudget && (
        <Modal
          open={true}
          onClose={() => setViewingBudget(null)}
          title="Budget Details"
        >
          <BudgetViewModal
            budget={viewingBudget}
            expenses={(() => {
              // Get all expenses for this budget period
              const allExpenses: Expense[] = []
              const startDate = new Date(viewingBudget.startDate)
              const endDate = new Date(viewingBudget.endDate)
              const currentDate = new Date(startDate)

              while (currentDate <= endDate) {
                const isoDate = currentDate.toISOString().split('T')[0]
                const dayData = dayDetails[isoDate]
                if (dayData?.expenses) {
                  allExpenses.push(...dayData.expenses)
                }
                currentDate.setDate(currentDate.getDate() + 1)
              }

              return allExpenses
            })()}
            income={(() => {
              // Get all income for this budget period
              const allIncome: Income[] = []
              const startDate = new Date(viewingBudget.startDate)
              const endDate = new Date(viewingBudget.endDate)
              const currentDate = new Date(startDate)

              while (currentDate <= endDate) {
                const isoDate = currentDate.toISOString().split('T')[0]
                const dayData = dayDetails[isoDate]
                if (dayData?.income) {
                  allIncome.push(...dayData.income)
                }
                currentDate.setDate(currentDate.getDate() + 1)
              }

              return allIncome
            })()}
            onEdit={() => {
              setEditingBudget(viewingBudget)
              setViewingBudget(null)
              setShowAddBudget(true)
            }}
            onClose={() => setViewingBudget(null)}
          />
        </Modal>
      )}

      {selectedDay && (
        <>
          <Modal
            open={showAddExpense}
            onClose={() => setShowAddExpense(false)}
            title="Add Expense"
          >
            <ExpenseForm
              date={selectedDay}
              categories={getActiveBudget(selectedDay)?.categories || []}
              availableBudgets={budgets.filter(
                (b) => selectedDay >= b.startDate && selectedDay <= b.endDate,
              )}
              activeBudgetId={getActiveBudget(selectedDay)?.id}
              onSubmit={handleAddExpense}
              onCancel={() => setShowAddExpense(false)}
            />
          </Modal>

          <Modal
            open={showAddIncome}
            onClose={() => setShowAddIncome(false)}
            title="Add Income"
          >
            <IncomeForm
              date={selectedDay}
              categories={getActiveBudget(selectedDay)?.categories || []}
              availableBudgets={budgets.filter(
                (b) => selectedDay >= b.startDate && selectedDay <= b.endDate,
              )}
              activeBudgetId={getActiveBudget(selectedDay)?.id}
              onSubmit={handleAddIncome}
              onCancel={() => setShowAddIncome(false)}
            />
          </Modal>
        </>
      )}
    </>
  )
}
