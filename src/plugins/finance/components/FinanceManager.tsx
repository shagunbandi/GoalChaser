'use client'

import { useState } from 'react'
import { Drawer } from '@/sdk'
import { BudgetForm } from './BudgetForm'
import { SIPForm } from './SIPForm'
import type { BudgetPlan, SIPPlan, BudgetCategory, SIPFrequency } from '../types'

interface FinanceManagerProps {
  isOpen: boolean
  budgets: BudgetPlan[]
  sips: SIPPlan[]
  onSaveBudget: (budget: BudgetPlan) => Promise<void>
  onSaveBudgets: (budgets: BudgetPlan[]) => Promise<void>
  onDeleteBudget: (budgetId: string) => Promise<void>
  onSaveSIP: (sip: SIPPlan) => Promise<void>
  onDeleteSIP: (sipId: string) => Promise<void>
  onClose: () => void
}

type Tab = 'budgets' | 'sips'

export function FinanceManager({
  isOpen,
  budgets,
  sips,
  onSaveBudget,
  onSaveBudgets,
  onDeleteBudget,
  onSaveSIP,
  onDeleteSIP,
  onClose,
}: FinanceManagerProps) {
  const [activeTab, setActiveTab] = useState<Tab>('budgets')
  const [showAddBudget, setShowAddBudget] = useState(false)
  const [showAddSIP, setShowAddSIP] = useState(false)
  const [editingBudget, setEditingBudget] = useState<BudgetPlan | null>(null)
  const [editingSIP, setEditingSIP] = useState<SIPPlan | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'budget' | 'sip'; id: string } | null>(null)

  // Handle budget form submission
  const handleSaveBudget = async (data: {
    name: string
    income: number
    categories: BudgetCategory[]
    startMonth: number
    startYear: number
    repeatCount: number
    note: string
  }) => {
    if (editingBudget) {
      // Update existing budget
      await onSaveBudget({
        ...editingBudget,
        name: data.name,
        income: data.income,
        categories: data.categories,
        note: data.note,
      })
      setEditingBudget(null)
    } else {
      // Create new budget(s)
      let currentMonth = data.startMonth
      let currentYear = data.startYear
      const parentId = `budget_${Date.now()}`
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      const newBudgets: BudgetPlan[] = []

      for (let i = 0; i < data.repeatCount; i++) {
        const monthIndex = currentMonth + 1
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
        const startDateISO = `${currentYear}-${String(monthIndex).padStart(2, '0')}-01`
        const endDateISO = `${currentYear}-${String(monthIndex).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`

        const budgetName = data.repeatCount > 1
          ? `${data.name} - ${monthNames[currentMonth]} ${currentYear}`
          : data.name

        newBudgets.push({
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
        })

        currentMonth++
        if (currentMonth > 11) {
          currentMonth = 0
          currentYear++
        }
      }

      if (newBudgets.length > 1) {
        await onSaveBudgets(newBudgets)
      } else if (newBudgets.length === 1) {
        await onSaveBudget(newBudgets[0])
      }
    }
    setShowAddBudget(false)
  }

  // Handle SIP form submission
  const handleSaveSIP = async (data: {
    name: string
    amount: number
    frequency: SIPFrequency
    startDate: string
    endDate: string
    expectedReturn?: number
    color: string
    note: string
  }) => {
    if (editingSIP) {
      await onSaveSIP({
        ...editingSIP,
        ...data,
      })
      setEditingSIP(null)
    } else {
      await onSaveSIP({
        id: `sip_${Date.now()}`,
        ...data,
        completedDates: [],
      })
    }
    setShowAddSIP(false)
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return
    if (deleteConfirm.type === 'budget') {
      await onDeleteBudget(deleteConfirm.id)
    } else {
      await onDeleteSIP(deleteConfirm.id)
    }
    setDeleteConfirm(null)
  }

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Manage Finance"
      subtitle={`${budgets.length} budgets, ${sips.length} SIPs`}
      icon="💰"
      iconGradient="from-[#30D158] to-[#34C759]"
    >
      {/* Tabs */}
      <div className="px-6 sm:px-8 pt-6 border-b border-white/5">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('budgets')}
            className={`
              flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all
              ${activeTab === 'budgets'
                ? 'bg-[#30D158]/20 text-[#30D158] border border-[#30D158]/30'
                : 'bg-white/5 text-white/60 hover:bg-white/10 border border-transparent'
              }
            `}
          >
            📊 Budgets ({budgets.length})
          </button>
          <button
            onClick={() => setActiveTab('sips')}
            className={`
              flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all
              ${activeTab === 'sips'
                ? 'bg-[#007AFF]/20 text-[#007AFF] border border-[#007AFF]/30'
                : 'bg-white/5 text-white/60 hover:bg-white/10 border border-transparent'
              }
            `}
          >
            📈 SIPs ({sips.length})
          </button>
        </div>
      </div>

      {/* Add Button */}
      {!showAddBudget && !showAddSIP && !editingBudget && !editingSIP && (
        <div className="p-6 sm:p-8 border-b border-white/5">
          <button
            onClick={() => activeTab === 'budgets' ? setShowAddBudget(true) : setShowAddSIP(true)}
            className={`
              w-full px-6 py-4 font-semibold rounded-xl shadow-lg transition-all duration-200
              hover:scale-[1.02] active:scale-[0.98] text-sm
              ${activeTab === 'budgets'
                ? 'bg-gradient-to-r from-[#30D158] to-[#34C759] shadow-[#30D158]/25'
                : 'bg-gradient-to-r from-[#007AFF] to-[#5856D6] shadow-[#007AFF]/25'
              }
              text-white
            `}
          >
            + Add New {activeTab === 'budgets' ? 'Budget' : 'SIP'}
          </button>
        </div>
      )}

      {/* Add/Edit Forms */}
      {(showAddBudget || editingBudget) && (
        <div className="p-6 sm:p-8 border-b border-white/5">
          <h3 className="text-lg font-semibold text-white mb-4">
            {editingBudget ? 'Edit Budget' : 'Add New Budget'}
          </h3>
          <BudgetForm
            initialData={editingBudget || undefined}
            onSubmit={handleSaveBudget}
            onCancel={() => {
              setShowAddBudget(false)
              setEditingBudget(null)
            }}
          />
        </div>
      )}

      {(showAddSIP || editingSIP) && (
        <div className="p-6 sm:p-8 border-b border-white/5">
          <h3 className="text-lg font-semibold text-white mb-4">
            {editingSIP ? 'Edit SIP' : 'Add New SIP'}
          </h3>
          <SIPForm
            initialData={editingSIP || undefined}
            onSubmit={handleSaveSIP}
            onCancel={() => {
              setShowAddSIP(false)
              setEditingSIP(null)
            }}
          />
        </div>
      )}

      {/* List */}
      <div className="px-6 sm:px-8 py-6 flex-1 overflow-y-auto">
        {activeTab === 'budgets' ? (
          budgets.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-white/5 to-white/[0.02] flex items-center justify-center border border-white/10">
                <span className="text-5xl opacity-50">📊</span>
              </div>
              <h3 className="text-lg font-semibold text-white/80 mb-2">No budgets yet</h3>
              <p className="text-sm text-white/40 max-w-xs mx-auto">
                Create your first budget to start tracking your finances
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {budgets.map((budget) => (
                <div
                  key={budget.id}
                  className="group bg-white/[0.04] hover:bg-white/[0.06] border border-white/10 hover:border-white/15 rounded-2xl p-4 sm:p-5 transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-lg font-semibold text-white truncate">{budget.name}</h4>
                      <div className="mt-2 space-y-1 text-sm text-white/60">
                        <div>💵 Income: ₹{budget.income.toLocaleString('en-IN')}</div>
                        <div>📅 {new Date(budget.startDate + 'T00:00:00').toLocaleDateString()} - {new Date(budget.endDate + 'T00:00:00').toLocaleDateString()}</div>
                        <div>📁 {budget.categories.length} categories</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        onClick={() => setEditingBudget(budget)}
                        className="p-2.5 rounded-xl text-white/40 hover:text-[#FF9500] hover:bg-[#FF9500]/10 transition-all"
                        title="Edit"
                      >
                        ✏️
                      </button>
                      {deleteConfirm?.type === 'budget' && deleteConfirm?.id === budget.id ? (
                        <div className="flex items-center gap-1 ml-1">
                          <button
                            onClick={handleDelete}
                            className="px-3 py-1.5 bg-[#FF3B30] hover:bg-[#FF3B30]/90 text-white text-sm font-medium rounded-lg transition-all"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="px-3 py-1.5 bg-white/10 hover:bg-white/15 text-white/70 text-sm rounded-lg transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm({ type: 'budget', id: budget.id })}
                          className="p-2.5 rounded-xl text-white/40 hover:text-[#FF3B30] hover:bg-[#FF3B30]/10 transition-all"
                          title="Delete"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          sips.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-white/5 to-white/[0.02] flex items-center justify-center border border-white/10">
                <span className="text-5xl opacity-50">📈</span>
              </div>
              <h3 className="text-lg font-semibold text-white/80 mb-2">No SIPs yet</h3>
              <p className="text-sm text-white/40 max-w-xs mx-auto">
                Create your first SIP to start tracking your investments
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {sips.map((sip) => (
                <div
                  key={sip.id}
                  className="group bg-white/[0.04] hover:bg-white/[0.06] border border-white/10 hover:border-white/15 rounded-2xl p-4 sm:p-5 transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        {sip.color && (
                          <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: sip.color }} />
                        )}
                        <h4 className="text-lg font-semibold text-white truncate">{sip.name}</h4>
                      </div>
                      <div className="space-y-1 text-sm text-white/60">
                        <div>💵 ₹{sip.amount.toLocaleString('en-IN')} / {sip.frequency}</div>
                        <div>📅 {new Date(sip.startDate + 'T00:00:00').toLocaleDateString()} - {new Date(sip.endDate + 'T00:00:00').toLocaleDateString()}</div>
                        {sip.expectedReturn && <div>📈 Expected: {sip.expectedReturn}%</div>}
                        {sip.note && <div className="text-white/50">📝 {sip.note}</div>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        onClick={() => setEditingSIP(sip)}
                        className="p-2.5 rounded-xl text-white/40 hover:text-[#FF9500] hover:bg-[#FF9500]/10 transition-all"
                        title="Edit"
                      >
                        ✏️
                      </button>
                      {deleteConfirm?.type === 'sip' && deleteConfirm?.id === sip.id ? (
                        <div className="flex items-center gap-1 ml-1">
                          <button
                            onClick={handleDelete}
                            className="px-3 py-1.5 bg-[#FF3B30] hover:bg-[#FF3B30]/90 text-white text-sm font-medium rounded-lg transition-all"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="px-3 py-1.5 bg-white/10 hover:bg-white/15 text-white/70 text-sm rounded-lg transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm({ type: 'sip', id: sip.id })}
                          className="p-2.5 rounded-xl text-white/40 hover:text-[#FF3B30] hover:bg-[#FF3B30]/10 transition-all"
                          title="Delete"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Footer */}
      <div className="p-6 sm:p-8 border-t border-white/5 shrink-0 bg-gradient-to-t from-black/20">
        <button
          onClick={onClose}
          className="w-full px-4 py-3.5 bg-white/10 hover:bg-white/15 text-white font-semibold rounded-xl transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] border border-white/10"
        >
          Done
        </button>
      </div>
    </Drawer>
  )
}
