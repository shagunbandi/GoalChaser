'use client'

import { useState } from 'react'
import { Drawer } from '@/sdk'
import { TravelForm } from './TravelForm'
import type { TravelPlan, TravelPlanInput, TravelDayData } from '../types'
import { formatShortDate } from '@/utils'

interface TravelManagerProps {
  isOpen: boolean
  dayData: Record<string, TravelDayData>
  onAddTravel: (travel: TravelPlanInput) => void | Promise<void>
  onUpdateTravel: (travel: TravelPlan) => void | Promise<void>
  onDeleteTravel: (travelId: string) => void | Promise<void>
  onClose: () => void
  allTravels?: TravelPlan[]
}

export function TravelManager({
  isOpen,
  dayData,
  onAddTravel,
  onUpdateTravel,
  onDeleteTravel,
  onClose,
  allTravels,
}: TravelManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingTravel, setEditingTravel] = useState<TravelPlan | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

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

  const handleDeleteTravel = async (travelId: string) => {
    await onDeleteTravel(travelId)
    setDeleteConfirm(null)
  }

  const getTravelDuration = (start: string, end: string) => {
    const startDate = new Date(start)
    const endDate = new Date(end)
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
    return diffDays
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
            {travelPlans.map((travel) => {
              const isSubTrip = !!travel.parentTravelId
              const parentTrip = isSubTrip 
                ? travelPlans.find(t => t.id === travel.parentTravelId)
                : null
              const parentColor = parentTrip?.color || travel.color || '#007AFF'
              
              return (
              <div
                key={travel.id}
                className="
                  group
                  bg-white/[0.04] hover:bg-white/[0.06] backdrop-blur-sm
                  border border-white/10 hover:border-white/15
                  rounded-2xl p-4 sm:p-5
                  transition-all duration-200
                  hover:shadow-lg hover:shadow-black/20
                "
                style={{
                  borderTopWidth: isSubTrip ? '4px' : '1px',
                  borderTopColor: isSubTrip ? parentColor : undefined,
                }}
              >
                {/* Sub-trip header bar */}
                {isSubTrip && parentTrip && (
                  <div 
                    className="mb-3 -mx-4 -mt-4 sm:-mx-5 sm:-mt-5 px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5"
                    style={{
                      backgroundColor: `${parentColor}20`,
                      color: parentColor,
                    }}
                  >
                    <span>📎</span>
                    <span>DURING: {parentTrip.title.toUpperCase()}</span>
                  </div>
                )}
                
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: travel.color || '#007AFF' }}
                      />
                      <h4 className="text-lg font-semibold text-white truncate">
                        {travel.title}
                      </h4>
                    </div>
                    <div className="space-y-1.5 text-sm text-white/60">
                      {travel.destination && (
                        <div className="flex items-center gap-2">
                          <span>📍</span>
                          <span>{travel.destination}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <span>📅</span>
                        <span>
                          {formatShortDate(travel.startDate)} → {formatShortDate(travel.endDate)}
                        </span>
                        <span className="text-xs text-white/40">
                          ({getTravelDuration(travel.startDate, travel.endDate)} days)
                        </span>
                      </div>
                      {travel.note && (
                        <div className="flex items-start gap-2 mt-2">
                          <span>📝</span>
                          <span className="text-white/50 line-clamp-2">{travel.note}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      onClick={() => setEditingTravel(travel)}
                      className="
                        p-2.5 rounded-xl
                        text-white/40 hover:text-[#FF9500] hover:bg-[#FF9500]/10
                        transition-all duration-200
                      "
                      title="Edit travel"
                    >
                      <span className="text-base">✏️</span>
                    </button>
                    {deleteConfirm === travel.id ? (
                      <div className="flex items-center gap-1 ml-1">
                        <button
                          onClick={() => handleDeleteTravel(travel.id)}
                          className="px-3 py-1.5 bg-[#FF3B30] hover:bg-[#FF3B30]/90 text-white text-sm font-medium rounded-lg transition-all"
                        >
                          Delete
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
                        onClick={() => setDeleteConfirm(travel.id)}
                        className="
                          p-2.5 rounded-xl
                          text-white/40 hover:text-[#FF3B30] hover:bg-[#FF3B30]/10
                          transition-all duration-200
                        "
                        title="Delete travel"
                      >
                        <span className="text-base">🗑️</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
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
