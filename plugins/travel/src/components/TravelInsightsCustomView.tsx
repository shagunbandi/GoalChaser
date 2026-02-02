'use client'

import { useState, useMemo } from 'react'
import type { InsightsCustomViewProps } from '@goal-chaser/sdk'
import { InsightsMap } from '@goal-chaser/sdk/ui'
import type { TravelDayData, TravelPlan, TravelConfig } from '../types'
import { getAllTrips, getTravelMapMarkers, getTravelMapPolylines } from '../insights-utils'

export function TravelInsightsCustomView({
  pluginData,
  pluginConfig,
}: InsightsCustomViewProps<TravelDayData, TravelConfig>) {
  const data = (pluginData || {}) as Record<string, TravelDayData>
  const [selectedScope, setSelectedScope] = useState<'all' | string>('all')
  const [showFromBaseLocation, setShowFromBaseLocation] = useState(true)

  const parentTrips = useMemo(() => getAllTrips(data), [data])
  const scopeOpt = selectedScope === 'all' ? undefined : selectedScope
  const markers = useMemo(
    () => getTravelMapMarkers(data, { travelId: scopeOpt }),
    [data, scopeOpt],
  )
  const polylines = useMemo(
    () =>
      getTravelMapPolylines(data, {
        travelId: scopeOpt,
        baseLocation: pluginConfig?.baseLocation,
        includeBaseLocation: showFromBaseLocation,
      }),
    [data, scopeOpt, pluginConfig?.baseLocation, showFromBaseLocation],
  )

  const allPlansForTable = useMemo(() => {
    const planMap = new Map<string, TravelPlan>()
    Object.values(data).forEach((dayData) => {
      dayData?.travelPlans?.forEach((plan) => {
        if (!planMap.has(plan.id)) {
          planMap.set(plan.id, plan)
        }
      })
    })
    return Array.from(planMap.values()).sort(
      (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
    )
  }, [data])

  return (
    <div className="space-y-8">
      {/* Map section */}
      <section className="glass-panel rounded-xl p-6">
        <h3 className="text-base font-semibold text-white/90 mb-4">
          Where you&apos;ve been
        </h3>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
          <label className="flex items-center gap-2 text-sm text-white/70">
            <span>Show:</span>
            <select
              value={selectedScope}
              onChange={(e) =>
                setSelectedScope(e.target.value === 'all' ? 'all' : e.target.value)
              }
              className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white/90 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
            >
              <option value="all">All travels</option>
              {parentTrips.map((trip) => (
                <option key={trip.id} value={trip.id}>
                  {trip.destination || trip.title} ({trip.startDate})
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
            <input
              type="checkbox"
              checked={showFromBaseLocation}
              onChange={(e) => setShowFromBaseLocation(e.target.checked)}
              className="rounded border-white/20 bg-white/5 text-orange-500 focus:ring-orange-500/50"
            />
            <span>Show from base location</span>
          </label>
        </div>
        <InsightsMap
          markers={markers}
          polylines={polylines}
          height="400px"
          className="rounded-xl overflow-hidden"
        />
        {markers.length === 0 && (
          <p className="text-sm text-white/50 mt-3">
            No locations with coordinates. Add destinations with Google autocomplete
            to see them on the map.
          </p>
        )}
      </section>

      {/* Dates & tickets section */}
      <section className="glass-panel rounded-xl p-6">
        <h3 className="text-base font-semibold text-white/90 mb-4">
          All travel dates and tickets
        </h3>
        {allPlansForTable.length === 0 ? (
          <p className="text-sm text-white/50">No travels yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-white/60">
                  <th className="py-2 pr-4 font-medium">Title</th>
                  <th className="py-2 pr-4 font-medium">Destination</th>
                  <th className="py-2 pr-4 font-medium">Start</th>
                  <th className="py-2 pr-4 font-medium">End</th>
                  <th className="py-2 pr-4 font-medium">Notes / Tickets</th>
                  <th className="py-2 font-medium">Files</th>
                </tr>
              </thead>
              <tbody>
                {allPlansForTable.map((plan) => (
                  <tr
                    key={plan.id}
                    className="border-b border-white/5 text-white/80"
                  >
                    <td className="py-3 pr-4">{plan.title}</td>
                    <td className="py-3 pr-4">{plan.destination ?? '—'}</td>
                    <td className="py-3 pr-4">{plan.startDate}</td>
                    <td className="py-3 pr-4">{plan.endDate}</td>
                    <td className="py-3 pr-4 max-w-[200px] truncate">
                      {plan.note ? plan.note : '—'}
                    </td>
                    <td className="py-3">
                      {plan.files && plan.files.length > 0 ? (
                        <ul className="space-y-1">
                          {plan.files.map((f) => (
                            <li key={f.id}>
                              <a
                                href={f.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-orange-400 hover:underline"
                              >
                                {f.name}
                              </a>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
