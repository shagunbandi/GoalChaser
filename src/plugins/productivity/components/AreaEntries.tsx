'use client'

import { useState } from 'react'
import type { AreaEntry, AreaConfig } from '@/plugins/productivity/types'

interface AreaEntriesProps {
  currentAreas: AreaEntry[]
  areaConfigs: AreaConfig[]
  availableAreas: string[]
  selectedDate: string
  onUpdateAreas: (areas: AreaEntry[]) => void
  onAddArea: (name: string) => void
  onAddTopic: (areaId: string, topic: string) => void
  isTopicInUse: (areaId: string, topic: string) => boolean
}

export function AreaEntries({
  currentAreas,
  areaConfigs,
  availableAreas,
  onUpdateAreas,
  onAddArea,
  onAddTopic,
  isTopicInUse,
}: AreaEntriesProps) {
  const [showAddArea, setShowAddArea] = useState(false)
  const [newAreaInput, setNewAreaInput] = useState('')
  const [expandedAreaIndex, setExpandedAreaIndex] = useState<number | null>(null)
  const [showAddTopicForArea, setShowAddTopicForArea] = useState<string | null>(null)
  const [newTopicInput, setNewTopicInput] = useState('')

  // Get topics for an area
  const getTopicsForArea = (areaName: string) => {
    const config = areaConfigs.find((a) => a.name === areaName)
    return config?.topics || []
  }

  // Get area config by name
  const getAreaConfig = (areaName: string) => {
    return areaConfigs.find((a) => a.name === areaName)
  }

  // Check if area has topics enabled
  const areaHasTopics = (areaName: string) => {
    const config = getAreaConfig(areaName)
    return config?.hasTopics ?? true
  }

  // Add a new area entry
  const handleAddAreaEntry = (areaName: string) => {
    const existingEntry = currentAreas.find((a) => a.area === areaName)
    if (existingEntry) return // Already added

    const newEntry: AreaEntry = {
      area: areaName,
      topics: [],
    }
    onUpdateAreas([...currentAreas, newEntry])
    setExpandedAreaIndex(currentAreas.length)
  }

  // Remove an area entry
  const handleRemoveAreaEntry = (index: number) => {
    const newAreas = currentAreas.filter((_, i) => i !== index)
    onUpdateAreas(newAreas)
    if (expandedAreaIndex === index) {
      setExpandedAreaIndex(null)
    } else if (expandedAreaIndex !== null && expandedAreaIndex > index) {
      setExpandedAreaIndex(expandedAreaIndex - 1)
    }
  }

  // Toggle topic selection for an area entry
  const handleToggleTopic = (areaIndex: number, topic: string) => {
    const entry = currentAreas[areaIndex]
    const newTopics = entry.topics.includes(topic)
      ? entry.topics.filter((t) => t !== topic)
      : [...entry.topics, topic]

    const newAreas = currentAreas.map((a, i) =>
      i === areaIndex ? { ...a, topics: newTopics } : a,
    )
    onUpdateAreas(newAreas)
  }

  // Add new area to config and add entry
  const handleAddNewArea = () => {
    if (newAreaInput.trim()) {
      onAddArea(newAreaInput.trim())
      handleAddAreaEntry(newAreaInput.trim())
      setNewAreaInput('')
      setShowAddArea(false)
    }
  }

  // Add new topic to area config
  const handleAddNewTopic = (areaName: string, areaIndex: number) => {
    if (newTopicInput.trim()) {
      const config = getAreaConfig(areaName)
      if (config) {
        onAddTopic(config.id, newTopicInput.trim())
        // Also select the new topic
        handleToggleTopic(areaIndex, newTopicInput.trim())
      }
      setNewTopicInput('')
      setShowAddTopicForArea(null)
    }
  }

  // Get areas not yet added
  const availableToAdd = availableAreas.filter(
    (a) => !currentAreas.find((entry) => entry.area === a),
  )

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-white/60">
          Areas
        </label>
      </div>

      {/* Added Areas */}
      {currentAreas.length > 0 && (
        <div className="space-y-2">
          {currentAreas.map((entry, index) => {
            const hasTopics = areaHasTopics(entry.area)
            const isExpanded = expandedAreaIndex === index

            return (
              <div
                key={entry.area}
                data-testid={`area-entry-${entry.area}`}
                className={`
                  backdrop-blur-sm rounded-xl overflow-hidden
                  ${
                    hasTopics
                      ? 'bg-white/[0.03] border border-white/[0.08]'
                      : 'bg-[#30D158]/20 border border-[#30D158]/30'
                  }
                `}
              >
                {/* Area Header */}
                <div
                  className={`
                    flex items-center justify-between p-3
                    ${hasTopics ? 'cursor-pointer hover:bg-white/[0.02]' : ''}
                  `}
                  onClick={() => {
                    if (hasTopics) {
                      setExpandedAreaIndex(isExpanded ? null : index)
                    }
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`font-medium ${
                        hasTopics ? 'text-[#007AFF]' : 'text-[#30D158]'
                      }`}
                    >
                      {entry.area}
                    </span>
                    {!hasTopics && (
                      <span className="text-xs text-[#30D158]/70">✓ Done</span>
                    )}
                    {hasTopics && entry.topics.length > 0 && (
                      <span className="text-xs text-white/40">
                        {entry.topics.length} topic
                        {entry.topics.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemoveAreaEntry(index)
                      }}
                      className="text-white/30 hover:text-red-400 transition-colors p-1"
                    >
                      ✕
                    </button>
                    {hasTopics && (
                      <span className="text-white/30 text-xs">
                        {isExpanded ? '▲' : '▼'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Expanded Content - only for areas with topics */}
                {hasTopics && isExpanded && (
                  <div className="border-t border-white/[0.06] p-3 space-y-4">
                    {/* Topics */}
                    <div className="space-y-2">
                      <label className="text-xs text-white/40">Topics</label>
                      <div className="flex flex-wrap gap-2">
                        {getTopicsForArea(entry.area).map((topic) => (
                          <button
                            key={topic}
                            data-testid={`topic-${entry.area}-${topic}`}
                            data-selected={entry.topics.includes(topic)}
                            onClick={() => handleToggleTopic(index, topic)}
                            className={`
                              px-3 py-1.5 rounded-lg text-xs font-medium 
                              transition-all duration-200
                              ${
                                entry.topics.includes(topic)
                                  ? 'bg-[#AF52DE] text-white shadow-[0_0_15px_rgba(175,82,222,0.3)]'
                                  : 'bg-white/[0.05] text-white/60 hover:bg-white/[0.1]'
                              }
                            `}
                          >
                            {topic}
                          </button>
                        ))}
                        {showAddTopicForArea === entry.area ? (
                          <div className="flex gap-1">
                            <input
                              type="text"
                              value={newTopicInput}
                              onChange={(e) => setNewTopicInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleAddNewTopic(entry.area, index)
                                } else if (e.key === 'Escape') {
                                  setShowAddTopicForArea(null)
                                  setNewTopicInput('')
                                }
                              }}
                              placeholder="New topic..."
                              className="
                                px-2 py-1 w-24
                                bg-white/[0.05] border border-white/[0.1] rounded-lg
                                text-xs text-white placeholder-white/30
                                focus:outline-none focus:border-[#AF52DE]/50
                              "
                              autoFocus
                            />
                            <button
                              onClick={() =>
                                handleAddNewTopic(entry.area, index)
                              }
                              disabled={!newTopicInput.trim()}
                              className="px-2 py-1 bg-[#AF52DE] text-white text-xs rounded-lg disabled:opacity-50"
                            >
                              Add
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() =>
                              setShowAddTopicForArea(entry.area)
                            }
                            className="
                              px-3 py-1.5 rounded-lg text-xs
                              bg-white/[0.02] text-white/40 
                              hover:bg-white/[0.05] hover:text-white/60
                              border border-dashed border-white/[0.1]
                            "
                          >
                            + Topic
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Add Area Button/Input */}
      {!showAddArea ? (
        <div className="flex flex-wrap gap-2">
          {availableToAdd.map((area) => (
            <button
              key={area}
              data-testid={`add-area-${area}`}
              onClick={() => handleAddAreaEntry(area)}
              className="
                px-3 py-2 rounded-xl text-sm font-medium
                bg-white/[0.03] text-white/50 
                hover:bg-white/[0.08] hover:text-white/80
                border border-white/[0.06] hover:border-white/[0.1]
                transition-all duration-200
              "
            >
              + {area}
            </button>
          ))}
          <button
            onClick={() => setShowAddArea(true)}
            className="
              px-3 py-2 rounded-xl text-sm font-medium
              bg-white/[0.02] text-white/40 
              hover:bg-white/[0.05] hover:text-white/70
              border border-dashed border-white/[0.1] hover:border-white/[0.2]
              transition-all duration-200
            "
          >
            + New Area
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            type="text"
            value={newAreaInput}
            onChange={(e) => setNewAreaInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddNewArea()
              if (e.key === 'Escape') {
                setShowAddArea(false)
                setNewAreaInput('')
              }
            }}
            placeholder="Enter area name..."
            className="
              flex-1 px-4 py-2.5
              bg-white/[0.03] backdrop-blur-xl
              border border-white/[0.08] rounded-xl
              text-white placeholder-white/30
              focus:outline-none focus:border-[#007AFF]/50
              transition-all duration-200
            "
            autoFocus
          />
          <button
            onClick={handleAddNewArea}
            disabled={!newAreaInput.trim()}
            className="
              px-4 py-2.5
              bg-[#007AFF] hover:bg-[#007AFF]/80
              disabled:bg-white/[0.05] disabled:text-white/30
              text-white font-medium rounded-xl
              transition-all duration-200
            "
          >
            Add
          </button>
          <button
            onClick={() => {
              setShowAddArea(false)
              setNewAreaInput('')
            }}
            className="
              px-4 py-2.5
              bg-white/[0.05] hover:bg-white/[0.1]
              text-white/60 rounded-xl
              transition-all duration-200
            "
          >
            Cancel
          </button>
        </div>
      )}

      {currentAreas.length === 0 &&
        availableAreas.length === 0 &&
        !showAddArea && (
          <p className="text-xs text-white/30">
            No areas yet. Add your first area to get started.
          </p>
        )}
    </div>
  )
}
