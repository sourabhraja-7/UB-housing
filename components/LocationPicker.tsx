'use client'

import { useEffect, useRef, useState } from 'react'
import { loadGoogleMaps, getMapId, readStoredTheme } from '@/lib/googleMaps'

interface LocationPickerProps {
  onLocationSelect: (address: string, lat: number, lng: number) => void
  initialAddress?: string
  initialLat?: number | null
  initialLng?: number | null
}

const UB_CENTER = { lat: 42.9987, lng: -78.7877 }

function buildDraggablePin(): HTMLElement {
  const wrapper = document.createElement('div')
  wrapper.style.cssText = `
    width: 32px;
    height: 42px;
    transform-origin: bottom center;
    transition: transform 0.15s ease;
  `
  wrapper.innerHTML = `
    <svg width="32" height="42" viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 2 C8 2 2 8 2 16 c0 10 14 24 14 24 s14-14 14-24 C30 8 24 2 16 2z"
            fill="#6366f1"
            stroke="#ffffff"
            stroke-width="3"
            filter="drop-shadow(0 3px 6px rgba(0,0,0,0.45))"/>
      <circle cx="16" cy="16" r="5" fill="#ffffff"/>
    </svg>
  `
  return wrapper
}

function readLatLng(
  pos:
    | google.maps.LatLng
    | google.maps.LatLngLiteral
    | google.maps.LatLngAltitude
    | google.maps.LatLngAltitudeLiteral
    | null
    | undefined,
): { lat: number; lng: number } | null {
  if (!pos) return null
  const lat = typeof pos.lat === 'function' ? pos.lat() : (pos as google.maps.LatLngLiteral).lat
  const lng = typeof pos.lng === 'function' ? pos.lng() : (pos as google.maps.LatLngLiteral).lng
  return { lat, lng }
}

export default function LocationPicker({
  onLocationSelect,
  initialAddress = '',
  initialLat,
  initialLng,
}: LocationPickerProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<google.maps.Map | null>(null)
  const marker = useRef<google.maps.marker.AdvancedMarkerElement | null>(null)
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null)
  const geocoder = useRef<google.maps.Geocoder | null>(null)
  const sessionToken = useRef<google.maps.places.AutocompleteSessionToken | null>(null)
  const [query, setQuery] = useState(initialAddress)
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompletePrediction[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  const reverseGeocode = (lat: number, lng: number) => {
    if (!geocoder.current) return
    geocoder.current.geocode({ location: { lat, lng } }, (results, status) => {
      const address =
        status === 'OK' && results?.[0]?.formatted_address
          ? results[0].formatted_address
          : `${lat.toFixed(5)}, ${lng.toFixed(5)}`
      setQuery(address)
      onLocationSelect(address, lat, lng)
    })
  }

  const placeMarker = (lat: number, lng: number) => {
    if (!map.current) return
    if (marker.current) {
      marker.current.position = { lat, lng }
    } else {
      marker.current = new google.maps.marker.AdvancedMarkerElement({
        map: map.current,
        position: { lat, lng },
        content: buildDraggablePin(),
        gmpDraggable: true,
      })
      marker.current.addListener('dragend', () => {
        const latLng = readLatLng(marker.current!.position)
        if (latLng) reverseGeocode(latLng.lat, latLng.lng)
      })
    }
    map.current.panTo({ lat, lng })
    if ((map.current.getZoom() ?? 0) < 15) map.current.setZoom(15)
  }

  useEffect(() => {
    if (map.current || !mapContainer.current) return
    let cancelled = false

    loadGoogleMaps().then(() => {
      if (cancelled || !mapContainer.current) return

      const center =
        initialLat && initialLng ? { lat: initialLat, lng: initialLng } : UB_CENTER

      map.current = new google.maps.Map(mapContainer.current, {
        center,
        zoom: 14,
        mapId: getMapId(),
        colorScheme:
          readStoredTheme() === 'dark'
            ? google.maps.ColorScheme.DARK
            : google.maps.ColorScheme.LIGHT,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        clickableIcons: false,
      })

      geocoder.current = new google.maps.Geocoder()
      autocompleteService.current = new google.maps.places.AutocompleteService()
      sessionToken.current = new google.maps.places.AutocompleteSessionToken()

      if (initialLat && initialLng) {
        placeMarker(initialLat, initialLng)
      }

      map.current.addListener('click', (e: google.maps.MapMouseEvent) => {
        if (!e.latLng) return
        const lat = e.latLng.lat()
        const lng = e.latLng.lng()
        placeMarker(lat, lng)
        reverseGeocode(lat, lng)
      })
    })

    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSearch = (value: string) => {
    setQuery(value)
    if (value.length < 3 || !autocompleteService.current) {
      setSuggestions([])
      return
    }
    autocompleteService.current.getPlacePredictions(
      {
        input: value,
        locationBias: {
          center: UB_CENTER,
          radius: 20000,
        } as google.maps.CircleLiteral,
        componentRestrictions: { country: 'us' },
        sessionToken: sessionToken.current ?? undefined,
      },
      (preds) => {
        setSuggestions(preds ?? [])
        setShowSuggestions(true)
      },
    )
  }

  const handleSelect = (pred: google.maps.places.AutocompletePrediction) => {
    if (!geocoder.current) return
    geocoder.current.geocode({ placeId: pred.place_id }, (results, status) => {
      if (status !== 'OK' || !results?.[0]?.geometry?.location) return
      const loc = results[0].geometry.location
      const address = results[0].formatted_address ?? pred.description
      const lat = loc.lat()
      const lng = loc.lng()
      setQuery(address)
      setSuggestions([])
      setShowSuggestions(false)
      placeMarker(lat, lng)
      onLocationSelect(address, lat, lng)
      sessionToken.current = new google.maps.places.AutocompleteSessionToken()
    })
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
                key={s.place_id}
                onMouseDown={() => handleSelect(s)}
                className="px-4 py-2.5 text-sm text-zinc-200 hover:bg-zinc-700 cursor-pointer border-b border-zinc-700/50 last:border-0"
              >
                {s.description}
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
