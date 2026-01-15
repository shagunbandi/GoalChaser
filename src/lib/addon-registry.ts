import type { AddonDefinition, AddonId } from '@/types/addon-config'

export const ADDON_REGISTRY: Record<AddonId, AddonDefinition> = {
  calendar: {
    id: 'calendar',
    name: 'Calendar',
    icon: '📅',
    description: 'Daily planning and task management',
    route: (goalId) => `/goal/${goalId}`,
    isPrimary: true,
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
  analytics: {
    id: 'analytics',
    name: 'Analytics',
    icon: '📊',
    description: 'Charts and productivity insights',
    route: (goalId) => `/goal/${goalId}/analytics`,
    isPrimary: false,
  },
}
