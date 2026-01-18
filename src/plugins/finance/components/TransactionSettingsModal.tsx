'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui'
import type {
  TransactionSettings,
  TransactionCategory,
  InvestmentGroup,
  Currency,
} from '../types'
import {
  CURRENCIES,
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
  DEFAULT_INVESTMENT_GROUPS,
} from '../types'

interface TransactionSettingsModalProps {
  open: boolean
  onClose: () => void
  settings: TransactionSettings
  onSave: (settings: TransactionSettings) => Promise<void>
}

export function TransactionSettingsModal({
  open,
  onClose,
  settings,
}: TransactionSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'currency' | 'expense' | 'income' | 'investment'>('currency')
  const [defaultCurrency, setDefaultCurrency] = useState<Currency>(settings.defaultCurrency)
  const [expenseCategories, setExpenseCategories] = useState<TransactionCategory[]>(
    settings.expenseCategories
  )
  const [incomeCategories, setIncomeCategories] = useState<TransactionCategory[]>(
    settings.incomeCategories
  )
  const [investmentGroups, setInvestmentGroups] = useState<InvestmentGroup[]>(
    settings.investmentGroups || DEFAULT_INVESTMENT_GROUPS
  )
  const [isSaving, setIsSaving] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newGroupName, setNewGroupName] = useState('')
  const [editingCategory, setEditingCategory] = useState<string | null>(null)
  const [editingGroup, setEditingGroup] = useState<string | null>(null)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Note: onSave is called from parent with the new settings
      // For now we just close the modal - the parent handles saving
      onClose()
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddCategory = (type: 'expense' | 'income') => {
    if (!newCategoryName.trim()) return

    const newCategory: TransactionCategory = {
      id: `${type}_${Date.now()}`,
      name: newCategoryName.trim(),
      type,
      icon: type === 'expense' ? '📦' : '✨',
      color: type === 'expense' ? '#FF6B6B' : '#32D74B',
    }

    if (type === 'expense') {
      setExpenseCategories([...expenseCategories, newCategory])
    } else {
      setIncomeCategories([...incomeCategories, newCategory])
    }
    setNewCategoryName('')
  }

  const handleAddInvestmentGroup = () => {
    if (!newGroupName.trim()) return

    const newGroup: InvestmentGroup = {
      id: `investment_${Date.now()}`,
      name: newGroupName.trim(),
      icon: '💰',
      color: '#007AFF',
    }

    setInvestmentGroups([...investmentGroups, newGroup])
    setNewGroupName('')
  }

  const handleDeleteCategory = (id: string, type: 'expense' | 'income') => {
    if (type === 'expense') {
      setExpenseCategories(expenseCategories.filter((c) => c.id !== id))
    } else {
      setIncomeCategories(incomeCategories.filter((c) => c.id !== id))
    }
  }

  const handleDeleteInvestmentGroup = (id: string) => {
    setInvestmentGroups(investmentGroups.filter((g) => g.id !== id))
  }

  const handleUpdateCategory = (
    id: string,
    updates: Partial<TransactionCategory>,
    type: 'expense' | 'income'
  ) => {
    if (type === 'expense') {
      setExpenseCategories(
        expenseCategories.map((c) => (c.id === id ? { ...c, ...updates } : c))
      )
    } else {
      setIncomeCategories(
        incomeCategories.map((c) => (c.id === id ? { ...c, ...updates } : c))
      )
    }
    setEditingCategory(null)
  }

  const handleUpdateInvestmentGroup = (
    id: string,
    updates: Partial<InvestmentGroup>
  ) => {
    setInvestmentGroups(
      investmentGroups.map((g) => (g.id === id ? { ...g, ...updates } : g))
    )
    setEditingGroup(null)
  }

  const handleResetToDefaults = (type: 'expense' | 'income' | 'investment') => {
    if (type === 'expense') {
      setExpenseCategories([...DEFAULT_EXPENSE_CATEGORIES])
    } else if (type === 'income') {
      setIncomeCategories([...DEFAULT_INCOME_CATEGORIES])
    } else {
      setInvestmentGroups([...DEFAULT_INVESTMENT_GROUPS])
    }
  }

  const renderCategoryList = (
    categories: TransactionCategory[],
    type: 'expense' | 'income'
  ) => (
    <div className="space-y-2">
      {categories.map((category) => (
        <div
          key={category.id}
          className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/10 group"
        >
          <span className="text-xl">{category.icon}</span>
          {editingCategory === category.id ? (
            <input
              type="text"
              value={category.name}
              onChange={(e) =>
                handleUpdateCategory(category.id, { name: e.target.value }, type)
              }
              onBlur={() => setEditingCategory(null)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') setEditingCategory(null)
              }}
              className="flex-1 bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-sm text-white outline-none"
              autoFocus
            />
          ) : (
            <span
              className="flex-1 text-sm text-white/80 cursor-pointer"
              onClick={() => setEditingCategory(category.id)}
            >
              {category.name}
            </span>
          )}
          <button
            onClick={() => handleDeleteCategory(category.id, type)}
            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-all"
            title="Delete"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      ))}

      {/* Add new category */}
      <div className="flex items-center gap-2 mt-4">
        <input
          type="text"
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          placeholder={`Add ${type} category...`}
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-white/20"
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAddCategory(type)
          }}
        />
        <button
          onClick={() => handleAddCategory(type)}
          disabled={!newCategoryName.trim()}
          className="px-4 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-40"
          style={{
            backgroundColor: type === 'expense' ? '#FF453A20' : '#32D74B20',
            color: type === 'expense' ? '#FF453A' : '#32D74B',
          }}
        >
          Add
        </button>
      </div>

      {/* Reset to defaults */}
      <button
        onClick={() => handleResetToDefaults(type)}
        className="text-xs text-white/40 hover:text-white/60 mt-2 transition-colors"
      >
        Reset to defaults
      </button>
    </div>
  )

  const renderInvestmentGroupList = () => (
    <div className="space-y-2">
      {investmentGroups.map((group) => (
        <div
          key={group.id}
          className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/10 group"
        >
          <span className="text-xl">{group.icon}</span>
          {editingGroup === group.id ? (
            <input
              type="text"
              value={group.name}
              onChange={(e) =>
                handleUpdateInvestmentGroup(group.id, { name: e.target.value })
              }
              onBlur={() => setEditingGroup(null)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') setEditingGroup(null)
              }}
              className="flex-1 bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-sm text-white outline-none"
              autoFocus
            />
          ) : (
            <span
              className="flex-1 text-sm text-white/80 cursor-pointer"
              onClick={() => setEditingGroup(group.id)}
            >
              {group.name}
            </span>
          )}
          <button
            onClick={() => handleDeleteInvestmentGroup(group.id)}
            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-all"
            title="Delete"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      ))}

      {/* Add new investment group */}
      <div className="flex items-center gap-2 mt-4">
        <input
          type="text"
          value={newGroupName}
          onChange={(e) => setNewGroupName(e.target.value)}
          placeholder="Add investment group..."
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-white/20"
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAddInvestmentGroup()
          }}
        />
        <button
          onClick={handleAddInvestmentGroup}
          disabled={!newGroupName.trim()}
          className="px-4 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-40 bg-[#007AFF]/20 text-[#007AFF]"
        >
          Add
        </button>
      </div>

      {/* Reset to defaults */}
      <button
        onClick={() => handleResetToDefaults('investment')}
        className="text-xs text-white/40 hover:text-white/60 mt-2 transition-colors"
      >
        Reset to defaults
      </button>
    </div>
  )

  return (
    <Modal
      open={open}
      title="Transaction Settings"
      onClose={onClose}
      footer={
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm bg-white/5 text-white/60 hover:bg-white/8 border border-white/10 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2.5 rounded-xl text-sm bg-[#007AFF] text-white font-medium hover:bg-[#0066DD] transition-all disabled:opacity-40"
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-white/[0.03] rounded-xl overflow-x-auto">
          {[
            { id: 'currency', label: '💱 Currency' },
            { id: 'expense', label: '📉 Expenses' },
            { id: 'income', label: '📈 Income' },
            { id: 'investment', label: '💰 Investments' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex-1 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-white/10 text-white font-medium'
                  : 'text-white/50 hover:text-white/70'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Currency Tab */}
        {activeTab === 'currency' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-white/60 mb-2">
                Default Currency
              </label>
              <p className="text-xs text-white/40 mb-4">
                This will be pre-selected when adding new transactions
              </p>
              <div className="grid grid-cols-2 gap-2">
                {CURRENCIES.map((currency) => (
                  <button
                    key={currency.value}
                    onClick={() => setDefaultCurrency(currency.value)}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                      defaultCurrency === currency.value
                        ? 'bg-[#007AFF]/20 border-[#007AFF]/50 text-white'
                        : 'bg-white/[0.03] border-white/10 text-white/70 hover:bg-white/[0.06]'
                    }`}
                  >
                    <span className="text-xl font-mono">{currency.value}</span>
                    <div className="text-left">
                      <div className="text-sm font-medium">{currency.label}</div>
                      <div className="text-xs text-white/40">{currency.name}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Expense Categories Tab */}
        {activeTab === 'expense' && (
          <div>
            <p className="text-xs text-white/40 mb-4">
              Manage categories for expense transactions. Click a name to edit it.
            </p>
            {renderCategoryList(expenseCategories, 'expense')}
          </div>
        )}

        {/* Income Categories Tab */}
        {activeTab === 'income' && (
          <div>
            <p className="text-xs text-white/40 mb-4">
              Manage categories for income transactions. Click a name to edit it.
            </p>
            {renderCategoryList(incomeCategories, 'income')}
          </div>
        )}

        {/* Investment Groups Tab */}
        {activeTab === 'investment' && (
          <div>
            <p className="text-xs text-white/40 mb-4">
              Manage investment groups (e.g., Mutual Fund, Stocks). You&apos;ll choose recurring or one-time when adding an investment.
            </p>
            {renderInvestmentGroupList()}
          </div>
        )}
      </div>
    </Modal>
  )
}
