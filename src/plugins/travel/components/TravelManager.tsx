'use client'

import { useState, useEffect } from 'react'
import { Drawer } from '@/sdk'
import { TravelForm } from './TravelForm'
import { PlaceAutocomplete } from './PlaceAutocomplete'
import { TravelPlanCard } from '../detail-provider'
import type { TravelPlan, TravelPlanInput, TravelDayData, TravelConfig } from '../types'

interface TravelManagerProps {
  isOpen: boolean
  dayData: Record<string, TravelDayData>
  onAddTravel: (travel: TravelPlanInput) => void | Promise<void>
  onUpdateTravel: (travel: TravelPlan) => void | Promise<void>
  onDeleteTravel: (travelId: string) => void | Promise<void>
  onClose: () => void
  allTravels?: TravelPlan[]
  userId?: string
  goalId?: string
  pluginConfig?: TravelConfig | null
  onUpdateConfig?: (config: Partial<TravelConfig>) => void | Promise<void>
}

export function TravelManager({
  isOpen,
  dayData,
  onAddTravel,
  onUpdateTravel,
  onDeleteTravel,
  onClose,
  allTravels,
  userId,
  goalId,
  pluginConfig,
  onUpdateConfig,
}: TravelManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingTravel, setEditingTravel] = useState<TravelPlan | null>(null)
  const [baseLocationInput, setBaseLocationInput] = useState(
    () => pluginConfig?.baseLocation?.placeAddress ?? '',
  )
  useEffect(() => {
    const addr = pluginConfig?.baseLocation?.placeAddress ?? ''
    setBaseLocationInput(addr)
  }, [pluginConfig?.baseLocation?.placeAddress])

  // Extract unique travel plans from day data
  const travelPlans = (() => {
    const planMap = new Map<string, TravelPlan>()
    Object.values(dayData).forEach((data) => {
      data?.travelPlans?.forEach((plan) => {
        if (!planMap.has(plan.id)) {
          planMap.set(plan.id, plan)
        }
      })
    })
    return Array.from(planMap.values()).sort(
      (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
    )
  })()

  const handleAddTravel = async (data: {
    title: string
    destination: string
    startDate: string
    endDate: string
    color: string
    note: string
    parentTravelId?: string
    placeId?: string
    placeCoordinates?: { lat: number; lng: number }
    placeAddress?: string
  }) => {
    await onAddTravel({
      title: data.title,
      destination: data.destination,
      startDate: data.startDate,
      endDate: data.endDate,
      color: data.color,
      note: data.note,
      parentTravelId: data.parentTravelId,
      placeId: data.placeId,
      placeCoordinates: data.placeCoordinates,
      placeAddress: data.placeAddress,
    })
    setShowAddForm(false)
  }

  const handleUpdateTravel = async (data: {
    title: string
    destination: string
    startDate: string
    endDate: string
    color: string
    note: string
    parentTravelId?: string
    placeId?: string
    placeCoordinates?: { lat: number; lng: number }
    placeAddress?: string
  }) => {
    if (!editingTravel) return
    await onUpdateTravel({
      ...editingTravel,
      title: data.title,
      destination: data.destination,
      startDate: data.startDate,
      endDate: data.endDate,
      color: data.color,
      note: data.note,
      parentTravelId: data.parentTravelId,
      placeId: data.placeId,
      placeCoordinates: data.placeCoordinates,
      placeAddress: data.placeAddress,
    })
    setEditingTravel(null)
  }

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Manage Travel"
      subtitle={`${travelPlans.length} ${travelPlans.length === 1 ? 'trip' : 'trips'} planned`}
      icon="✈️"
      iconGradient="from-[#007AFF] to-[#5856D6]"
    >
      {/* Base location (used between travels when there is a 1+ day gap) */}
      {onUpdateConfig && (
        <div className="p-6 sm:p-8 border-b border-white/5">
          <h3 className="text-sm font-semibold text-white/90 mb-1">Base location</h3>
          <p className="text-xs text-white/50 mb-3">
            Between two travels, if there are 1 or more days gap, you&apos;re at base. On the map the line will go: travel → base → next travel. For a trip with sub-travels, the main trip location is used as base between sub-trips.
          </p>
          <PlaceAutocomplete
            value={baseLocationInput}
            onChange={setBaseLocationInput}
            onPlaceSelect={(place) => {
              setBaseLocationInput(place.address)
              onUpdateConfig({
                baseLocation: {
                  placeId: place.placeId,
                  placeCoordinates: place.coordinates,
                  placeAddress: place.address,
                },
              })
            }}
            placeholder="e.g. Home, your city"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
          />
        </div>
      )}

      {/* Add New Travel Button */}
      {!showAddForm && !editingTravel && (
        <div className="p-6 sm:p-8 border-b border-white/5">
          <button
            onClick={() => setShowAddForm(true)}
            className="
              w-full px-6 py-4
              bg-gradient-to-r from-[#007AFF] to-[#5856D6]
              hover:from-[#007AFF]/90 hover:to-[#5856D6]/90
              text-white font-semibold rounded-xl
              shadow-lg shadow-[#007AFF]/25
              transition-all duration-200
              hover:scale-[1.02] active:scale-[0.98]
              text-sm
            "
          >
            + Add New Travel
          </button>
        </div>
      )}

      {/* Add Travel Form */}
      {showAddForm && (
        <div className="p-6 sm:p-8 border-b border-white/5">
          <h3 className="text-lg font-semibold text-white mb-4">Add New Travel</h3>
          <TravelForm
            onSubmit={handleAddTravel}
            onCancel={() => setShowAddForm(false)}
            availableTravels={allTravels || travelPlans}
          />
        </div>
      )}

      {/* Edit Travel Form */}
      {editingTravel && (
        <div className="p-6 sm:p-8 border-b border-white/5">
          <h3 className="text-lg font-semibold text-white mb-4">Edit Travel</h3>
          <TravelForm
            initialData={editingTravel}
            onSubmit={handleUpdateTravel}
            onCancel={() => setEditingTravel(null)}
            availableTravels={allTravels || travelPlans}
          />
        </div>
      )}

      {/* Travel List */}
      <div className="px-6 sm:px-8 py-6 flex-1 overflow-y-auto">
        {travelPlans.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-white/5 to-white/[0.02] flex items-center justify-center border border-white/10">
              <span className="text-5xl opacity-50">✈️</span>
            </div>
            <h3 className="text-lg font-semibold text-white/80 mb-2">No trips yet</h3>
            <p className="text-sm text-white/40 max-w-xs mx-auto">
              Add your first travel plan to start tracking your adventures
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {travelPlans
              .filter(travel => !travel.parentTravelId) // Only show parent trips
              .map((travel) => {
                // Find sub-trips for this parent
                const subTrips = travelPlans.filter(t => t.parentTravelId === travel.id)
                
                // Use today's date for the manage view since it's not date-specific
                const today = new Date().toISOString().split('T')[0]
                
                return (
                  <TravelPlanCard
                    key={travel.id}
                    plan={travel}
                    currentDate={today}
                    onEdit={onUpdateTravel}
                    onDelete={onDeleteTravel}
                    allTravels={allTravels || travelPlans}
                    subTrips={subTrips}
                    userId={userId}
                    goalId={goalId}
                    showDayProgress={false}
                  />
                )
              })}
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
