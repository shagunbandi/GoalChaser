'use client'

import { useState, useEffect, useMemo } from 'react'
import type { AIWizardFlowProps } from '@/sdk'
import type { ProductivityDayData, ProductivityConfig, AreaEntry, AreaConfig } from '../types'
import { StatusSelector } from './StatusSelector'
import { AreaEntries } from './AreaEntries'

interface ProductivityWizardFlowProps extends AIWizardFlowProps<ProductivityDayData, ProductivityConfig> {}

type WizardStep = 'confirm-new-areas' | 'confirm-new-topics' | 'edit-data'

interface NewTopicInfo {
  areaName: string
  areaId: string
  topics: string[]
}


/**
 * Wizard flow for reviewing AI-extracted productivity data
 * Step 1: Confirm which new areas to create (if any)
 * Step 2: Confirm which new topics to add (if any)
 * Step 3: Edit the data using existing components
 */
export function ProductivityWizardFlow({
  extractedData,
  config,
  existingDayData,
  onComplete,
  onSkip,
  onUpdateConfig,
}: ProductivityWizardFlowProps) {
  // Local config state for immediate updates
  const [localAreaConfigs, setLocalAreaConfigs] = useState<AreaConfig[]>(
    config?.areas ?? []
  )

  // Sync with config prop changes
  useEffect(() => {
    if (config?.areas) {
      setLocalAreaConfigs(config.areas)
    }
  }, [config?.areas])

  // Detect new areas from extracted data that don't exist in config
  // AI should already match similar names, so we just check for exact matches
  const newAreasFromAI = useMemo(() => {
    const extractedAreas = extractedData.areas ?? []
    return extractedAreas
      .map(a => a.area)
      .filter(areaName => 
        !localAreaConfigs.some(c => c.name.toLowerCase() === areaName.toLowerCase())
      )
      .filter((name, index, arr) => arr.indexOf(name) === arr.lastIndexOf(name)) // unique
  }, [extractedData.areas, localAreaConfigs])

  // Track which new areas user has selected to create
  const [selectedNewAreas, setSelectedNewAreas] = useState<Set<string>>(
    () => new Set(newAreasFromAI)
  )

  // Track which areas were actually created (persists across steps)
  const [createdAreaNames, setCreatedAreaNames] = useState<Set<string>>(new Set())

  // Current wizard step
  const [currentStep, setCurrentStep] = useState<WizardStep>(() => {
    if (newAreasFromAI.length > 0) {
      return 'confirm-new-areas'
    }
    return 'confirm-new-topics'
  })
  const [isProcessing, setIsProcessing] = useState(false)

  // Detect new topics after areas are confirmed
  const [newTopicsFromAI, setNewTopicsFromAI] = useState<NewTopicInfo[]>([])
  const [selectedNewTopics, setSelectedNewTopics] = useState<Map<string, Set<string>>>(new Map())

  // Data state for the edit step
  const [status, setStatus] = useState<number | null>(
    extractedData.status ?? existingDayData?.status ?? null
  )
  const [areas, setAreas] = useState<AreaEntry[]>([])

  // Compute new topics when moving to that step
  const computeNewTopics = (configs: AreaConfig[]) => {
    const extractedAreas = extractedData.areas ?? []
    const newTopics: NewTopicInfo[] = []
    const initialSelection = new Map<string, Set<string>>()

    for (const extracted of extractedAreas) {
      const areaConfig = configs.find(c => c.name.toLowerCase() === extracted.area.toLowerCase())
      if (areaConfig && areaConfig.hasTopics !== false) {
        const existingTopics = areaConfig.topics.map(t => t.toLowerCase())
        const newTopicsForArea = (extracted.topics ?? []).filter(
          t => !existingTopics.includes(t.toLowerCase())
        )
        if (newTopicsForArea.length > 0) {
          newTopics.push({
            areaName: areaConfig.name,
            areaId: areaConfig.id,
            topics: newTopicsForArea,
          })
          initialSelection.set(areaConfig.id, new Set(newTopicsForArea))
        }
      }
    }

    setNewTopicsFromAI(newTopics)
    setSelectedNewTopics(initialSelection)
    return newTopics.length > 0
  }

  // Toggle new area selection
  const toggleNewArea = (areaName: string) => {
    setSelectedNewAreas(prev => {
      const next = new Set(prev)
      if (next.has(areaName)) {
        next.delete(areaName)
      } else {
        next.add(areaName)
      }
      return next
    })
  }

  // Toggle new topic selection
  const toggleNewTopic = (areaId: string, topic: string) => {
    setSelectedNewTopics(prev => {
      const next = new Map(prev)
      const areaTopics = next.get(areaId) ?? new Set()
      const newAreaTopics = new Set(areaTopics)
      if (newAreaTopics.has(topic)) {
        newAreaTopics.delete(topic)
      } else {
        newAreaTopics.add(topic)
      }
      next.set(areaId, newAreaTopics)
      return next
    })
  }

  // Handle confirming new areas
  const handleConfirmNewAreas = async () => {
    setIsProcessing(true)
    try {
      // Create selected new areas
      let newConfigs = [...localAreaConfigs]
      const newlyCreatedAreaNames = new Set<string>()
      
      for (const areaName of selectedNewAreas) {
        newConfigs.push({
          id: `area-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: areaName,
          topics: [],
          hasTopics: true,
        })
        newlyCreatedAreaNames.add(areaName)
      }
      
      if (selectedNewAreas.size > 0) {
        setLocalAreaConfigs(newConfigs)
        setCreatedAreaNames(prev => new Set([...prev, ...newlyCreatedAreaNames]))
        await onUpdateConfig({ areas: newConfigs })
      }

      // Check for new topics
      const hasNewTopics = computeNewTopics(newConfigs)
      if (hasNewTopics) {
        setCurrentStep('confirm-new-topics')
      } else {
        // Skip to edit step, prepare areas
        prepareAreasForEdit(newConfigs)
        setCurrentStep('edit-data')
      }
    } finally {
      setIsProcessing(false)
    }
  }

  // Skip new areas step
  const handleSkipNewAreas = () => {
    // Clear selected new areas (don't create them)
    setSelectedNewAreas(new Set())
    const hasNewTopics = computeNewTopics(localAreaConfigs)
    if (hasNewTopics) {
      setCurrentStep('confirm-new-topics')
    } else {
      prepareAreasForEdit(localAreaConfigs)
      setCurrentStep('edit-data')
    }
  }

  // Handle confirming new topics
  const handleConfirmNewTopics = async () => {
    setIsProcessing(true)
    try {
      // Add selected topics to config
      let newConfigs = [...localAreaConfigs]
      let hasChanges = false

      for (const [areaId, topics] of selectedNewTopics) {
        if (topics.size > 0) {
          newConfigs = newConfigs.map(area => {
            if (area.id === areaId) {
              hasChanges = true
              return { ...area, topics: [...area.topics, ...Array.from(topics)] }
            }
            return area
          })
        }
      }

      if (hasChanges) {
        setLocalAreaConfigs(newConfigs)
        await onUpdateConfig({ areas: newConfigs })
      }

      prepareAreasForEdit(newConfigs)
      setCurrentStep('edit-data')
    } finally {
      setIsProcessing(false)
    }
  }

  // Skip new topics step
  const handleSkipNewTopics = () => {
    prepareAreasForEdit(localAreaConfigs)
    setCurrentStep('edit-data')
  }

  // Prepare areas for the edit step
  const prepareAreasForEdit = (configs: AreaConfig[]) => {
    const extractedAreas = extractedData.areas ?? []
    const processedAreas = new Map<string, AreaEntry>()
    
    for (const extracted of extractedAreas) {
      // Find matching area config (AI should have matched names)
      const areaConfig = configs.find(c => 
        c.name.toLowerCase() === extracted.area.toLowerCase()
      )
      
      if (areaConfig) {
        // Check if this area was just created in this wizard session
        const isNewlyCreated = createdAreaNames.has(extracted.area)
        
        // Use existing entry or create new one
        const existingEntry = processedAreas.get(areaConfig.name)
        if (existingEntry) {
          // Merge topics
          const allTopics = [
            ...existingEntry.topics,
            ...(extracted.topics ?? [])
          ].filter((t, i, arr) => arr.indexOf(t) === i) // unique
          processedAreas.set(areaConfig.name, {
            ...existingEntry,
            topics: allTopics,
          })
        } else {
          // For newly created areas, include all extracted topics
          // For existing areas, only include topics that exist in config
          const validTopics = isNewlyCreated
            ? (extracted.topics ?? []) // Include all topics for new areas
            : (extracted.topics ?? []).filter(t => 
                areaConfig.topics.some(ct => ct.toLowerCase() === t.toLowerCase())
              )
          
          processedAreas.set(areaConfig.name, {
            area: areaConfig.name,
            topics: validTopics,
            hours: extracted.hours || 0,
          })
        }
      }
    }
    
    setAreas(Array.from(processedAreas.values()))
  }

  // Check step on mount if no new areas
  useEffect(() => {
    if (newAreasFromAI.length === 0) {
      const hasNewTopics = computeNewTopics(localAreaConfigs)
      if (!hasNewTopics) {
        prepareAreasForEdit(localAreaConfigs)
        setCurrentStep('edit-data')
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Get available area names for AreaEntries
  const availableAreas = localAreaConfigs.map(a => a.name)

  // Handle adding a new area in edit step
  const handleAddArea = async (name: string) => {
    const newAreaConfig: AreaConfig = {
      id: `area-${Date.now()}`,
      name,
      topics: [],
      hasTopics: true,
    }
    const newConfigs = [...localAreaConfigs, newAreaConfig]
    setLocalAreaConfigs(newConfigs)
    await onUpdateConfig({ areas: newConfigs })
  }

  // Handle adding a topic to an area
  const handleAddTopic = async (areaId: string, topic: string) => {
    const newConfigs = localAreaConfigs.map(area => {
      if (area.id === areaId) {
        return { ...area, topics: [...area.topics, topic] }
      }
      return area
    })
    setLocalAreaConfigs(newConfigs)
    await onUpdateConfig({ areas: newConfigs })
  }

  // Check if topic is in use (always false in wizard context)
  const isTopicInUse = () => false

  // Check if there's any data to save
  const hasContent = status !== null || areas.length > 0

  // Handle save
  const handleSave = () => {
    const data: Partial<ProductivityDayData> = {}
    if (status !== null) data.status = status
    if (areas.length > 0) data.areas = areas
    onComplete(data)
  }

  // Render confirm new areas step
  if (currentStep === 'confirm-new-areas') {
    return (
      <div className="space-y-4">
        <div className="p-4 rounded-xl bg-[#007AFF]/10 border border-[#007AFF]/30">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">🎯</span>
            <div>
              <h3 className="font-semibold text-white">New Areas Detected</h3>
              <p className="text-sm text-white/60">
                AI found {newAreasFromAI.length} area{newAreasFromAI.length !== 1 ? 's' : ''} not in your config
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {newAreasFromAI.map(areaName => (
              <button
                key={areaName}
                onClick={() => toggleNewArea(areaName)}
                className={`
                  w-full p-3 rounded-xl text-left
                  flex items-center justify-between
                  transition-all duration-200
                  ${selectedNewAreas.has(areaName)
                    ? 'bg-[#007AFF]/20 border border-[#007AFF]/50'
                    : 'bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06]'
                  }
                `}
              >
                <span className={`font-medium ${selectedNewAreas.has(areaName) ? 'text-[#007AFF]' : 'text-white/70'}`}>
                  {areaName}
                </span>
                <span className={`
                  w-6 h-6 rounded-lg flex items-center justify-center text-sm
                  ${selectedNewAreas.has(areaName)
                    ? 'bg-[#007AFF] text-white'
                    : 'bg-white/[0.05] text-white/30'
                  }
                `}>
                  {selectedNewAreas.has(areaName) ? '✓' : ''}
                </span>
              </button>
            ))}
          </div>
        </div>

        <p className="text-xs text-white/40">
          Selected areas will be added to your config. Unselected areas will be ignored.
        </p>

        <div className="flex gap-3">
          <button
            onClick={handleSkipNewAreas}
            disabled={isProcessing}
            className="
              flex-1 px-4 py-3 rounded-xl text-sm
              bg-white/[0.03] text-white/60 
              hover:bg-white/[0.08] hover:text-white/80
              border border-white/[0.08]
              transition-all duration-200
              disabled:opacity-50
            "
          >
            Skip All
          </button>
          <button
            onClick={handleConfirmNewAreas}
            disabled={isProcessing}
            className="
              flex-1 px-4 py-3 rounded-xl text-sm font-medium
              bg-[#007AFF] text-white
              hover:bg-[#007AFF]/90
              shadow-lg shadow-[#007AFF]/25
              transition-all duration-200
              disabled:opacity-50
            "
          >
            {isProcessing ? 'Creating...' : 
              selectedNewAreas.size > 0 
                ? `Create ${selectedNewAreas.size} & Continue`
                : 'Continue'
            }
          </button>
        </div>
      </div>
    )
  }

  // Render confirm new topics step
  if (currentStep === 'confirm-new-topics') {
    const totalNewTopics = Array.from(selectedNewTopics.values()).reduce((sum, set) => sum + set.size, 0)

    return (
      <div className="space-y-4">
        <div className="p-4 rounded-xl bg-[#AF52DE]/10 border border-[#AF52DE]/30">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">📝</span>
            <div>
              <h3 className="font-semibold text-white">New Topics Detected</h3>
              <p className="text-sm text-white/60">
                AI found new topics for {newTopicsFromAI.length} area{newTopicsFromAI.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {newTopicsFromAI.map(({ areaName, areaId, topics }) => (
              <div key={areaId} className="space-y-2">
                <div className="text-sm font-medium text-[#007AFF]">{areaName}</div>
                <div className="flex flex-wrap gap-2">
                  {topics.map(topic => {
                    const isSelected = selectedNewTopics.get(areaId)?.has(topic) ?? false
                    return (
                      <button
                        key={topic}
                        onClick={() => toggleNewTopic(areaId, topic)}
                        className={`
                          px-3 py-1.5 rounded-lg text-sm
                          transition-all duration-200
                          ${isSelected
                            ? 'bg-[#AF52DE] text-white shadow-[0_0_15px_rgba(175,82,222,0.3)]'
                            : 'bg-white/[0.05] text-white/60 hover:bg-white/[0.1]'
                          }
                        `}
                      >
                        {topic}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-white/40">
          Selected topics will be added to your areas. Unselected topics will be ignored.
        </p>

        <div className="flex gap-3">
          <button
            onClick={handleSkipNewTopics}
            disabled={isProcessing}
            className="
              flex-1 px-4 py-3 rounded-xl text-sm
              bg-white/[0.03] text-white/60 
              hover:bg-white/[0.08] hover:text-white/80
              border border-white/[0.08]
              transition-all duration-200
              disabled:opacity-50
            "
          >
            Skip All
          </button>
          <button
            onClick={handleConfirmNewTopics}
            disabled={isProcessing}
            className="
              flex-1 px-4 py-3 rounded-xl text-sm font-medium
              bg-[#AF52DE] text-white
              hover:bg-[#AF52DE]/90
              shadow-lg shadow-[#AF52DE]/25
              transition-all duration-200
              disabled:opacity-50
            "
          >
            {isProcessing ? 'Adding...' : totalNewTopics > 0 
              ? `Add ${totalNewTopics} Topic${totalNewTopics !== 1 ? 's' : ''} & Continue`
              : 'Continue'
            }
          </button>
        </div>
      </div>
    )
  }

  // Render edit data step
  return (
    <div className="space-y-6">
      {/* Status Selector */}
      <StatusSelector
        value={status}
        onChange={setStatus}
      />

      {/* Area Entries */}
      <AreaEntries
        currentAreas={areas}
        areaConfigs={localAreaConfigs}
        availableAreas={availableAreas}
        selectedDate=""
        onUpdateAreas={setAreas}
        onAddArea={handleAddArea}
        onAddTopic={handleAddTopic}
        isTopicInUse={isTopicInUse}
      />

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t border-white/[0.06]">
        <button
          onClick={onSkip}
          className="
            flex-1 px-4 py-3 rounded-xl text-sm
            bg-white/[0.03] text-white/60 
            hover:bg-white/[0.08] hover:text-white/80
            border border-white/[0.08]
            transition-all duration-200
          "
        >
          Skip
        </button>
        <button
          onClick={handleSave}
          disabled={!hasContent}
          className="
            flex-1 px-4 py-3 rounded-xl text-sm font-medium
            bg-[#30D158] text-white
            hover:bg-[#30D158]/90
            disabled:bg-white/[0.05] disabled:text-white/30
            shadow-lg shadow-[#30D158]/25
            disabled:shadow-none
            transition-all duration-200
          "
        >
          Save Productivity
        </button>
      </div>
    </div>
  )
}
