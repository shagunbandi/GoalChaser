import type { AddonDefinition, AddonId } from '@/types/addon-config'

export const ADDON_REGISTRY: Record<AddonId, AddonDefinition> = {
  calendar: {
    id: 'calendar',
    name: 'Calendar',
    icon: '📅',
    description: 'Daily notes and summary view',
    route: (goalId) => `/goal/${goalId}`,
    isPrimary: true,
  },
  productivity: {
    id: 'productivity',
    name: 'Productivity',
    icon: '📊',
    description: 'Track daily productivity (1-10 scale)',
    route: (goalId, year) => `/goal/${goalId}/productivity/${year || new Date().getFullYear()}`,
    isPrimary: false,
  },
  hours: {
    id: 'hours',
    name: 'Hours',
    icon: '⏱️',
    description: 'Track hours spent per day',
    route: (goalId, year) => `/goal/${goalId}/hours/${year || new Date().getFullYear()}`,
    isPrimary: false,
  },
  finance: {
    id: 'finance',
    name: 'Finance',
    icon: '💰',
    description: 'Budget tracking and financial planning',
    route: (goalId, year) => `/goal/${goalId}/finance/${year || new Date().getFullYear()}`,
    isPrimary: false,
  },
  travel: {
    id: 'travel',
    name: 'Travel',
    icon: '✈️',
    description: 'Travel plans and itineraries',
    route: (goalId, year) => `/goal/${goalId}/travel/${year || new Date().getFullYear()}`,
    isPrimary: false,
  },
  agenda: {
    id: 'agenda',
    name: 'Agenda',
    icon: '📋',
    description: 'Plan and track daily agenda items',
    route: (goalId, year) => `/goal/${goalId}/agenda/${year || new Date().getFullYear()}`,
    isPrimary: false,
  },
  analytics: {
    id: 'analytics',
    name: 'Analytics',
    icon: '📈',
    description: 'Charts and insights',
    route: (goalId) => `/goal/${goalId}/analytics`,
    isPrimary: false,
  },
}

/**
 * Get all primary addons (always enabled, cannot be disabled)
 */
export function getPrimaryAddons(): AddonId[] {
  return Object.values(ADDON_REGISTRY)
    .filter(addon => addon.isPrimary)
    .map(addon => addon.id)
}

/**
 * Get all manageable addons (can be enabled/disabled by user)
 */
export function getManageableAddons(): AddonId[] {
  return Object.values(ADDON_REGISTRY)
    .filter(addon => !addon.isPrimary)
    .map(addon => addon.id)
}
