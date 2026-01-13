'use client'

import { useMemo, useState } from 'react'
import type { DayDetails, SIPPlan, BudgetPlan, SIPFrequency, Expense } from '@/types'
import { Card, Modal } from '@/components/ui'
import { SIPForm, SIPCard, BudgetForm, BudgetCard, ExpenseForm } from './budgeting'
import { MONTH_NAMES, WEEKDAY_LABELS } from '@/constants'
import { computeMonthInfo, formatDateDisplay, enumerateDateRange } from '@/utils'
import { generateSIPDates } from '@/lib/utils/sip-utils'
import { generateBudgetPeriods } from '@/lib/utils/budget-utils'

interface BudgetingViewProps {
  year: number
  todayISO: string
  dayDetails: Record<string, DayDetails>
  onPrevYear: () => void
  onNextYear: () => void
  onUpdateDay: (iso: string, updates: Partial<DayDetails>) => Promise<void>
  onJumpToDay?: (iso: string) => void
}

export function BudgetingView({
  year,
  todayISO,
  dayDetails,
  onPrevYear,
  onNextYear,
  onUpdateDay,
  onJumpToDay,
}: BudgetingViewProps) {
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [showAddSIP, setShowAddSIP] = useState(false)
  const [showAddBudget, setShowAddBudget] = useState(false)
  const [editingBudget, setEditingBudget] = useState<BudgetPlan | null>(null)
  const [showAddExpense, setShowAddExpense] = useState(false)

  const months = useMemo(
    () => Array.from({ length: 12 }, (_, i) => computeMonthInfo(year, i + 1)),
    [year],
  )

  // Get unique SIP plans
  const sipPlans = useMemo(() => {
    const plans = new Map<string, SIPPlan & { days: string[] }>()
    Object.entries(dayDetails).forEach(([iso, details]) => {
      details.sipPlans?.forEach((plan) => {
        if (!plans.has(plan.id)) {
          plans.set(plan.id, { ...plan, days: [] })
        }
        plans.get(plan.id)!.days.push(iso)
      })
    })
    return Array.from(plans.values()).sort((a, b) => a.startDate.localeCompare(b.startDate))
  }, [dayDetails])

  // Get unique budget plans
  const budgetPlans = useMemo(() => {
    const plans = new Map<string, BudgetPlan & { days: string[] }>()
    Object.entries(dayDetails).forEach(([iso, details]) => {
      details.budgetPlans?.forEach((plan) => {
        if (!plans.has(plan.id)) {
          plans.set(plan.id, { ...plan, days: [] })
        }
        plans.get(plan.id)!.days.push(iso)
      })
    })
    return Array.from(plans.values()).sort((a, b) => a.startDate.localeCompare(b.startDate))
  }, [dayDetails])

  // Get all expenses
  const allExpenses = useMemo(() => {
    const expenses: Expense[] = []
    Object.values(dayDetails).forEach((details) => {
      if (details.expenses) expenses.push(...details.expenses)
    })
    return expenses
  }, [dayDetails])

  // Check what's on a day
  const getDayInfo = (iso: string) => {
    const details = dayDetails[iso] || {}
    const hasSIP = (details.sipPlans?.length || 0) > 0
    const hasExpense = (details.expenses?.length || 0) > 0
    const hasBudget = (details.budgetPlans?.length || 0) > 0
    return { hasSIP, hasExpense, hasBudget }
  }

  // Get active budget for expense form
  const getActiveBudget = (iso: string) => {
    return budgetPlans.find((b) => iso >= b.startDate && iso <= b.endDate)
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

    const dates = generateSIPDates(data.startDate, data.endDate, data.frequency)
    await Promise.all(
      dates.map((iso) => {
        const existing = dayDetails[iso]?.sipPlans || []
        return onUpdateDay(iso, { sipPlans: [...existing, newPlan] })
      }),
    )
    setShowAddSIP(false)
  }

  // Add or Update Budget
  const handleSaveBudget = async (data: {
    name: string
    income: number
    categories: BudgetPlan['categories']
    frequency: 'one-time' | 'monthly' | 'weekly'
    startDate?: string
    endDate?: string
    startDay?: number
    firstPeriodStart?: string
    durationType?: 'count' | 'endDate'
    durationValue?: number | string
    note: string
  }) => {
    if (editingBudget) {
      // Update existing budget (simplified - just update the one period)
      const updatedPlan: BudgetPlan = { 
        ...editingBudget, 
        name: data.name,
        income: data.income,
        categories: data.categories,
        note: data.note,
      }
      
      // Remove old budget from old days
      const oldDates = enumerateDateRange(editingBudget.startDate, editingBudget.endDate)
      await Promise.all(
        oldDates.map((iso) => {
          const existing = dayDetails[iso]?.budgetPlans || []
          return onUpdateDay(iso, {
            budgetPlans: existing.filter((p) => p.id !== editingBudget.id),
          })
        }),
      )

      // Add updated budget to old days (keep same dates)
      const newDates = enumerateDateRange(editingBudget.startDate, editingBudget.endDate)
      await Promise.all(
        newDates.map((iso) => {
          const existing = dayDetails[iso]?.budgetPlans || []
          return onUpdateDay(iso, { budgetPlans: [...existing, updatedPlan] })
        }),
      )

      setEditingBudget(null)
    } else {
      // Create new budget (supports recurring)
      const budgetPeriods = generateBudgetPeriods({
        name: data.name,
        income: data.income,
        categories: data.categories,
        frequency: data.frequency,
        startDay: data.startDay || 1,
        firstPeriodStart: data.frequency === 'one-time' ? data.startDate! : data.firstPeriodStart!,
        duration: {
          type: data.frequency === 'one-time' ? 'endDate' : data.durationType!,
          value: data.frequency === 'one-time' ? data.endDate! : data.durationValue!,
        },
        note: data.note,
      })

      // Add all budget periods to their respective days
      for (const period of budgetPeriods) {
        const dates = enumerateDateRange(period.startDate, period.endDate)
        await Promise.all(
          dates.map((iso) => {
            const existing = dayDetails[iso]?.budgetPlans || []
            return onUpdateDay(iso, { budgetPlans: [...existing, period] })
          }),
        )
      }
    }
    
    setShowAddBudget(false)
  }

  // Add Expense
  const handleAddExpense = async (data: {
    categoryId: string
    categoryName: string
    amount: number
    description: string
    date: string
    budgetId?: string
  }) => {
    const newExpense: Expense = { id: `expense_${Date.now()}`, ...data }
    const existing = dayDetails[data.date]?.expenses || []
    await onUpdateDay(data.date, { expenses: [...existing, newExpense] })
    setShowAddExpense(false)
    setSelectedDay(null)
  }

  // Remove handlers
  const removeSIP = async (plan: SIPPlan & { days: string[] }) => {
    if (!confirm(`Remove SIP "${plan.name}"?`)) return
    await Promise.all(
      plan.days.map((iso) => {
        const existing = dayDetails[iso]?.sipPlans || []
        return onUpdateDay(iso, { sipPlans: existing.filter((p) => p.id !== plan.id) })
      }),
    )
  }

  const removeBudget = async (plan: BudgetPlan & { days: string[] }) => {
    if (!confirm(`Remove budget "${plan.name}"?`)) return
    await Promise.all(
      plan.days.map((iso) => {
        const existing = dayDetails[iso]?.budgetPlans || []
        return onUpdateDay(iso, { budgetPlans: existing.filter((p) => p.id !== plan.id) })
      }),
    )
  }

  const removeExpense = async (expense: Expense) => {
    const existing = dayDetails[expense.date]?.expenses || []
    await onUpdateDay(expense.date, { expenses: existing.filter((e) => e.id !== expense.id) })
  }

  const toggleSIPDone = async (planId: string, iso: string) => {
    const existing = dayDetails[iso]?.sipPlans || []
    const updated = existing.map((p) => {
      if (p.id !== planId) return p
      const completed = p.completedDates || []
      return {
        ...p,
        completedDates: completed.includes(iso)
          ? completed.filter((d) => d !== iso)
          : [...completed, iso],
      }
    })
    await onUpdateDay(iso, { sipPlans: updated })
  }

  return (
    <>
      <div className="space-y-4">
        {/* Header */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button onClick={onPrevYear} className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 text-sm">
                ←
              </button>
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <span>💰</span>
                <span>Budgeting {year}</span>
              </h2>
              <button onClick={onNextYear} className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 text-sm">
                →
              </button>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowAddSIP(true)} className="px-3 py-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 text-sm border border-blue-500/30">
                + SIP
              </button>
              <button onClick={() => setShowAddBudget(true)} className="px-3 py-1.5 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-300 text-sm border border-green-500/30">
                + Budget
              </button>
            </div>
          </div>
        </Card>

        {/* Calendar */}
        <Card className="p-4">
          <div className="mb-3 flex flex-wrap gap-3 text-xs text-white/60">
            <span className="font-medium">Legend:</span>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <span>Budget</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-red-400" />
              <span>Expense</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-blue-400" />
              <span>SIP</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {months.map((month) => {
              const offset = month.days[0]?.weekdayIndex || 0

              return (
                <div key={month.month} className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="text-sm font-semibold text-white mb-2">
                    {MONTH_NAMES[month.month - 1]}
                  </div>

                  <div className="grid grid-cols-7 gap-1 mb-1">
                    {WEEKDAY_LABELS.map((label) => (
                      <div key={label} className="text-[10px] text-center text-white/40">
                        {label}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: offset }).map((_, i) => (
                      <div key={`empty-${i}`} className="h-7" />
                    ))}
                    {month.days.map((day) => {
                      const isToday = day.iso === todayISO
                      const info = getDayInfo(day.iso)
                      const hasAny = info.hasSIP || info.hasExpense || info.hasBudget

                      return (
                        <button
                          key={day.iso}
                          onClick={() => setSelectedDay(day.iso)}
                          className={`
                            h-7 rounded text-[11px] border relative
                            ${isToday ? 'ring-1 ring-blue-400' : ''}
                            ${info.hasExpense ? 'bg-red-500/10 border-red-500/30' : info.hasBudget ? 'bg-green-500/10 border-green-500/30' : 'bg-transparent border-white/10'}
                            hover:bg-white/10 transition-colors text-white/80
                          `}
                        >
                          {day.dayOfMonth}
                          {hasAny && (
                            <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5">
                              {info.hasSIP && <div className="w-1 h-1 rounded-full bg-blue-400" />}
                              {info.hasBudget && <div className="w-1 h-1 rounded-full bg-green-400" />}
                              {info.hasExpense && <div className="w-1 h-1 rounded-full bg-red-400" />}
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Lists */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-white mb-3">📈 SIPs ({sipPlans.length})</h3>
            {sipPlans.length === 0 ? (
              <p className="text-xs text-white/40">No SIPs scheduled</p>
            ) : (
              <div className="space-y-2">
                {sipPlans.map((p) => (
                  <SIPCard key={p.id} sip={p} onRemove={() => removeSIP(p)} />
                ))}
              </div>
            )}
          </Card>

          <Card className="p-4">
            <h3 className="text-sm font-semibold text-white mb-3">💵 Budgets ({budgetPlans.length})</h3>
            {budgetPlans.length === 0 ? (
              <p className="text-xs text-white/40">No budgets created</p>
            ) : (
              <div className="space-y-2">
                {budgetPlans.map((p) => (
                  <BudgetCard
                    key={p.id}
                    budget={p}
                    expenses={allExpenses.filter((e) => e.budgetId === p.id)}
                    onRemove={() => removeBudget(p)}
                  />
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Day Modal */}
      {selectedDay && (
        <Modal open={true} onClose={() => setSelectedDay(null)} title={formatDateDisplay(selectedDay)}>
          <div className="space-y-3">
            {(() => {
              const details = dayDetails[selectedDay] || {}
              const sips = details.sipPlans || []
              const expenses = details.expenses || []
              const budgets = details.budgetPlans || []
              const activeBudget = getActiveBudget(selectedDay)

              // Calculate total spent for active budget
              const budgetExpenses = activeBudget 
                ? allExpenses.filter(e => e.budgetId === activeBudget.id)
                : []
              const totalSpent = budgetExpenses.reduce((sum, e) => sum + e.amount, 0)
              const remaining = activeBudget ? activeBudget.income - totalSpent : 0

              return (
                <>
                  {/* Budget Summary Card */}
                  {activeBudget && (
                    <div className="rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 p-4">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div>
                          <div className="text-base font-semibold text-white flex items-center gap-2">
                            <span>💵</span>
                            <span>{activeBudget.name}</span>
                          </div>
                          <div className="text-xs text-white/60 mt-1">
                            {new Date(activeBudget.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} → {new Date(activeBudget.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-white/70">Total Spent:</span>
                          <span className="text-white font-medium">₹{totalSpent.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/70">Remaining:</span>
                          <span className="text-green-400 font-semibold">₹{remaining.toLocaleString('en-IN')}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setEditingBudget(activeBudget)
                          setShowAddBudget(true)
                        }}
                        className="w-full mt-3 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs border border-white/20"
                      >
                        See Budget
                      </button>
                    </div>
                  )}

                  {/* SIPs */}
                  {sips.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-white/60 uppercase tracking-wide">SIP Investments</h4>
                      {sips.map((sip) => {
                        const done = sip.completedDates?.includes(selectedDay)
                        return (
                          <div key={sip.id} className="rounded-lg border border-white/10 bg-white/5 p-3">
                            <div className="flex justify-between items-center">
                              <div>
                                <div className="text-sm text-white">{sip.name}</div>
                                <div className="text-xs text-white/60">₹{sip.amount.toLocaleString('en-IN')} • {sip.frequency}</div>
                              </div>
                              <button
                                onClick={() => toggleSIPDone(sip.id, selectedDay)}
                                className={`px-3 py-1 rounded text-xs font-medium ${done ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-white/10 text-white/70 border border-white/20'}`}
                              >
                                {done ? '✓ Done' : 'Mark'}
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Expenses for This Day */}
                  {activeBudget && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-white/60 uppercase tracking-wide">Expenses Today</h4>
                      {expenses.length === 0 ? (
                        <p className="text-xs text-white/40 py-2">No expenses recorded</p>
                      ) : (
                        expenses.map((e) => (
                          <div key={e.id} className="rounded-lg border border-white/10 bg-white/5 p-3">
                            <div className="flex justify-between items-start gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="text-sm text-white font-medium">{e.categoryName}</div>
                                {e.description && <div className="text-xs text-white/60 mt-0.5 truncate">{e.description}</div>}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-red-400 font-semibold">-₹{e.amount.toLocaleString('en-IN')}</span>
                                <button onClick={() => removeExpense(e)} className="text-white/40 hover:text-red-400 transition-colors">✕</button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  {activeBudget && (
                    <button
                      onClick={() => setShowAddExpense(true)}
                      className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-red-500 to-orange-500 hover:shadow-[0_0_20px_rgba(239,68,68,0.3)] text-white text-sm font-medium transition-all"
                    >
                      + Add Expense
                    </button>
                  )}

                  {onJumpToDay && (
                    <button 
                      onClick={() => onJumpToDay(selectedDay)} 
                      className="w-full px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 border border-white/15 text-white text-sm transition-all"
                    >
                      Open Day View
                    </button>
                  )}

                  {!activeBudget && sips.length === 0 && expenses.length === 0 && (
                    <p className="text-sm text-white/40 text-center py-4">
                      No financial activity for this day
                    </p>
                  )}
                </>
              )
            })()}
          </div>
        </Modal>
      )}

      {/* Forms */}
      <Modal open={showAddSIP} onClose={() => setShowAddSIP(false)} title="Schedule SIP">
        <SIPForm onSubmit={handleAddSIP} onCancel={() => setShowAddSIP(false)} />
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
        />
      </Modal>

      {selectedDay && showAddExpense && (
        <Modal open={true} onClose={() => setShowAddExpense(false)} title="Add Expense">
          <ExpenseForm
            date={selectedDay}
            categories={getActiveBudget(selectedDay)?.categories || []}
            activeBudgetId={getActiveBudget(selectedDay)?.id}
            onSubmit={handleAddExpense}
            onCancel={() => setShowAddExpense(false)}
          />
        </Modal>
      )}
    </>
  )
}
