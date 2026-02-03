'use client'

import { useState, useRef, useEffect } from 'react'

interface MultiSelectDropdownProps<T> {
  items: T[]
  selectedIds: Set<string>
  getItemId: (item: T) => string
  getItemLabel: (item: T) => string
  getItemColor?: (item: T) => string | undefined
  onToggle: (itemId: string) => void
  onSelectAll: () => void
  onClearAll: () => void
  label: string
  icon?: string
}

export function MultiSelectDropdown<T>({
  items,
  selectedIds,
  getItemId,
  getItemLabel,
  getItemColor,
  onToggle,
  onSelectAll,
  onClearAll,
  label,
  icon = '🔽',
}: MultiSelectDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedCount = selectedIds.size
  const allSelected = selectedCount === items.length
  const noneSelected = selectedCount === 0

  const getDisplayText = () => {
    if (allSelected) return `All ${label.toLowerCase()}`
    if (noneSelected) return `No ${label.toLowerCase()}`
    return `${selectedCount} selected`
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="
          flex items-center gap-1.5 rounded-lg
          bg-white/5 hover:bg-white/8
          border border-white/10 hover:border-white/20
          text-white transition-all duration-200
          px-2 py-1 text-xs
        "
      >
        <span className="text-sm">{icon}</span>
        <span className="font-medium">{getDisplayText()}</span>
        <span className="text-white/40 text-[10px]">▼</span>
      </button>

      {isOpen && (
        <div
          className="
            absolute top-full left-0 mt-2 z-50
            min-w-[220px] max-w-[300px]
            bg-[#1c1c1e] backdrop-blur-xl
            border border-white/20
            rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.8)]
            overflow-hidden
          "
        >
          {/* Quick Actions */}
          <div className="p-2 border-b border-white/10 flex gap-2">
            <button
              onClick={() => {
                onSelectAll()
              }}
              className="
                flex-1 px-2 py-1.5 rounded-lg text-xs
                bg-white/5 hover:bg-white/10
                text-white/70 hover:text-white
                transition-all duration-200
              "
            >
              Select All
            </button>
            <button
              onClick={() => {
                onClearAll()
              }}
              className="
                flex-1 px-2 py-1.5 rounded-lg text-xs
                bg-white/5 hover:bg-white/10
                text-white/70 hover:text-white
                transition-all duration-200
              "
            >
              Clear All
            </button>
          </div>

          {/* Items List */}
          <div className="p-2 space-y-1 max-h-[300px] overflow-y-auto">
            {items.map((item) => {
              const itemId = getItemId(item)
              const itemLabel = getItemLabel(item)
              const itemColor = getItemColor?.(item)
              const isSelected = selectedIds.has(itemId)

              return (
                <button
                  key={itemId}
                  onClick={() => onToggle(itemId)}
                  className="
                    w-full flex items-center gap-2 px-2 py-1.5 rounded-lg
                    hover:bg-white/8 text-white transition-all duration-200
                    text-xs
                  "
                >
                  {itemColor && (
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: itemColor }}
                    />
                  )}
                  <span className="flex-1 text-left font-medium">{itemLabel}</span>
                  {isSelected && (
                    <span className="text-[#007AFF] text-base">✓</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
