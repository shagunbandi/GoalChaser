'use client'

import { useState } from 'react'
import type { AIWizardFlowProps } from '@/sdk'
import type { TravelDayData, TravelPlan } from '../types'
import { TravelForm } from './TravelForm'

interface TravelWizardFlowProps extends AIWizardFlowProps<TravelDayData, unknown> {}

type WizardStep = 'confirm-plans' | 'edit-plans'

/**
 * Wizard flow for reviewing AI-extracted travel data
 * Step 1: Confirm which travel plans to include
 * Step 2: Edit the confirmed plans using existing components
 */
export function TravelWizardFlow({
  extractedData,
  existingDayData,
  onComplete,
  onSkip,
}: TravelWizardFlowProps) {
  const extractedPlans = extractedData.travelPlans ?? []
  
  // Track which plans are selected
  const [selectedPlanIds, setSelectedPlanIds] = useState<Set<string>>(
    () => new Set(extractedPlans.map(p => p.id))
  )

  // Current step
  const [currentStep, setCurrentStep] = useState<WizardStep>(
    extractedPlans.length > 0 ? 'confirm-plans' : 'edit-plans'
  )

  // Confirmed travel plans for editing
  const [travelPlans, setTravelPlans] = useState<TravelPlan[]>([])
  const [editingPlan, setEditingPlan] = useState<TravelPlan | null>(null)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [isAddingNew, setIsAddingNew] = useState(false)

  // Toggle plan selection
  const togglePlan = (planId: string) => {
    setSelectedPlanIds(prev => {
      const next = new Set(prev)
      if (next.has(planId)) {
        next.delete(planId)
      } else {
        next.add(planId)
      }
      return next
    })
  }

  // Confirm selected plans and move to edit step
  const handleConfirmPlans = () => {
    const confirmedPlans = extractedPlans.filter(p => selectedPlanIds.has(p.id))
    setTravelPlans(confirmedPlans)
    setCurrentStep('edit-plans')
  }

  // Skip all plans
  const handleSkipPlans = () => {
    setTravelPlans([])
    setCurrentStep('edit-plans')
  }

  // Handle editing a plan
  const handleEditPlan = (plan: TravelPlan, index: number) => {
    setEditingPlan(plan)
    setEditingIndex(index)
    setIsAddingNew(false)
  }

  // Handle saving an edited plan
  const handleSavePlan = (data: {
    title: string
    destination: string
    startDate: string
    endDate: string
    color: string
    note: string
  }) => {
    if (editingIndex !== null) {
      const newPlans = travelPlans.map((plan, i) =>
        i === editingIndex ? { ...plan, ...data } : plan
      )
      setTravelPlans(newPlans)
    } else if (isAddingNew) {
      const newPlan: TravelPlan = {
        id: `trip-${Date.now()}`,
        ...data,
      }
      setTravelPlans([...travelPlans, newPlan])
    }
    setEditingPlan(null)
    setEditingIndex(null)
    setIsAddingNew(false)
  }

  // Handle removing a plan
  const handleRemovePlan = (index: number) => {
    setTravelPlans(travelPlans.filter((_, i) => i !== index))
  }

  // Handle adding new
  const handleAddNew = () => {
    setEditingPlan({
      id: '',
      title: '',
      destination: '',
      startDate: '',
      endDate: '',
      color: '#0EA5E9',
      note: '',
    })
    setEditingIndex(null)
    setIsAddingNew(true)
  }

  // Handle save all
  const handleSave = () => {
    // Merge with existing plans, avoiding duplicates
    const existingPlans = existingDayData?.travelPlans ?? []
    const mergedPlans = [...existingPlans]

    for (const newPlan of travelPlans) {
      const isDuplicate = existingPlans.some(
        existing =>
          existing.title === newPlan.title &&
          existing.destination === newPlan.destination &&
          existing.startDate === newPlan.startDate
      )
      if (!isDuplicate) {
        mergedPlans.push(newPlan)
      }
    }

    onComplete({ travelPlans: mergedPlans })
  }

  // Check if there's any data
  const hasContent = travelPlans.length > 0

  // Calculate duration helper
  const calculateDuration = (startDate: string, endDate: string) => {
    if (!startDate || !endDate) return null
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
    return diffDays
  }

  // Render confirm plans step
  if (currentStep === 'confirm-plans') {
    return (
      <div className="space-y-4">
        <div className="p-4 rounded-xl bg-[#FF9500]/10 border border-[#FF9500]/30">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">✈️</span>
            <div>
              <h3 className="font-semibold text-white">Travel Plans Detected</h3>
              <p className="text-sm text-white/60">
                AI found {extractedPlans.length} travel plan{extractedPlans.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {extractedPlans.map(plan => {
              const isSelected = selectedPlanIds.has(plan.id)
              const duration = calculateDuration(plan.startDate, plan.endDate)
              
              return (
                <button
                  key={plan.id}
                  onClick={() => togglePlan(plan.id)}
                  className={`
                    w-full p-3 rounded-xl text-left
                    transition-all duration-200
                    ${isSelected
                      ? 'bg-[#FF9500]/20 border border-[#FF9500]/50'
                      : 'bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06]'
                    }
                  `}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className={`font-medium ${isSelected ? 'text-[#FF9500]' : 'text-white/70'}`}>
                        {plan.title || 'Untitled Trip'}
                      </div>
                      {plan.destination && (
                        <div className="text-sm text-white/50 mt-0.5">
                          📍 {plan.destination}
                        </div>
                      )}
                      <div className="text-xs text-white/40 mt-1">
                        {plan.startDate} → {plan.endDate}
                        {duration && <span className="ml-2">({duration} day{duration !== 1 ? 's' : ''})</span>}
                      </div>
                    </div>
                    <span className={`
                      w-6 h-6 rounded-lg flex items-center justify-center text-sm shrink-0 ml-3
                      ${isSelected
                        ? 'bg-[#FF9500] text-white'
                        : 'bg-white/[0.05] text-white/30'
                      }
                    `}>
                      {isSelected ? '✓' : ''}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <p className="text-xs text-white/40">
          Selected trips will be added. Unselected trips will be ignored.
        </p>

        <div className="flex gap-3">
          <button
            onClick={handleSkipPlans}
            className="
              flex-1 px-4 py-3 rounded-xl text-sm
              bg-white/[0.03] text-white/60 
              hover:bg-white/[0.08] hover:text-white/80
              border border-white/[0.08]
              transition-all duration-200
            "
          >
            Skip All
          </button>
          <button
            onClick={handleConfirmPlans}
            className="
              flex-1 px-4 py-3 rounded-xl text-sm font-medium
              bg-[#FF9500] text-white
              hover:bg-[#FF9500]/90
              shadow-lg shadow-[#FF9500]/25
              transition-all duration-200
            "
          >
            {selectedPlanIds.size > 0 
              ? `Add ${selectedPlanIds.size} Trip${selectedPlanIds.size !== 1 ? 's' : ''} & Continue`
              : 'Continue'
            }
          </button>
        </div>
      </div>
    )
  }

  // If editing, show the form
  if (editingPlan) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-white/60">
            {isAddingNew ? 'Add New Trip' : 'Edit Trip'}
          </h3>
          <button
            onClick={() => {
              setEditingPlan(null)
              setEditingIndex(null)
              setIsAddingNew(false)
            }}
            className="text-xs text-white/40 hover:text-white/60"
          >
            ← Back to list
          </button>
        </div>
        <TravelForm
          initialData={editingPlan}
          onSubmit={handleSavePlan}
          onCancel={() => {
            setEditingPlan(null)
            setEditingIndex(null)
            setIsAddingNew(false)
          }}
        />
      </div>
    )
  }

  // Show list of plans (edit step)
  return (
    <div className="space-y-4">
      {/* Travel Plans List */}
      {travelPlans.length > 0 ? (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-white/60">
            Travel Plans ({travelPlans.length})
          </label>
          {travelPlans.map((plan, index) => (
            <div key={plan.id || index} className="group relative">
              {/* Simple card for wizard - just shows the trip info */}
              <div
                onClick={() => handleEditPlan(plan, index)}
                className="
                  cursor-pointer
                  p-4 rounded-xl
                  border border-white/10 hover:border-white/20
                  bg-white/[0.04] hover:bg-white/[0.06]
                  transition-all duration-200
                "
                style={{
                  background: `linear-gradient(135deg, ${plan.color || '#F97316'}15, ${plan.color || '#F97316'}05)`,
                }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0"
                    style={{
                      backgroundColor: `${plan.color || '#F97316'}40`,
                    }}
                  >
                    ✈️
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-white/90 truncate">
                      {plan.title}
                    </h4>
                    {plan.destination && (
                      <p className="text-xs text-white/50 mt-0.5 truncate flex items-center gap-1">
                        <span>📍</span> {plan.destination}
                      </p>
                    )}
                    <p className="text-xs text-white/40 mt-1">
                      {new Date(plan.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} → {new Date(plan.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleRemovePlan(index)
                }}
                className="
                  absolute top-2 right-2
                  w-6 h-6 rounded-lg
                  bg-red-500/20 text-red-400
                  opacity-0 group-hover:opacity-100
                  hover:bg-red-500/30
                  flex items-center justify-center
                  transition-all duration-200
                  text-xs
                "
                title="Remove trip"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 rounded-xl border border-dashed border-white/[0.1] bg-white/[0.02]">
          <div className="text-3xl mb-2">✈️</div>
          <p className="text-sm text-white/40">No travel plans</p>
          <p className="text-xs text-white/30 mt-1">Add a trip below</p>
        </div>
      )}

      {/* Add New Button */}
      <button
        onClick={handleAddNew}
        className="
          w-full px-4 py-3 rounded-xl text-sm
          bg-white/[0.02] text-white/50 
          hover:bg-white/[0.05] hover:text-white/70
          border border-dashed border-white/[0.1] hover:border-white/[0.2]
          transition-all duration-200
        "
      >
        + Add New Trip
      </button>

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
            bg-gradient-to-r from-[#007AFF] to-[#AF52DE]
            text-white
            hover:shadow-[0_0_20px_rgba(0,122,255,0.3)]
            disabled:bg-white/[0.05] disabled:text-white/30 disabled:from-white/[0.05] disabled:to-white/[0.05]
            disabled:shadow-none
            transition-all duration-200
          "
        >
          Save {travelPlans.length} Trip{travelPlans.length !== 1 ? 's' : ''}
        </button>
      </div>
    </div>
  )
}
