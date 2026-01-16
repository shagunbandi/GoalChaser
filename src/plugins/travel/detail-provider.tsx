'use client'

import type { ReactNode } from 'react'
import type { PluginDetailProvider } from '@/sdk'
import type { TravelDayData } from './types'

export class TravelDetailProviderImpl implements PluginDetailProvider<TravelDayData> {
  renderDetail(
    data: TravelDayData | null,
    date: string,
    onUpdate: (updates: Partial<TravelDayData>) => Promise<void>
  ): ReactNode {
    const plans = data?.travelPlans || []
    
    if (plans.length === 0) {
      return (
        <div className="text-center text-white/40 py-8">
          <div className="text-4xl mb-2">✈️</div>
          <p>No travel plans for this day</p>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white/90">Travel Plans</h3>
        {plans.map((plan) => (
          <div
            key={plan.id}
            className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2"
          >
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-medium text-white/90">{plan.title}</h4>
                {plan.destination && (
                  <p className="text-sm text-white/60">{plan.destination}</p>
                )}
              </div>
              {plan.color && (
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: plan.color }}
                />
              )}
            </div>
            
            <div className="text-sm text-white/60">
              <div>From: {new Date(plan.startDate).toLocaleDateString()}</div>
              <div>To: {new Date(plan.endDate).toLocaleDateString()}</div>
            </div>
            
            {plan.note && (
              <div className="text-sm text-white/70 pt-2 border-t border-white/10">
                {plan.note}
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }
}
