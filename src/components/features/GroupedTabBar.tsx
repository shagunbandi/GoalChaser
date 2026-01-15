'use client'

import { useRouter } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import type { AddonId, AddonCategory } from '@/types/addon-config'
import { ADDON_REGISTRY } from '@/lib/addon-registry'

interface GroupedTabBarProps {
  goalId: string
  currentAddon: AddonId
  currentYear: number
  enabledAddons: AddonId[]
  onManageAddons: () => void
}

export function GroupedTabBar({
  goalId,
  currentAddon,
  currentYear,
  enabledAddons,
  onManageAddons,
}: GroupedTabBarProps) {
  const router = useRouter()
  const [openDropdown, setOpenDropdown] = useState<AddonId | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Build addon categories from registry, sorted with primary addons first
  const addons: AddonCategory[] = enabledAddons
    .map((addonId) => {
      const def = ADDON_REGISTRY[addonId]
      if (!def) return null

      const category: AddonCategory = {
        id: def.id,
        name: def.name,
        icon: def.icon,
        isPrimary: def.isPrimary,
      }

      // Add sub-items if they exist
      if (def.subModules && def.subModules.length > 0) {
        category.subItems = def.subModules.map((module) => ({
          id: module,
          name: module.charAt(0).toUpperCase() + module.slice(1),
          route: `${def.route(goalId, currentYear)}/${module}`,
        }))
      }

      return category
    })
    .filter((addon): addon is AddonCategory => addon !== null)
    .sort((a, b) => {
      // Primary addons (calendar) come first
      if (a.isPrimary && !b.isPrimary) return -1
      if (!a.isPrimary && b.isPrimary) return 1
      return 0
    })

  const handleTabClick = (addon: AddonCategory) => {
    // If has sub-items, toggle dropdown
    if (addon.subItems && addon.subItems.length > 0) {
      setOpenDropdown(openDropdown === addon.id ? null : addon.id)
    } else {
      // Navigate directly
      const def = ADDON_REGISTRY[addon.id]
      router.push(def.route(goalId, currentYear))
      setOpenDropdown(null)
    }
  }

  const handleSubItemClick = (route: string) => {
    router.push(route)
    setOpenDropdown(null)
  }

  return (
    <div className="flex items-center justify-between" ref={dropdownRef}>
      {/* Tab buttons */}
      <div className="flex items-center gap-1">
        {addons.map((addon, index) => {
          const isActive = currentAddon === addon.id
          const hasDropdown = addon.subItems && addon.subItems.length > 0
          const isDropdownOpen = openDropdown === addon.id
          const isLastPrimary = addon.isPrimary && (index === addons.length - 1 || !addons[index + 1]?.isPrimary)

          return (
            <div key={addon.id} className="flex items-center gap-1">
              <div className="relative">
                <button
                  onClick={() => handleTabClick(addon)}
                  className={`
                    flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl 
                    transition-all duration-150
                    ${
                      isActive
                        ? 'bg-white/90 text-black shadow-[0_0_16px_rgba(255,255,255,0.25)]'
                        : 'text-white/70 hover:bg-white/10'
                    }
                  `}
                >
                  <span>{addon.icon}</span>
                  <span>{addon.name}</span>
                  {hasDropdown && (
                    <svg
                      className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  )}
                </button>

                {/* Dropdown menu */}
                {hasDropdown && isDropdownOpen && (
                  <div
                    className="
                      absolute top-full left-0 mt-2 min-w-[180px]
                      bg-black/90 backdrop-blur-xl border border-white/10
                      rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]
                      overflow-hidden z-50
                    "
                  >
                    {addon.subItems!.map((subItem) => (
                      <button
                        key={subItem.id}
                        onClick={() => handleSubItemClick(subItem.route)}
                        className="
                          w-full px-4 py-3 text-left text-sm text-white/80
                          hover:bg-white/10 hover:text-white
                          transition-colors duration-150
                          flex items-center gap-2
                        "
                      >
                        {subItem.icon && <span>{subItem.icon}</span>}
                        <span>{subItem.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Separator after primary addons */}
              {isLastPrimary && (
                <div className="h-6 w-px bg-white/20 mx-2" />
              )}
            </div>
          )
        })}
      </div>

      {/* Add-ons button */}
      <button
        onClick={onManageAddons}
        className="
          px-3 py-2 text-sm font-medium text-white/70
          hover:text-white hover:bg-white/10
          rounded-xl transition-all duration-150
          flex items-center gap-1
        "
      >
        <span className="text-lg">+</span>
        <span className="hidden sm:inline">Add-ons</span>
      </button>
    </div>
  )
}
