'use client'

import { useState } from 'react'
import { Modal } from '@goal-chaser/sdk'
import type { Expense, Income, TransactionCategory, Currency } from '../types'
import { CURRENCIES, DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from '../types'
import { isRecurringTransaction } from '../utils/recurring-utils'

export type EditAction = 'edit_single' | 'edit_upcoming' | 'delete_single' | 'delete_upcoming'

export interface EditedTransactionData {
  amount: number
  currency: Currency
  description: string
  categoryId: string
  categoryName: string
}

interface EditTransactionModalProps {
  open: boolean
  onClose: () => void
  transaction: Expense | Income
  type: 'expense' | 'income'
  onAction: (action: EditAction, editedData?: EditedTransactionData) => void
  mode: 'edit' | 'delete'
  expenseCategories?: TransactionCategory[]
  incomeCategories?: TransactionCategory[]
  defaultCurrency?: Currency
}

export function EditTransactionModal({
  open,
  onClose,
  transaction,
  type,
  onAction,
  mode,
  expenseCategories = DEFAULT_EXPENSE_CATEGORIES,
  incomeCategories = DEFAULT_INCOME_CATEGORIES,
  defaultCurrency = '₹',
}: EditTransactionModalProps) {
  const [selectedAction, setSelectedAction] = useState<EditAction | null>(null)
  const [showEditForm, setShowEditForm] = useState(false)
  
  // Edit form state
  const [amount, setAmount] = useState(String(transaction.amount))
  const [currency, setCurrency] = useState<Currency>(transaction.currency || defaultCurrency)
  const [description, setDescription] = useState(transaction.description)
  const [categoryId, setCategoryId] = useState(transaction.categoryId)
  
  const isRecurring = isRecurringTransaction(transaction)
  const typeLabel = type === 'expense' ? 'Expense' : 'Income'
  const modeLabel = mode === 'edit' ? 'Edit' : 'Delete'
  const accentColor = type === 'expense' ? '#FF453A' : '#32D74B'
  const categories = type === 'expense' ? expenseCategories : incomeCategories

  const handleConfirm = () => {
    if (!selectedAction) return
    
    if (mode === 'edit') {
      // Show edit form for edit actions
      setShowEditForm(true)
    } else {
      // Delete actions go straight through
      onAction(selectedAction)
      onClose()
    }
  }

  const handleEditSubmit = () => {
    if (!selectedAction) return
    
    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) return
    
    const category = categories.find(c => c.id === categoryId)
    const editedData: EditedTransactionData = {
      amount: amountNum,
      currency,
      description,
      categoryId,
      categoryName: category?.name || transaction.categoryName,
    }
    
    onAction(selectedAction, editedData)
    onClose()
  }

  const resetForm = () => {
    setShowEditForm(false)
    setSelectedAction(null)
    setAmount(String(transaction.amount))
    setCurrency(transaction.currency || defaultCurrency)
    setDescription(transaction.description)
    setCategoryId(transaction.categoryId)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  // Edit form view
  if (showEditForm && mode === 'edit') {
    return (
      <Modal
        open={open}
        title={`Edit ${typeLabel}`}
        onClose={handleClose}
        footer={
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setShowEditForm(false)}
              className="px-4 py-2.5 rounded-xl text-sm bg-white/[0.05] text-white/60 hover:bg-white/[0.08] border border-white/10 transition-all"
            >
              Back
            </button>
            <button
              onClick={handleEditSubmit}
              className="px-4 py-2.5 rounded-xl text-sm text-white font-medium transition-all"
              style={{ backgroundColor: accentColor }}
            >
              Save Changes
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-white/50">
            {selectedAction === 'edit_single' 
              ? 'Editing just this occurrence' 
              : 'Editing this and all future occurrences'}
          </p>
          
          {/* Category */}
          <div className="space-y-1">
            <label className="text-xs text-white/60">Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-[#007AFF]/50"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* Amount with Currency */}
          <div className="space-y-1">
            <label className="text-xs text-white/60">Amount</label>
            <div className="flex gap-2">
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
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-[#007AFF]/50"
                min="0.01"
                step="0.01"
              />
            </div>
          </div>
          
          {/* Description */}
          <div className="space-y-1">
            <label className="text-xs text-white/60">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-[#007AFF]/50"
              placeholder="Description"
            />
          </div>
        </div>
      </Modal>
    )
  }

  // For non-recurring, go straight to single action
  if (!isRecurring) {
    const singleAction = mode === 'edit' ? 'edit_single' : 'delete_single'
    
    // For edit mode, show the form directly
    if (mode === 'edit') {
      return (
        <Modal
          open={open}
          title={`Edit ${typeLabel}`}
          onClose={handleClose}
          footer={
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleClose}
                className="px-4 py-2.5 rounded-xl text-sm bg-white/[0.05] text-white/60 hover:bg-white/[0.08] border border-white/10 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const amountNum = parseFloat(amount)
                  if (isNaN(amountNum) || amountNum <= 0) return
                  const category = categories.find(c => c.id === categoryId)
                  onAction(singleAction, {
                    amount: amountNum,
                    currency,
                    description,
                    categoryId,
                    categoryName: category?.name || transaction.categoryName,
                  })
                  handleClose()
                }}
                className="px-4 py-2.5 rounded-xl text-sm text-white font-medium transition-all"
                style={{ backgroundColor: accentColor }}
              >
                Save Changes
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            {/* Category */}
            <div className="space-y-1">
              <label className="text-xs text-white/60">Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-[#007AFF]/50"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Amount with Currency */}
            <div className="space-y-1">
              <label className="text-xs text-white/60">Amount</label>
              <div className="flex gap-2">
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
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-[#007AFF]/50"
                  min="0.01"
                  step="0.01"
                />
              </div>
            </div>
            
            {/* Description */}
            <div className="space-y-1">
              <label className="text-xs text-white/60">Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-[#007AFF]/50"
                placeholder="Description"
              />
            </div>
          </div>
        </Modal>
      )
    }
    
    // Delete confirmation for non-recurring
    return (
      <Modal
        open={open}
        title={`${modeLabel} ${typeLabel}`}
        onClose={handleClose}
        footer={
          <div className="flex gap-3 justify-end">
            <button
              onClick={handleClose}
              className="px-4 py-2.5 rounded-xl text-sm bg-white/[0.05] text-white/60 hover:bg-white/[0.08] border border-white/10 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onAction(singleAction)
                handleClose()
              }}
              className="px-4 py-2.5 rounded-xl text-sm text-white font-medium transition-all"
              style={{
                backgroundColor: mode === 'delete' ? '#FF453A' : accentColor,
              }}
            >
              {modeLabel} {typeLabel}
            </button>
          </div>
        }
      >
        <div className="text-white/70">
          <p className="mb-4">
            Are you sure you want to {mode} this {type}?
          </p>
          <div
            className="p-4 rounded-xl border"
            style={{
              backgroundColor: `${accentColor}10`,
              borderColor: `${accentColor}30`,
            }}
          >
            <div className="font-medium text-white">{transaction.description || 'No description'}</div>
            <div className="text-sm mt-1" style={{ color: accentColor }}>
              {transaction.currency || defaultCurrency}{transaction.amount.toLocaleString('en-IN')}
            </div>
            <div className="text-xs text-white/40 mt-1">
              {transaction.categoryName} • {transaction.date}
            </div>
          </div>
        </div>
      </Modal>
    )
  }

  // For recurring transactions, show options
  const options: { value: EditAction; label: string; description: string }[] =
    mode === 'edit'
      ? [
          {
            value: 'edit_single',
            label: 'Edit just this occurrence',
            description: 'Only this occurrence will be modified. It will no longer be part of the recurring series.',
          },
          {
            value: 'edit_upcoming',
            label: 'Edit this and all future occurrences',
            description: 'This and all future occurrences will be updated with the new values.',
          },
        ]
      : [
          {
            value: 'delete_single',
            label: 'Delete just this occurrence',
            description: 'Only this occurrence will be removed. Other occurrences will remain.',
          },
          {
            value: 'delete_upcoming',
            label: 'Delete this and all future occurrences',
            description: 'This and all future occurrences will be permanently removed.',
          },
        ]

  return (
    <Modal
      open={open}
      title={`${modeLabel} Recurring ${typeLabel}`}
      onClose={handleClose}
      footer={
        <div className="flex gap-3 justify-end">
          <button
            onClick={handleClose}
            className="px-4 py-2.5 rounded-xl text-sm bg-white/[0.05] text-white/60 hover:bg-white/[0.08] border border-white/10 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedAction}
            className="px-4 py-2.5 rounded-xl text-sm text-white font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              backgroundColor: mode === 'delete' ? '#FF453A' : accentColor,
            }}
          >
            {mode === 'edit' ? 'Continue' : 'Delete'}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Transaction Preview */}
        <div
          className="p-4 rounded-xl border"
          style={{
            backgroundColor: `${accentColor}10`,
            borderColor: `${accentColor}30`,
          }}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">🔄</span>
            <span className="text-sm text-white/50">Recurring {type}</span>
          </div>
          <div className="font-medium text-white mt-2">{transaction.description || 'No description'}</div>
          <div className="text-sm mt-1" style={{ color: accentColor }}>
            {transaction.currency || defaultCurrency}{transaction.amount.toLocaleString('en-IN')} • {transaction.frequency}
          </div>
          <div className="text-xs text-white/40 mt-1">
            {transaction.categoryName} • {transaction.date}
            {transaction.endDate && ` → ${transaction.endDate}`}
          </div>
        </div>

        {/* Options */}
        <div className="space-y-3">
          <p className="text-sm text-white/60">How would you like to proceed?</p>
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => setSelectedAction(option.value)}
              className={`
                w-full text-left p-4 rounded-xl border transition-all
                ${
                  selectedAction === option.value
                    ? 'border-white/30 bg-white/[0.08]'
                    : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05]'
                }
              `}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`
                    w-5 h-5 rounded-full border-2 flex items-center justify-center
                    ${
                      selectedAction === option.value
                        ? 'border-white bg-white'
                        : 'border-white/30'
                    }
                  `}
                >
                  {selectedAction === option.value && (
                    <div className="w-2 h-2 rounded-full bg-[#0b0b12]" />
                  )}
                </div>
                <div>
                  <div className="font-medium text-white">{option.label}</div>
                  <div className="text-xs text-white/50 mt-0.5">
                    {option.description}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </Modal>
  )
}
