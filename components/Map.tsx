'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { loadGoogleMaps } from '@/lib/googleMaps'
import { Listing, PIN_COLORS, WalkInfo } from '@/lib/types'

const UB_CENTER = { lat: 42.9987, lng: -78.7877 }
const DEFAULT_ZOOM = 13

// UB South Campus Main Circle bus stop
const BUS_STOP = { lat: 42.954147, lng: -78.819123 }

const DARK_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#212121' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#212121' }] },
  { featureType: 'administrative.country', elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] },
  { featureType: 'administrative.land_parcel', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#bdbdbd' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#181818' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
  { featureType: 'road', elementType: 'geometry.fill', stylers: [{ color: '#2c2c2c' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#8a8a8a' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#373737' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#3c3c3c' }] },
  { featureType: 'road.local', elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
  { featureType: 'transit', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#000000' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#3d3d3d' }] },
]

interface MapProps {
  listings: Listing[]
  onPinClick: (listing: Listing, walkInfo: WalkInfo | null) => void
  selectedId?: string | null
}

function pinIcon(color: string, selected: boolean): google.maps.Icon {
  const strokeWidth = selected ? 4 : 2.5
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="34" height="44" viewBox="0 0 34 44">
  <path d="M17 2 C8 2 2 9 2 17 c0 11 15 25 15 25 s15-14 15-25 C32 9 26 2 17 2z"
        fill="${color}" stroke="#ffffff" stroke-width="${strokeWidth}"/>
  <circle cx="17" cy="17" r="5" fill="#ffffff"/>
</svg>`.trim()
  return {
    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
    scaledSize: new google.maps.Size(34, 44),
    anchor: new google.maps.Point(17, 44),
  }
}

function busStopIcon(): google.maps.Icon {
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="38" height="38" viewBox="0 0 38 38">
  <rect x="3" y="3" width="32" height="32" rx="6" fill="#f59e0b" stroke="#ffffff" stroke-width="2.5"/>
  <text x="19" y="26" font-size="18" text-anchor="middle">🚌</text>
</svg>`.trim()
  return {
    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
    scaledSize: new google.maps.Size(38, 38),
    anchor: new google.maps.Point(19, 38),
  }
}

export default function Map({ listings, onPinClick, selectedId }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<google.maps.Map | null>(null)
  const markers = useRef<google.maps.Marker[]>([])
  const routeRenderer = useRef<google.maps.DirectionsRenderer | null>(null)
  const directionsService = useRef<google.maps.DirectionsService | null>(null)
  const [mapReady, setMapReady] = useState(false)

  const clearMarkers = useCallback(() => {
    markers.current.forEach((m) => m.setMap(null))
    markers.current = []
  }, [])

  const clearRoute = useCallback(() => {
    if (routeRenderer.current) {
      routeRenderer.current.setMap(null)
      routeRenderer.current = null
    }
  }, [])

  const fetchAndDrawRoute = useCallback(async (listing: Listing): Promise<WalkInfo | null> => {
    if (!map.current || !directionsService.current) return null
    try {
      const result = await directionsService.current.route({
        origin: { lat: listing.latitude, lng: listing.longitude },
        destination: BUS_STOP,
        travelMode: google.maps.TravelMode.WALKING,
      })
      const leg = result.routes?.[0]?.legs?.[0]
      if (!leg) return null

      clearRoute()
      routeRenderer.current = new google.maps.DirectionsRenderer({
        map: map.current,
        directions: result,
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: '#3b82f6',
          strokeWeight: 4,
          strokeOpacity: 0.85,
        },
      })

      return {
        distanceMeters: leg.distance?.value ?? 0,
        durationSeconds: leg.duration?.value ?? 0,
      }
    } catch {
      return null
    }
  }, [clearRoute])

  // Initialise map once
  useEffect(() => {
    if (map.current || !mapContainer.current) return
    let cancelled = false

    loadGoogleMaps().then(() => {
      if (cancelled || !mapContainer.current) return

      map.current = new google.maps.Map(mapContainer.current, {
        center: UB_CENTER,
        zoom: DEFAULT_ZOOM,
        styles: DARK_STYLE,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControlOptions: { position: google.maps.ControlPosition.RIGHT_BOTTOM },
      })

      directionsService.current = new google.maps.DirectionsService()

      const busMarker = new google.maps.Marker({
        map: map.current,
        position: BUS_STOP,
        icon: busStopIcon(),
        title: 'UB South Campus Main Circle — Bus Stop',
      })
      const busInfo = new google.maps.InfoWindow({
        content:
          '<div style="color:#111;font-size:12px;font-weight:600;">UB South Campus<br/>Main Circle Bus Stop</div>',
      })
      busMarker.addListener('click', () => busInfo.open({ map: map.current!, anchor: busMarker }))

      setMapReady(true)
    })

    return () => { cancelled = true }
  }, [])

  // Clear route when nothing is selected
  useEffect(() => {
    if (!selectedId) clearRoute()
  }, [selectedId, clearRoute])

  // Draw listing pins
  useEffect(() => {
    if (!mapReady || !map.current) return

    clearMarkers()
    listings.forEach((listing) => {
      const color = PIN_COLORS[listing.type]
      const marker = new google.maps.Marker({
        map: map.current!,
        position: { lat: listing.latitude, lng: listing.longitude },
        icon: pinIcon(color, selectedId === listing.id),
      })
      marker.addListener('click', async () => {
        clearRoute()
        const walkInfo = await fetchAndDrawRoute(listing)
        onPinClick(listing, walkInfo)
      })
      markers.current.push(marker)
    })
  }, [mapReady, listings, selectedId, onPinClick, clearMarkers, clearRoute, fetchAndDrawRoute])

  return <div ref={mapContainer} className="w-full h-full" />
}
