'use client'

import { useMemo, useState } from 'react'
import { HeaderRenderer } from '@/components/features/year-view/renderers/HeaderRenderer'
import { AreaManager } from './AreaManager'
import { buildProductivityHeaderConfig } from '../utils/header-config'
import type { ProductivityDayData, AreaConfig } from '../types'

interface ProductivityHeaderProps {
  year: number
  dayData: Record<string, ProductivityDayData>
  areaConfigs: AreaConfig[]
  onPrevYear: () => void
  onNextYear: () => void
  onAddArea: (name: string) => void
  onRemoveArea: (id: string) => void
  onUpdateArea: (id: string, name: string) => void
  onToggleHasTopics: (id: string) => void
  onAddTopic: (areaId: string, topic: string) => void
  onRemoveTopic: (areaId: string, topic: string) => void
  onUpdateTopic: (areaId: string, oldTopic: string, newTopic: string) => void
  isTopicInUse: (areaId: string, topic: string) => boolean
}

export function ProductivityHeader({
  year,
  dayData,
  areaConfigs,
  onPrevYear,
  onNextYear,
  onAddArea,
  onRemoveArea,
  onUpdateArea,
  onToggleHasTopics,
  onAddTopic,
  onRemoveTopic,
  onUpdateTopic,
  isTopicInUse,
}: ProductivityHeaderProps) {

  const [showAreaManager, setShowAreaManager] = useState(false)

  const headerConfig = useMemo(() => {
    return buildProductivityHeaderConfig(
      dayData,
      'year',
      () => setShowAreaManager(true),
    )
  }, [dayData])

  if (!headerConfig) return null

  return (
    <>
      <HeaderRenderer
        config={headerConfig}
        year={year}
        onPrevYear={onPrevYear}
        onNextYear={onNextYear}
      />

      {showAreaManager && (
        <AreaManager
          isOpen={showAreaManager}
          areaConfigs={areaConfigs}
          onAddArea={onAddArea}
          onRemoveArea={onRemoveArea}
          onUpdateArea={onUpdateArea}
          onToggleHasTopics={onToggleHasTopics}
          onAddTopic={onAddTopic}
          onRemoveTopic={onRemoveTopic}
          onUpdateTopic={onUpdateTopic}
          isTopicInUse={isTopicInUse}
          onClose={() => setShowAreaManager(false)}
        />
      )}
    </>
  )
}
