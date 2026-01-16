export type AddonId = 'calendar' | 'productivity' | 'hours' | 'finance' | 'travel' | 'agenda' | 'analytics'

export type AddonCategory = {
  id: AddonId
  name: string
  icon: string
  isPrimary: boolean
  subItems?: AddonSubItem[]
}

export type AddonSubItem = {
  id: string
  name: string
  route: string
  icon?: string
}

export type GoalAddonsConfig = {
  enabled: AddonId[]
}

export type AddonDefinition = {
  id: AddonId
  name: string
  icon: string
  description: string
  route: (goalId: string, year?: number) => string
  isPrimary: boolean
  subModules?: string[]
}
