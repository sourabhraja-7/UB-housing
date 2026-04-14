'use client'

import { useEffect, useRef, useCallback } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { Listing, PIN_COLORS, LISTING_TYPE_LABELS } from '@/lib/types'

const UB_CENTER: [number, number] = [-78.7877, 42.9987]
const DEFAULT_ZOOM = 13

interface MapProps {
  listings: Listing[]
  onPinClick: (listing: Listing) => void
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

  useEffect(() => {
    if (map.current || !mapContainer.current) return

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: UB_CENTER,
      zoom: DEFAULT_ZOOM,
    })

    map.current.addControl(new mapboxgl.NavigationControl(), 'bottom-right')
    map.current.addControl(
      new mapboxgl.GeolocateControl({ positionOptions: { enableHighAccuracy: true }, trackUserLocation: false }),
      'bottom-right'
    )
  }, [])

  useEffect(() => {
    if (!map.current) return

    const addMarkers = () => {
      clearMarkers()
      listings.forEach((listing) => {
        const color = PIN_COLORS[listing.type]

        // Custom pin element
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

        el.addEventListener('click', (e) => {
          e.stopPropagation()
          onPinClick(listing)
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
  }, [listings, selectedId, onPinClick, clearMarkers])

  return <div ref={mapContainer} className="w-full h-full" />
}
