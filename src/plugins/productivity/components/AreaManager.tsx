'use client'

import { useState } from 'react'
import { Drawer } from '@/sdk'
import type { AreaConfig, StreakType } from '@/plugins/productivity/types'

interface AreaManagerProps {
  isOpen: boolean
  areaConfigs: AreaConfig[]
  onAddArea: (name: string) => void
  onRemoveArea: (id: string) => void
  onUpdateArea: (id: string, name: string) => void
  onToggleHasTopics: (id: string) => void
  onAddTopic: (areaId: string, topic: string) => void
  onRemoveTopic: (areaId: string, topic: string) => void
  onUpdateTopic: (areaId: string, oldTopic: string, newTopic: string) => void
  onUpdateAreaGoal: (id: string, streakType: StreakType, targetFrequency?: number) => void
  onToggleTrackStreaks: (id: string) => void
  isTopicInUse: (areaId: string, topic: string) => boolean
  onClose: () => void
}

export function AreaManager({
  isOpen,
  areaConfigs,
  onAddArea,
  onRemoveArea,
  onUpdateArea,
  onToggleHasTopics,
  onAddTopic,
  onRemoveTopic,
  onUpdateTopic,
  onUpdateAreaGoal,
  onToggleTrackStreaks,
  isTopicInUse,
  onClose,
}: AreaManagerProps) {
  const [newAreaInput, setNewAreaInput] = useState('')
  const [editingAreaId, setEditingAreaId] = useState<string | null>(null)
  const [editingAreaName, setEditingAreaName] = useState('')
  const [expandedAreaId, setExpandedAreaId] = useState<string | null>(null)
  const [newTopicInput, setNewTopicInput] = useState('')
  const [showAddTopic, setShowAddTopic] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [editingTopic, setEditingTopic] = useState<{
    areaId: string
    topic: string
  } | null>(null)
  const [editingTopicName, setEditingTopicName] = useState('')
  const [deleteTopicConfirm, setDeleteTopicConfirm] = useState<{
    areaId: string
    topic: string
  } | null>(null)

  const handleAddArea = () => {
    if (newAreaInput.trim()) {
      onAddArea(newAreaInput.trim())
      setNewAreaInput('')
    }
  }

  const startEditingArea = (area: AreaConfig) => {
    setEditingAreaId(area.id)
    setEditingAreaName(area.name)
  }

  const saveAreaEdit = () => {
    if (editingAreaId && editingAreaName.trim()) {
      onUpdateArea(editingAreaId, editingAreaName.trim())
    }
    setEditingAreaId(null)
    setEditingAreaName('')
  }

  const cancelAreaEdit = () => {
    setEditingAreaId(null)
    setEditingAreaName('')
  }

  const handleDeleteArea = (id: string) => {
    onRemoveArea(id)
    setDeleteConfirm(null)
    if (expandedAreaId === id) {
      setExpandedAreaId(null)
    }
  }

  const handleAddTopic = (areaId: string) => {
    if (newTopicInput.trim()) {
      onAddTopic(areaId, newTopicInput.trim())
      setNewTopicInput('')
      setShowAddTopic(null)
    }
  }

  const handleRemoveTopic = (areaId: string, topic: string) => {
    onRemoveTopic(areaId, topic)
    setDeleteTopicConfirm(null)
  }

  const startEditingTopic = (areaId: string, topic: string) => {
    setEditingTopic({ areaId, topic })
    setEditingTopicName(topic)
  }

  const saveTopicEdit = () => {
    if (editingTopic && editingTopicName.trim()) {
      onUpdateTopic(
        editingTopic.areaId,
        editingTopic.topic,
        editingTopicName.trim(),
      )
    }
    setEditingTopic(null)
    setEditingTopicName('')
  }

  const cancelTopicEdit = () => {
    setEditingTopic(null)
    setEditingTopicName('')
  }

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Manage Areas"
      subtitle={`${areaConfigs.length} ${
        areaConfigs.length === 1 ? 'area' : 'areas'
      } configured`}
      icon="🎯"
      iconGradient="from-[#30D158] to-[#34C759]"
    >
      {/* Add New Area */}
      <div className="p-6 sm:p-8 border-b border-white/5">
        <div className="flex gap-3">
          <input
            type="text"
            value={newAreaInput}
            onChange={(e) => setNewAreaInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddArea()
            }}
            placeholder="Add new area (e.g. Health, Career, Relationships)..."
            className="
              flex-1 px-5 py-3.5
              bg-white/5 backdrop-blur-xl
              border border-white/10 rounded-xl
              text-white placeholder-white/30
              focus:outline-none focus:border-[#30D158]/50 focus:bg-white/8
              transition-all duration-200
              text-sm
            "
          />
          <button
            onClick={handleAddArea}
            disabled={!newAreaInput.trim()}
            className="
              px-6 py-3.5
              bg-gradient-to-r from-[#30D158] to-[#34C759]
              hover:from-[#30D158]/90 hover:to-[#34C759]/90
              disabled:from-white/5 disabled:to-white/5
              disabled:text-white/30
              text-white font-semibold rounded-xl
              shadow-lg shadow-[#30D158]/25
              disabled:shadow-none
              transition-all duration-200
              hover:scale-[1.02] active:scale-[0.98]
              disabled:hover:scale-100
              text-sm whitespace-nowrap
            "
          >
            + Add
          </button>
        </div>
      </div>

      {/* Area List */}
      <div className="px-6 sm:px-8 py-6">
        {areaConfigs.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-white/5 to-white/[0.02] flex items-center justify-center border border-white/10">
              <span className="text-5xl opacity-50">🎯</span>
            </div>
            <h3 className="text-lg font-semibold text-white/80 mb-2">
              No areas yet
            </h3>
            <p className="text-sm text-white/40 max-w-xs mx-auto">
              Add your first productivity area above to start tracking your
              progress
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {areaConfigs.map((area) => (
              <div
                key={area.id}
                className="
                  group
                  bg-white/[0.04] hover:bg-white/[0.06] backdrop-blur-sm
                  border border-white/10 hover:border-white/15
                  rounded-2xl
                  overflow-hidden
                  transition-all duration-200
                  hover:shadow-lg hover:shadow-black/20
                "
              >
                {/* Area Header */}
                <div className="flex items-center justify-between p-4 sm:p-5">
                  {editingAreaId === area.id ? (
                    <div className="flex-1 flex gap-2 mr-3">
                      <input
                        type="text"
                        value={editingAreaName}
                        onChange={(e) => setEditingAreaName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveAreaEdit()
                          if (e.key === 'Escape') cancelAreaEdit()
                        }}
                        className="
                          flex-1 px-4 py-2
                          bg-white/10 border border-[#30D158]/50 rounded-xl
                          text-white text-sm
                          focus:outline-none focus:border-[#30D158]
                        "
                        autoFocus
                      />
                      <button
                        onClick={saveAreaEdit}
                        className="px-4 py-2 bg-[#30D158] hover:bg-[#30D158]/90 text-white text-sm font-medium rounded-xl transition-all"
                      >
                        ✓ Save
                      </button>
                      <button
                        onClick={cancelAreaEdit}
                        className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white/70 text-sm rounded-xl transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div
                      className="flex-1 flex items-center gap-3 cursor-pointer group/header"
                      onClick={() =>
                        setExpandedAreaId(
                          expandedAreaId === area.id ? null : area.id,
                        )
                      }
                    >
                      <div className="flex-1 flex items-center gap-3">
                        <span className="text-lg font-semibold text-white group-hover/header:text-[#30D158] transition-colors">
                          {area.name}
                        </span>
                        <span className="text-xs font-medium text-white/40 bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
                          {area.topics.length}{' '}
                          {area.topics.length === 1 ? 'topic' : 'topics'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className="text-white/30 text-sm transition-transform duration-200"
                          style={{
                            transform:
                              expandedAreaId === area.id
                                ? 'rotate(180deg)'
                                : 'rotate(0deg)',
                          }}
                        >
                          ▼
                        </span>
                      </div>
                    </div>
                  )}

                  {editingAreaId !== area.id && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          startEditingArea(area)
                        }}
                        className="
                          p-2.5 rounded-xl
                          text-white/40 hover:text-[#FF9500] hover:bg-[#FF9500]/10
                          transition-all duration-200
                        "
                        title="Edit area"
                      >
                        <span className="text-base">✏️</span>
                      </button>
                      {deleteConfirm === area.id ? (
                        <div className="flex items-center gap-1 ml-1">
                          <button
                            onClick={() => handleDeleteArea(area.id)}
                            className="px-3 py-1.5 bg-[#FF3B30] hover:bg-[#FF3B30]/90 text-white text-sm font-medium rounded-lg transition-all"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="px-3 py-1.5 bg-white/10 hover:bg-white/15 text-white/70 text-sm rounded-lg transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setDeleteConfirm(area.id)
                          }}
                          className="
                            p-2.5 rounded-xl
                            text-white/40 hover:text-[#FF3B30] hover:bg-[#FF3B30]/10
                            transition-all duration-200
                          "
                          title="Delete area"
                        >
                          <span className="text-base">🗑️</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Expanded Topics */}
                {expandedAreaId === area.id && (
                  <div className="border-t border-white/5 bg-black/10 p-4 sm:p-5 space-y-5">
                    {/* Track Streaks Toggle */}
                    <div className="flex items-center justify-between p-4 bg-white/[0.02] rounded-xl border border-white/5">
                      <div className="flex-1 pr-4">
                        <label className="text-sm font-medium text-white/80">
                          Track Streaks
                        </label>
                        <p className="text-xs text-white/40 mt-1 leading-relaxed">
                          {area.trackStreaks ?? true
                            ? 'Calculate and display streaks for this area'
                            : 'Streaks disabled - only track visits/hours'}
                        </p>
                      </div>
                      <button
                        onClick={() => onToggleTrackStreaks(area.id)}
                        className={`
                          relative w-14 h-8 rounded-full transition-all duration-300
                          ${
                            area.trackStreaks ?? true
                              ? 'bg-[#007AFF] shadow-lg shadow-[#007AFF]/30'
                              : 'bg-white/20'
                          }
                        `}
                      >
                        <span
                          className={`
                            absolute top-1 w-6 h-6 rounded-full bg-white shadow-lg
                            transition-all duration-300
                            ${area.trackStreaks ?? true ? 'left-7' : 'left-1'}
                          `}
                        />
                      </button>
                    </div>

                    {/* Streak Goal Configuration - Only show if tracking is enabled */}
                    {(area.trackStreaks ?? true) && (
                      <div className="p-4 bg-white/[0.02] rounded-xl border border-white/5 space-y-3">
                        <label className="text-sm font-medium text-white/80">
                          Streak Goal
                        </label>
                        
                        {/* Streak Type Selector */}
                        <div className="grid grid-cols-3 gap-2">
                          {(['daily', 'weekly', 'monthly'] as const).map((type) => (
                            <button
                              key={type}
                              onClick={() => {
                                const freq = type === 'daily' ? undefined : (area.targetFrequency || 1)
                                onUpdateAreaGoal(area.id, type, freq)
                              }}
                              className={`
                                px-3 py-2 rounded-lg text-xs font-medium transition-all
                                ${(area.streakType || 'daily') === type
                                  ? 'bg-[#007AFF] text-white'
                                  : 'bg-white/5 hover:bg-white/10 text-white/60'
                                }
                              `}
                            >
                              {type.charAt(0).toUpperCase() + type.slice(1)}
                            </button>
                          ))}
                        </div>
                        
                        {/* Target Frequency (for weekly/monthly) */}
                        {(area.streakType === 'weekly' || area.streakType === 'monthly') && (
                          <div className="flex items-center gap-2">
                            <label className="text-xs text-white/60">Target:</label>
                            <input
                              type="number"
                              min="1"
                              max="30"
                              value={area.targetFrequency || 1}
                              onChange={(e) => {
                                const val = parseInt(e.target.value)
                                if (val >= 1 && val <= 30) {
                                  onUpdateAreaGoal(area.id, area.streakType!, val)
                                }
                              }}
                              className="
                                w-16 px-2 py-1 text-center
                                bg-white/5 border border-white/10 rounded-lg
                                text-white text-sm
                                focus:outline-none focus:border-[#007AFF]/50
                              "
                            />
                            <span className="text-xs text-white/60">
                              times per {area.streakType === 'weekly' ? 'week' : 'month'}
                            </span>
                          </div>
                        )}
                        
                        <p className="text-xs text-white/40 leading-relaxed">
                          {area.streakType === 'daily' && 'Track consecutive days with activity'}
                          {area.streakType === 'weekly' && `Track consecutive weeks with ${area.targetFrequency || 1}+ activities`}
                          {area.streakType === 'monthly' && `Track consecutive months with ${area.targetFrequency || 1}+ activities`}
                        </p>
                      </div>
                    )}
                  
                    {/* Has Topics Toggle */}
                    <div className="flex items-center justify-between p-4 bg-white/[0.02] rounded-xl border border-white/5">
                      <div className="flex-1 pr-4">
                        <label className="text-sm font-medium text-white/80">
                          Enable Topics
                        </label>
                        <p className="text-xs text-white/40 mt-1 leading-relaxed">
                          {area.hasTopics ?? true
                            ? 'Track specific topics within this area'
                            : 'Simple on/off tracking (shows as green when done)'}
                        </p>
                      </div>
                      <button
                        onClick={() => onToggleHasTopics(area.id)}
                        className={`
                          relative w-14 h-8 rounded-full transition-all duration-300
                          ${
                            area.hasTopics ?? true
                              ? 'bg-[#30D158] shadow-lg shadow-[#30D158]/30'
                              : 'bg-white/20'
                          }
                        `}
                      >
                        <span
                          className={`
                            absolute top-1 w-6 h-6 rounded-full bg-white shadow-lg
                            transition-all duration-300
                            ${area.hasTopics ?? true ? 'left-7' : 'left-1'}
                          `}
                        />
                      </button>
                    </div>

                    {/* Topics Section */}
                    {(area.hasTopics ?? true) && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-white/60 uppercase tracking-wider">
                            Topics ({area.topics.length})
                          </label>
                        </div>

                        {/* Topic List */}
                        {area.topics.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {area.topics.map((topic) => {
                              const topicInUse = isTopicInUse(area.id, topic)
                              const isEditing =
                                editingTopic?.areaId === area.id &&
                                editingTopic?.topic === topic
                              const isConfirmingDelete =
                                deleteTopicConfirm?.areaId === area.id &&
                                deleteTopicConfirm?.topic === topic

                              if (isEditing) {
                                return (
                                  <div
                                    key={topic}
                                    className="flex items-center gap-1.5"
                                  >
                                    <input
                                      type="text"
                                      value={editingTopicName}
                                      onChange={(e) =>
                                        setEditingTopicName(e.target.value)
                                      }
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') saveTopicEdit()
                                        if (e.key === 'Escape')
                                          cancelTopicEdit()
                                      }}
                                      className="
                                        px-3 py-1.5 w-32
                                        bg-white/10 border border-[#AF52DE]/50 rounded-xl
                                        text-white text-sm
                                        focus:outline-none focus:border-[#AF52DE]
                                      "
                                      autoFocus
                                    />
                                    <button
                                      onClick={saveTopicEdit}
                                      className="px-3 py-1.5 bg-[#30D158] hover:bg-[#30D158]/90 text-white text-sm rounded-xl transition-all"
                                    >
                                      ✓
                                    </button>
                                    <button
                                      onClick={cancelTopicEdit}
                                      className="px-3 py-1.5 bg-white/10 hover:bg-white/15 text-white/70 text-sm rounded-xl transition-all"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                )
                              }

                              return (
                                <div
                                  key={topic}
                                  className="
                                    group/topic flex items-center gap-2
                                    px-3.5 py-2 rounded-xl
                                    bg-[#AF52DE]/15 hover:bg-[#AF52DE]/20
                                    text-[#AF52DE] border border-[#AF52DE]/30
                                    transition-all duration-200
                                  "
                                >
                                  <span className="text-sm font-medium">
                                    {topic}
                                  </span>
                                  <div className="flex items-center gap-1 opacity-0 group-hover/topic:opacity-100 transition-opacity">
                                    <button
                                      onClick={() =>
                                        startEditingTopic(area.id, topic)
                                      }
                                      className="
                                        w-6 h-6 rounded-lg
                                        hover:bg-[#FF9500]/20
                                        text-white/40 hover:text-[#FF9500]
                                        flex items-center justify-center
                                        transition-all duration-200
                                      "
                                      title="Edit topic"
                                    >
                                      <span className="text-xs">✏️</span>
                                    </button>
                                    {isConfirmingDelete ? (
                                      <div className="flex items-center gap-1 ml-1">
                                        <button
                                          onClick={() =>
                                            handleRemoveTopic(area.id, topic)
                                          }
                                          className="px-2 py-1 bg-[#FF3B30] hover:bg-[#FF3B30]/90 text-white text-xs font-medium rounded-lg transition-all"
                                        >
                                          Delete
                                        </button>
                                        <button
                                          onClick={() =>
                                            setDeleteTopicConfirm(null)
                                          }
                                          className="px-2 py-1 bg-white/10 hover:bg-white/15 text-white/70 text-xs rounded-lg transition-all"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    ) : topicInUse ? (
                                      <span
                                        className="
                                          w-6 h-6 rounded-lg
                                          text-white/20
                                          flex items-center justify-center
                                          cursor-not-allowed
                                        "
                                        title="Cannot delete: topic is in use"
                                      >
                                        <span className="text-xs">🔒</span>
                                      </span>
                                    ) : (
                                      <button
                                        onClick={() =>
                                          setDeleteTopicConfirm({
                                            areaId: area.id,
                                            topic,
                                          })
                                        }
                                        className="
                                          w-6 h-6 rounded-lg
                                          hover:bg-[#FF3B30]/20
                                          text-white/40 hover:text-[#FF3B30]
                                          flex items-center justify-center
                                          transition-all duration-200
                                        "
                                        title="Delete topic"
                                      >
                                        <span className="text-xs">🗑️</span>
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        ) : (
                          <div className="text-center py-8 px-4 rounded-xl bg-white/[0.02] border border-dashed border-white/10">
                            <p className="text-sm text-white/40">
                              No topics yet. Add topics to organize this area.
                            </p>
                          </div>
                        )}

                        {/* Add Topic */}
                        {showAddTopic === area.id ? (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={newTopicInput}
                              onChange={(e) => setNewTopicInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleAddTopic(area.id)
                                if (e.key === 'Escape') {
                                  setShowAddTopic(null)
                                  setNewTopicInput('')
                                }
                              }}
                              placeholder="Enter topic name..."
                              className="
                                flex-1 px-4 py-2.5
                                bg-white/10 border border-white/15 rounded-xl
                                text-white text-sm placeholder-white/30
                                focus:outline-none focus:border-[#AF52DE]/50 focus:bg-white/15
                              "
                              autoFocus
                            />
                            <button
                              onClick={() => handleAddTopic(area.id)}
                              disabled={!newTopicInput.trim()}
                              className="
                                px-5 py-2.5
                                bg-[#AF52DE] hover:bg-[#AF52DE]/90
                                disabled:bg-white/5 disabled:text-white/30
                                text-white text-sm font-medium rounded-xl
                                transition-all duration-200
                                shadow-lg shadow-[#AF52DE]/20
                                disabled:shadow-none
                              "
                            >
                              Add
                            </button>
                            <button
                              onClick={() => {
                                setShowAddTopic(null)
                                setNewTopicInput('')
                              }}
                              className="
                                px-5 py-2.5
                                bg-white/5 hover:bg-white/10
                                text-white/70 text-sm rounded-xl
                                transition-all duration-200
                              "
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setShowAddTopic(area.id)}
                            className="
                              w-full px-4 py-3 rounded-xl text-sm font-medium
                              bg-white/[0.02] hover:bg-white/[0.05] text-white/50 hover:text-white/70
                              border border-dashed border-white/10 hover:border-[#AF52DE]/30
                              transition-all duration-200
                            "
                          >
                            + Add Topic
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-6 sm:p-8 border-t border-white/5 shrink-0 bg-gradient-to-t from-black/20">
        <button
          onClick={onClose}
          className="
            w-full px-4 py-3.5
            bg-white/10 hover:bg-white/15
            text-white font-semibold rounded-xl
            transition-all duration-200
            hover:scale-[1.01] active:scale-[0.99]
            border border-white/10
          "
        >
          Done
        </button>
      </div>
    </Drawer>
  )
}
