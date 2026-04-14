'use client'

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

interface LocationPickerProps {
  onLocationSelect: (address: string, lat: number, lng: number) => void
  initialAddress?: string
  initialLat?: number | null
  initialLng?: number | null
}

const UB_CENTER: [number, number] = [-78.7877, 42.9987]

export default function LocationPicker({
  onLocationSelect,
  initialAddress = '',
  initialLat,
  initialLng,
}: LocationPickerProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const marker = useRef<mapboxgl.Marker | null>(null)
  const [query, setQuery] = useState(initialAddress)
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  useEffect(() => {
    if (map.current || !mapContainer.current) return
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

    const center: [number, number] =
      initialLng && initialLat ? [initialLng, initialLat] : UB_CENTER

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center,
      zoom: 14,
    })

    if (initialLat && initialLng) {
      marker.current = new mapboxgl.Marker({ color: '#6366f1', draggable: true })
        .setLngLat([initialLng, initialLat])
        .addTo(map.current)

      marker.current.on('dragend', () => {
        const lngLat = marker.current!.getLngLat()
        reverseGeocode(lngLat.lat, lngLat.lng)
      })
    }

    map.current.on('click', (e) => {
      placeMarker(e.lngLat.lat, e.lngLat.lng)
      reverseGeocode(e.lngLat.lat, e.lngLat.lng)
    })
  }, [])

  const placeMarker = (lat: number, lng: number) => {
    if (!map.current) return
    if (marker.current) {
      marker.current.setLngLat([lng, lat])
    } else {
      marker.current = new mapboxgl.Marker({ color: '#6366f1', draggable: true })
        .setLngLat([lng, lat])
        .addTo(map.current)

      marker.current.on('dragend', () => {
        const lngLat = marker.current!.getLngLat()
        reverseGeocode(lngLat.lat, lngLat.lng)
      })
    }
    map.current.flyTo({ center: [lng, lat], zoom: 15 })
  }

  const reverseGeocode = async (lat: number, lng: number) => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${token}&limit=1`
    )
    const data = await res.json()
    const address = data.features?.[0]?.place_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`
    setQuery(address)
    onLocationSelect(address, lat, lng)
  }

  const handleSearch = async (value: string) => {
    setQuery(value)
    if (value.length < 3) { setSuggestions([]); return }

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(value)}.json?access_token=${token}&proximity=${UB_CENTER[0]},${UB_CENTER[1]}&country=US&limit=5`
    )
    const data = await res.json()
    setSuggestions(data.features || [])
    setShowSuggestions(true)
  }

  const handleSelect = (feature: any) => {
    const [lng, lat] = feature.center
    setQuery(feature.place_name)
    setSuggestions([])
    setShowSuggestions(false)
    placeMarker(lat, lng)
    onLocationSelect(feature.place_name, lat, lng)
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          placeholder="Search an address near UB..."
          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
        />
        {showSuggestions && suggestions.length > 0 && (
          <ul className="absolute z-50 w-full bg-zinc-800 border border-zinc-700 rounded-xl mt-1 shadow-xl overflow-hidden">
            {suggestions.map((s) => (
              <li
                key={s.id}
                onMouseDown={() => handleSelect(s)}
                className="px-4 py-2.5 text-sm text-zinc-200 hover:bg-zinc-700 cursor-pointer border-b border-zinc-700/50 last:border-0"
              >
                {s.place_name}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div ref={mapContainer} className="w-full h-48 rounded-xl overflow-hidden border border-zinc-700" />
      <p className="text-zinc-500 text-xs">Click on the map or drag the pin to adjust the location.</p>
    </div>
  )
}
