'use client'

import { useRouter } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import type { AddonId, AddonCategory } from '@/types/addon-config'
import { usePluginRegistry } from '@/core/plugin-registry/hooks'

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
  const { registry, loading } = usePluginRegistry()

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

  // Build addon categories: Core tabs first (Calendar, Analytics), then enabled plugins
  const addons: AddonCategory[] = loading ? [] : [
    // Core tabs - always visible
    {
      id: 'calendar' as AddonId,
      name: 'Calendar',
      icon: '📅',
      isPrimary: true,
    },
    {
      id: 'analytics' as AddonId,
      name: 'Analytics',
      icon: '📊',
      isPrimary: true,
    },
    // Then show enabled plugins
    ...enabledAddons
      .map((addonId) => {
        const plugin = registry.getPlugin(addonId)
        if (!plugin) return null

        const category: AddonCategory = {
          id: plugin.id as AddonId,
          name: plugin.metadata.name,
          icon: plugin.metadata.icon,
          isPrimary: plugin.metadata.isPrimary,
        }

        // Add sub-items from routes if they exist
        if (plugin.routes && plugin.routes.length > 1) {
          category.subItems = plugin.routes.map((route) => ({
            id: route.path,
            name: route.path.charAt(0).toUpperCase() + route.path.slice(1),
            route: `/goal/${goalId}/${plugin.id}/${route.path}`,
          }))
        }

        return category
      })
      .filter((addon): addon is AddonCategory => addon !== null),
  ]

  const handleTabClick = (addon: AddonCategory) => {
    // If has sub-items, toggle dropdown
    if (addon.subItems && addon.subItems.length > 0) {
      setOpenDropdown(openDropdown === addon.id ? null : addon.id)
    } else {
      // Core tabs have special routes
      if (addon.id === 'calendar') {
        router.push(`/goal/${goalId}`)
        setOpenDropdown(null)
        return
      }
      
      if (addon.id === 'analytics') {
        router.push(`/goal/${goalId}/analytics`)
        setOpenDropdown(null)
        return
      }
      
      // Navigate to plugin
      const plugin = registry.getPlugin(addon.id)
      if (plugin && plugin.routes.length > 0) {
        const route = plugin.routes[0]
        const path = route.requiresYear 
          ? `/goal/${goalId}/${plugin.id}/${currentYear}`
          : `/goal/${goalId}/${plugin.id}`
        router.push(path)
      }
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
