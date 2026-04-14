'use client'

import { useEffect, useRef, useCallback } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { Listing, PIN_COLORS, WalkInfo } from '@/lib/types'

const UB_CENTER: [number, number] = [-78.7877, 42.9987]
const DEFAULT_ZOOM = 13

// UB South Campus Main Circle bus stop
const BUS_STOP: [number, number] = [-78.819123, 42.954147]

const ROUTE_SOURCE = 'walk-route'
const ROUTE_LAYER  = 'walk-route-line'

interface MapProps {
  listings: Listing[]
  onPinClick: (listing: Listing, walkInfo: WalkInfo | null) => void
  selectedId?: string | null
}

export default function Map({ listings, onPinClick, selectedId }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const markers = useRef<mapboxgl.Marker[]>([])

  const clearMarkers = useCallback(() => {
    markers.current.forEach((m) => m.remove())
    markers.current = []
  }, [])

  const clearRoute = useCallback(() => {
    if (!map.current) return
    if (map.current.getLayer(ROUTE_LAYER))  map.current.removeLayer(ROUTE_LAYER)
    if (map.current.getSource(ROUTE_SOURCE)) map.current.removeSource(ROUTE_SOURCE)
  }, [])

  const fetchAndDrawRoute = useCallback(async (listing: Listing): Promise<WalkInfo | null> => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!
    const url =
      `https://api.mapbox.com/directions/v5/mapbox/walking/` +
      `${listing.longitude},${listing.latitude};${BUS_STOP[0]},${BUS_STOP[1]}` +
      `?geometries=geojson&access_token=${token}`

    try {
      const res  = await fetch(url)
      const data = await res.json()
      const route = data.routes?.[0]
      if (!route) return null

      const walkInfo: WalkInfo = {
        distanceMeters:  route.distance,
        durationSeconds: route.duration,
      }

      if (map.current) {
        clearRoute()
        map.current.addSource(ROUTE_SOURCE, {
          type: 'geojson',
          data: { type: 'Feature', properties: {}, geometry: route.geometry },
        })
        map.current.addLayer({
          id:     ROUTE_LAYER,
          type:   'line',
          source: ROUTE_SOURCE,
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint:  { 'line-color': '#3b82f6', 'line-width': 4, 'line-opacity': 0.85 },
        })
      }

      return walkInfo
    } catch {
      return null
    }
  }, [clearRoute])

  // Initialise map once
  useEffect(() => {
    if (map.current || !mapContainer.current) return

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style:     'mapbox://styles/mapbox/dark-v11',
      center:    UB_CENTER,
      zoom:      DEFAULT_ZOOM,
    })

    map.current.addControl(new mapboxgl.NavigationControl(), 'bottom-right')
    map.current.addControl(
      new mapboxgl.GeolocateControl({ positionOptions: { enableHighAccuracy: true }, trackUserLocation: false }),
      'bottom-right',
    )

    // Bus stop marker
    map.current.on('load', () => {
      const el = document.createElement('div')
      el.title = 'UB South Campus Main Circle — Bus Stop'
      el.innerHTML = `
        <div style="
          background: #f59e0b;
          border: 2.5px solid white;
          border-radius: 6px;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.5);
          font-size: 16px;
          cursor: default;
        ">🚌</div>
      `
      new mapboxgl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat(BUS_STOP)
        .setPopup(
          new mapboxgl.Popup({ offset: 28, closeButton: false })
            .setHTML('<span style="color:#111;font-size:12px;font-weight:600;">UB South Campus<br>Main Circle Bus Stop</span>')
        )
        .addTo(map.current!)
    })
  }, [])

  // Clear route when no listing is selected
  useEffect(() => {
    if (!selectedId && map.current?.isStyleLoaded()) {
      clearRoute()
    }
  }, [selectedId, clearRoute])

  // Draw listing pins
  useEffect(() => {
    if (!map.current) return

    const addMarkers = () => {
      clearMarkers()
      listings.forEach((listing) => {
        const color = PIN_COLORS[listing.type]

        const el = document.createElement('div')
        el.className = 'cursor-pointer transition-transform hover:scale-110'
        el.innerHTML = `
          <div style="
            background:${color};
            border: 2.5px solid white;
            border-radius: 50% 50% 50% 0;
            width: 28px;
            height: 28px;
            transform: rotate(-45deg);
            box-shadow: 0 2px 8px rgba(0,0,0,0.4);
            ${selectedId === listing.id ? 'outline: 3px solid white; outline-offset: 2px;' : ''}
          "></div>
        `

        el.addEventListener('click', async (e) => {
          e.stopPropagation()
          clearRoute()
          const walkInfo = await fetchAndDrawRoute(listing)
          onPinClick(listing, walkInfo)
        })

        const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat([listing.longitude, listing.latitude])
          .addTo(map.current!)

        markers.current.push(marker)
      })
    }

    if (map.current.isStyleLoaded()) {
      addMarkers()
    } else {
      map.current.once('load', addMarkers)
    }
  }, [listings, selectedId, onPinClick, clearMarkers, clearRoute, fetchAndDrawRoute])

  return <div ref={mapContainer} className="w-full h-full" />
}
