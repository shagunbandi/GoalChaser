'use client'

import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

export interface InsightsMapMarker {
  lat: number
  lng: number
  label?: string
  id?: string
}

// Fix default marker icon in react-leaflet (required when bundling)
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})
L.Marker.prototype.options.icon = DefaultIcon

const DEFAULT_CENTER = { lat: 20, lng: 0 }
const DEFAULT_ZOOM = 2

/** One polyline = array of points in order */
export type InsightsMapPolyline = Array<{ lat: number; lng: number }>

function FitBounds({
  markers,
  polylines,
}: {
  markers: Array<{ lat: number; lng: number }>
  polylines: InsightsMapPolyline[]
}) {
  const map = useMap()
  const allPoints = [
    ...markers.map((m) => [m.lat, m.lng] as L.LatLngTuple),
    ...polylines.flat().map((p) => [p.lat, p.lng] as L.LatLngTuple),
  ]
  if (allPoints.length < 2) return null
  const bounds = L.latLngBounds(allPoints)
  map.fitBounds(bounds, { padding: [20, 20], maxZoom: 12 })
  return null
}

export interface InsightsMapInnerProps {
  markers: Array<{ lat: number; lng: number; label?: string; id?: string }>
  /** Lines to draw (each array is a sequence of points) */
  polylines?: InsightsMapPolyline[]
  center?: { lat: number; lng: number }
  zoom?: number
  height?: string
  className?: string
}

const POLYLINE_COLOR = '#F97316'
const POLYLINE_WEIGHT = 3

export function InsightsMapInner({
  markers,
  polylines = [],
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  height = '400px',
  className = '',
}: InsightsMapInnerProps) {
  const hasMarkers = markers.length > 0
  const hasPolylines = polylines.some((line) => line.length >= 2)
  const hasContent = hasMarkers || hasPolylines
  const mapCenter = hasMarkers
    ? { lat: markers[0].lat, lng: markers[0].lng }
    : hasPolylines && polylines[0]?.length
      ? { lat: polylines[0][0].lat, lng: polylines[0][0].lng }
      : center

  return (
    <div className={className} style={{ height }}>
      <MapContainer
        center={mapCenter}
        zoom={zoom}
        style={{ height: '100%', width: '100%', borderRadius: '0.75rem' }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {polylines.map(
          (positions, lineIndex) =>
            positions.length >= 2 && (
              <Polyline
                key={`line-${lineIndex}`}
                positions={positions.map((p) => [p.lat, p.lng] as [number, number])}
                pathOptions={{ color: POLYLINE_COLOR, weight: POLYLINE_WEIGHT }}
              />
            ),
        )}
        {markers.map((marker, index) => (
          <Marker key={marker.id ?? index} position={[marker.lat, marker.lng]}>
            {(marker.label ?? marker.id) && (
              <Popup>{marker.label ?? marker.id}</Popup>
            )}
          </Marker>
        ))}
        {hasContent && (markers.length >= 2 || polylines.flat().length >= 2) && (
          <FitBounds markers={markers} polylines={polylines} />
        )}
      </MapContainer>
    </div>
  )
}
