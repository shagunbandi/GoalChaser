'use client'

import { MultiSelectDropdown } from '@goal-chaser/sdk'
import type { AreaConfig } from '../types'

interface AreaFilterProps {
  areas: AreaConfig[]
  selectedAreas: Set<string>
  onToggleArea: (areaId: string) => void
  onSelectAllAreas: () => void
  onClearAllAreas: () => void
}

export function AreaFilter({
  areas,
  selectedAreas,
  onToggleArea,
  onSelectAllAreas,
  onClearAllAreas,
}: AreaFilterProps) {
  return (
    <MultiSelectDropdown
      items={areas}
      selectedIds={selectedAreas}
      getItemId={(a) => a.id}
      getItemLabel={(a) => a.name}
      getItemColor={(a) => a.color}
      onToggle={onToggleArea}
      onSelectAll={onSelectAllAreas}
      onClearAll={onClearAllAreas}
      label="Areas"
      icon="🎯"
    />
  )
}
