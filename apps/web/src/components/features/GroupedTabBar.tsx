/**
 * GroupedTabBar - Navigation tabs for switching between plugins
 * 
 * Uses Next.js Link components for optimal performance with:
 * - Automatic prefetching
 * - Instant client-side navigation
 * - Browser history management
 */

'use client'

import Link from 'next/link'
import { useState, useRef, useEffect, useMemo } from 'react'
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
  const [openDropdown, setOpenDropdown] = useState<AddonId | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const mobileMenuRef = useRef<HTMLDivElement>(null)
  const { registry, loading } = usePluginRegistry()

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpenDropdown(null)
      }
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node)
      ) {
        setMobileMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Build addon categories with proper routes
  const addons = useMemo<AddonCategory[]>(() => {
    if (loading) return []

    return [
    // Core tabs - always visible
    {
      id: 'calendar' as AddonId,
      name: 'Calendar',
      icon: '📅',
      isPrimary: true,
        route: `/goal/${goalId}`,
    },
    {
      id: 'insights' as AddonId,
      name: 'Insights',
      icon: '📈',
      isPrimary: true,
        route: `/goal/${goalId}/insights`,
    },
      // Enabled plugins
    ...enabledAddons
      .map((addonId) => {
        const plugin = registry.getPlugin(addonId)
        if (!plugin) return null

          const firstRoute = plugin.routes[0]
          const mainRoute = firstRoute?.requiresYear
            ? `/goal/${goalId}/${plugin.id}/${currentYear}`
            : `/goal/${goalId}/${plugin.id}`

        const category: AddonCategory = {
          id: plugin.id as AddonId,
          name: plugin.metadata.name,
          icon: plugin.metadata.icon,
          isPrimary: plugin.metadata.isPrimary,
            route: mainRoute,
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
  }, [loading, goalId, currentYear, enabledAddons, registry])

  // Handle dropdown toggle for items with sub-items
  const handleDropdownToggle = (addonId: AddonId) => {
    setOpenDropdown(openDropdown === addonId ? null : addonId)
  }

  // Close menus after navigation
  const handleNavigationClick = () => {
    setOpenDropdown(null)
    setMobileMenuOpen(false)
  }

  // Get current addon info for mobile display
  const currentAddonInfo = addons.find((a) => a.id === currentAddon)

  return (
    <>
      {/* Desktop: Horizontal scrollable tab bar */}
      <div
        className="hidden md:flex items-center justify-between"
        ref={dropdownRef}
      >
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
        {addons.map((addon, index) => {
          const isActive = currentAddon === addon.id
          const hasDropdown = addon.subItems && addon.subItems.length > 0
          const isDropdownOpen = openDropdown === addon.id
            const isLastPrimary =
              addon.isPrimary &&
              (index === addons.length - 1 || !addons[index + 1]?.isPrimary)

          return (
              <div key={addon.id} className="flex items-center gap-1 shrink-0">
              <div className="relative">
                  {/* Use Link for items without dropdowns, button for dropdown toggles */}
                  {hasDropdown ? (
                <button
                      onClick={() => handleDropdownToggle(addon.id)}
                  className={`
                    flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl 
                        transition-all duration-150 whitespace-nowrap
                    ${
                      isActive
                        ? 'bg-white/90 text-black shadow-[0_0_16px_rgba(255,255,255,0.25)]'
                        : 'text-white/70 hover:bg-white/10'
                    }
                  `}
                >
                  <span>{addon.icon}</span>
                  <span>{addon.name}</span>
                    <svg
                        className={`w-4 h-4 transition-transform ${
                          isDropdownOpen ? 'rotate-180' : ''
                        }`}
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
                    </button>
                  ) : (
                    <Link
                      href={addon.route!}
                      onClick={handleNavigationClick}
                      className={`
                        flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl 
                        transition-all duration-150 whitespace-nowrap
                        ${
                          isActive
                            ? 'bg-white/90 text-black shadow-[0_0_16px_rgba(255,255,255,0.25)]'
                            : 'text-white/70 hover:bg-white/10'
                        }
                      `}
                      prefetch={true}
                    >
                      <span>{addon.icon}</span>
                      <span>{addon.name}</span>
                    </Link>
                  )}

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
                        <Link
                        key={subItem.id}
                          href={subItem.route}
                          onClick={handleNavigationClick}
                        className="
                            block w-full px-4 py-3 text-left text-sm text-white/80
                          hover:bg-white/10 hover:text-white
                          transition-colors duration-150
                        "
                          prefetch={true}
                      >
                          <div className="flex items-center gap-2">
                        {subItem.icon && <span>{subItem.icon}</span>}
                        <span>{subItem.name}</span>
                          </div>
                        </Link>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Separator after primary addons */}
                {isLastPrimary && <div className="h-6 w-px bg-white/20 mx-2" />}
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
            flex items-center gap-1 shrink-0
          "
        >
          <span className="text-lg">+</span>
          <span className="hidden lg:inline">Add-ons</span>
        </button>
      </div>

      {/* Mobile: Dropdown menu */}
      <div className="md:hidden relative" ref={mobileMenuRef}>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="
            flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-xl
            bg-white/10 text-white/90 w-full justify-between
            hover:bg-white/20 transition-all duration-150
          "
        >
          <div className="flex items-center gap-2">
            <span>{currentAddonInfo?.icon || '📅'}</span>
            <span>{currentAddonInfo?.name || 'Menu'}</span>
          </div>
          <svg
            className={`w-5 h-5 transition-transform ${
              mobileMenuOpen ? 'rotate-180' : ''
            }`}
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
        </button>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div
            className="
              absolute top-full left-0 right-0 mt-2
              bg-black/95 backdrop-blur-xl border border-white/10
              rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]
              overflow-hidden z-50 max-h-[70vh] overflow-y-auto
            "
          >
            {addons.map((addon, index) => {
              const isActive = currentAddon === addon.id
              const hasSubItems = addon.subItems && addon.subItems.length > 0
              const isLastPrimary =
                addon.isPrimary &&
                (index === addons.length - 1 || !addons[index + 1]?.isPrimary)

              return (
                <div key={addon.id}>
                  <Link
                    href={addon.route!}
                    onClick={handleNavigationClick}
                    className={`
                      w-full px-4 py-3 text-left text-sm
                      flex items-center gap-3
                      transition-colors duration-150
                      ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'text-white/80 hover:bg-white/10 hover:text-white'
                      }
                    `}
                    prefetch={true}
                  >
                    <span className="text-lg">{addon.icon}</span>
                    <span className="flex-1">{addon.name}</span>
                    {hasSubItems && (
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    )}
                  </Link>

                  {/* Sub-items */}
                  {hasSubItems &&
                    addon.subItems!.map((subItem) => (
                      <Link
                        key={subItem.id}
                        href={subItem.route}
                        onClick={handleNavigationClick}
                        className="
                          block w-full px-4 py-2 pl-12 text-left text-sm text-white/70
                          hover:bg-white/10 hover:text-white
                          transition-colors duration-150
                        "
                        prefetch={true}
                      >
                        <div className="flex items-center gap-2">
                          {subItem.icon && <span>{subItem.icon}</span>}
                          <span>{subItem.name}</span>
                        </div>
                      </Link>
                    ))}

                  {/* Separator */}
                  {isLastPrimary && (
                    <div className="h-px bg-white/10 my-2 mx-4" />
                  )}
                </div>
              )
            })}

            {/* Add-ons button in mobile menu */}
            <button
              onClick={() => {
                onManageAddons()
                setMobileMenuOpen(false)
              }}
              className="
                w-full px-4 py-3 text-left text-sm text-white/80
                hover:bg-white/10 hover:text-white
                transition-colors duration-150
                flex items-center gap-3 border-t border-white/10
        "
      >
        <span className="text-lg">+</span>
              <span>Manage Add-ons</span>
      </button>
    </div>
        )}
      </div>
    </>
  )
}
