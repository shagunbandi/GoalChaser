'use client'

import dynamic from 'next/dynamic'

// Re-export marker and polyline types for plugins
export type { InsightsMapMarker, InsightsMapPolyline } from './InsightsMapInner'

// Load Leaflet map only on client to avoid SSR issues
const InsightsMapInner = dynamic(
  () => import('./InsightsMapInner').then((m) => m.InsightsMapInner),
  { ssr: false },
)

export interface InsightsMapProps {
  markers: Array<{ lat: number; lng: number; label?: string; id?: string }>
  /** Lines to draw (each array is a sequence of points in order) */
  polylines?: Array<Array<{ lat: number; lng: number }>>
  center?: { lat: number; lng: number }
  zoom?: number
  height?: string
  className?: string
}

export function InsightsMap({
  markers,
  polylines,
  center,
  zoom,
  height = '400px',
  className = '',
}: InsightsMapProps) {
  return (
    <InsightsMapInner
      markers={markers}
      polylines={polylines}
      center={center}
      zoom={zoom}
      height={height}
      className={className}
    />
  )
}
