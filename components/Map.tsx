'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { loadGoogleMaps, getMapId, readStoredTheme, storeTheme, MapTheme } from '@/lib/googleMaps'
import { Listing, PIN_COLORS, WalkInfo } from '@/lib/types'

const UB_CENTER = { lat: 42.9987, lng: -78.7877 }
const DEFAULT_ZOOM = 13

function nearestBusStop(lat: number, lng: number) {
  let nearest = BUS_STOPS[0]
  let minDist = Infinity
  for (const stop of BUS_STOPS) {
    const dlat = stop.lat - lat
    const dlng = stop.lng - lng
    const dist = dlat * dlat + dlng * dlng
    if (dist < minDist) { minDist = dist; nearest = stop }
  }
  return nearest
}

const BUS_STOPS = [
  { lat: 42.954147, lng: -78.819123, name: 'UB South Campus Main Circle' },
  { lat: 42.956778, lng: -78.815889, name: 'Goodyear' },
  { lat: 42.965919, lng: -78.811203, name: 'Maynard' },
  { lat: 42.980575, lng: -78.797778, name: 'Hartford Rd' },
  { lat: 42.992853, lng: -78.792090, name: 'Service Center' },
  { lat: 43.000028, lng: -78.788872, name: 'Flint Loop' },
]

interface MapProps {
  listings: Listing[]
  onPinClick: (listings: Listing[], walkInfo: WalkInfo | null) => void
  selectedId?: string | null
}

function buildListingPin(color: string, selected: boolean, count: number = 1): HTMLElement {
  const wrapper = document.createElement('div')
  wrapper.style.cssText = `
    width: 32px;
    height: ${count > 1 ? '52px' : '42px'};
    cursor: pointer;
    transform-origin: bottom center;
    transition: transform 0.15s ease, filter 0.15s ease;
    will-change: transform;
    position: relative;
  `
  wrapper.innerHTML = `
    <svg width="32" height="42" viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 2 C8 2 2 8 2 16 c0 10 14 24 14 24 s14-14 14-24 C30 8 24 2 16 2z"
            fill="${color}"
            stroke="#ffffff"
            stroke-width="${selected ? 4 : 3}"
            filter="drop-shadow(0 3px 6px rgba(0,0,0,0.45))"/>
      <circle cx="16" cy="16" r="5" fill="#ffffff"/>
      ${selected ? '<circle cx="16" cy="16" r="18" fill="none" stroke="#ffffff" stroke-width="2" stroke-opacity="0.85"/>' : ''}
    </svg>
    ${count > 1 ? `
    <div style="
      position: absolute;
      top: -6px;
      right: -6px;
      background: #f59e0b;
      color: #fff;
      font-size: 10px;
      font-weight: 800;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid #fff;
      box-shadow: 0 2px 4px rgba(0,0,0,0.4);
    ">${count}</div>` : ''}
  `
  wrapper.addEventListener('mouseenter', () => {
    wrapper.style.transform = 'scale(1.15)'
    wrapper.style.filter = 'brightness(1.1)'
  })
  wrapper.addEventListener('mouseleave', () => {
    wrapper.style.transform = 'scale(1)'
    wrapper.style.filter = 'none'
  })
  return wrapper
}

function buildBusStopPin(): HTMLElement {
  const el = document.createElement('div')
  el.style.cssText = `
    width: 50px;
    height: 50px;
    box-sizing: border-box;
    border-radius: 50%;
    background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 50%, #1d4ed8 100%);
    border: 3px solid #ffffff;
    box-shadow: 0 4px 14px rgba(0,0,0,0.55), 0 0 0 1px rgba(59,130,246,0.35);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transform-origin: bottom center;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
    will-change: transform;
  `
  el.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="#ffffff" style="margin-top: 2px;">
      <path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z"/>
    </svg>
    <span style="
      color: #ffffff;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.4px;
      line-height: 1;
      margin-top: 1px;
      text-shadow: 0 1px 2px rgba(0,0,0,0.3);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
    ">UB</span>
  `
  el.addEventListener('mouseenter', () => {
    el.style.transform = 'scale(1.12)'
    el.style.boxShadow = '0 6px 20px rgba(0,0,0,0.6), 0 0 0 2px rgba(59,130,246,0.5)'
  })
  el.addEventListener('mouseleave', () => {
    el.style.transform = 'scale(1)'
    el.style.boxShadow = '0 4px 14px rgba(0,0,0,0.55), 0 0 0 1px rgba(59,130,246,0.35)'
  })
  return el
}

export default function Map({ listings, onPinClick, selectedId }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<google.maps.Map | null>(null)
  const markers = useRef<google.maps.marker.AdvancedMarkerElement[]>([])
  const routeRenderer = useRef<google.maps.DirectionsRenderer | null>(null)
  const directionsService = useRef<google.maps.DirectionsService | null>(null)
  const [mapReady, setMapReady] = useState(0)
  const [theme, setTheme] = useState<MapTheme>('dark')

  // Load stored theme after mount (avoids SSR/hydration mismatch)
  useEffect(() => {
    setTheme(readStoredTheme())
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next: MapTheme = prev === 'dark' ? 'light' : 'dark'
      storeTheme(next)
      return next
    })
  }, [])

  const clearMarkers = useCallback(() => {
    markers.current.forEach((m) => { m.map = null })
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
      const stop = nearestBusStop(listing.latitude, listing.longitude)
      const result = await directionsService.current.route({
        origin: { lat: listing.latitude, lng: listing.longitude },
        destination: { lat: stop.lat, lng: stop.lng },
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
          strokeColor: '#60a5fa',
          strokeWeight: 5,
          strokeOpacity: 0.9,
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

  // Build / rebuild map whenever theme changes
  useEffect(() => {
    if (!mapContainer.current) return
    let cancelled = false

    map.current = null
    clearMarkers()
    clearRoute()

    loadGoogleMaps().then(() => {
      if (cancelled || !mapContainer.current) return

      map.current = new google.maps.Map(mapContainer.current, {
        center: UB_CENTER,
        zoom: DEFAULT_ZOOM,
        mapId: getMapId(),
        colorScheme:
          theme === 'dark'
            ? google.maps.ColorScheme.DARK
            : google.maps.ColorScheme.LIGHT,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        clickableIcons: false,
        zoomControlOptions: { position: google.maps.ControlPosition.RIGHT_BOTTOM },
      })

      directionsService.current = new google.maps.DirectionsService()

      BUS_STOPS.forEach((stop) => {
        const busMarker = new google.maps.marker.AdvancedMarkerElement({
          map: map.current!,
          position: { lat: stop.lat, lng: stop.lng },
          content: buildBusStopPin(),
          title: `${stop.name} — Bus Stop`,
        })
        const busInfo = new google.maps.InfoWindow({
          content: `<div style="color:#111;font-size:12px;font-weight:600;padding:2px 4px;">${stop.name}<br/>Bus Stop</div>`,
        })
        busMarker.addListener('click', () => busInfo.open({ map: map.current!, anchor: busMarker }))
      })

      setMapReady(n => n + 1)
    })

    return () => { cancelled = true }
  }, [theme, clearMarkers, clearRoute])

  // Clear route when nothing is selected
  useEffect(() => {
    if (!selectedId) clearRoute()
  }, [selectedId, clearRoute])

  // Draw listing pins
  useEffect(() => {
    if (!mapReady || !map.current) return

    clearMarkers()

    // Group by exact coordinates
    const clusters: Record<string, Listing[]> = {}
    for (const l of listings) {
      const key = `${l.latitude},${l.longitude}`
      if (!clusters[key]) clusters[key] = []
      clusters[key].push(l)
    }

    Object.values(clusters).forEach((cluster: Listing[]) => {
      const first = cluster[0]
      const color = PIN_COLORS[first.type]
      const isSelected = cluster.some((l: Listing) => l.id === selectedId)
      const marker = new google.maps.marker.AdvancedMarkerElement({
        map: map.current!,
        position: { lat: first.latitude, lng: first.longitude },
        content: buildListingPin(color, isSelected, cluster.length),
      })
      marker.addListener('click', async () => {
        clearRoute()
        const walkInfo = await fetchAndDrawRoute(first)
        onPinClick(cluster, walkInfo)
      })
      markers.current.push(marker)
    })
  }, [mapReady, listings, selectedId, onPinClick, clearMarkers, clearRoute, fetchAndDrawRoute])

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="absolute inset-0" />
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700 backdrop-blur shadow-xl text-lg transition-colors"
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>
    </div>
  )
}
