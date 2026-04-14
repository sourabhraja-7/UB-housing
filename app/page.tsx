'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Listing, FilterState } from '@/lib/types'
import FilterBar from '@/components/FilterBar'
import ListingCard from '@/components/ListingCard'

const Map = dynamic(() => import('@/components/Map'), { ssr: false })

const DEFAULT_FILTERS: FilterState = {
  type: 'all',
  min_rent: 0,
  max_rent: 9999,
  bedrooms: 'all',
  furnished: null,
  utilities_included: null,
}

// Dummy listings so the map works before Supabase is connected
const DUMMY_LISTINGS: Listing[] = [
  {
    id: '1',
    type: 'room_available',
    title: '1 BED in 3BHK near South Campus',
    description: 'Quiet street, close to UB South Campus. Shared kitchen and living room.',
    rent: 650,
    bedrooms: 1,
    bathrooms: 1,
    address: '123 Winspear Ave, Buffalo, NY 14214',
    latitude: 42.9936,
    longitude: -78.7969,
    furnished: true,
    utilities_included: false,
    gender_preference: 'any',
    available_date: '2025-08-01',
    lease_duration_months: 12,
    contact_phone: '7165550001',
    contact_name: 'Alex',
    photos: [],
    is_active: true,
    edit_token: 'dummy',
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 25 * 86400000).toISOString(),
  },
  {
    id: '2',
    type: 'sublease',
    title: 'Sublease: Studio near North Campus',
    description: 'Going home for summer, subletting my studio May–Aug.',
    rent: 800,
    bedrooms: 1,
    bathrooms: 1,
    address: '45 Rensch Rd, Amherst, NY 14226',
    latitude: 43.0023,
    longitude: -78.7801,
    furnished: true,
    utilities_included: true,
    gender_preference: 'any',
    available_date: '2025-05-15',
    lease_duration_months: 3,
    contact_phone: '7165550002',
    contact_name: 'Priya',
    photos: [],
    is_active: true,
    edit_token: 'dummy2',
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 18 * 86400000).toISOString(),
  },
  {
    id: '3',
    type: 'roommate_needed',
    title: 'Looking for female roommate — 2BHK',
    description: 'We have a spare room in a 2BHK. Female preferred. Very clean apartment.',
    rent: 550,
    bedrooms: 2,
    bathrooms: 1,
    address: '890 Main St, Buffalo, NY 14203',
    latitude: 42.9875,
    longitude: -78.7755,
    furnished: false,
    utilities_included: false,
    gender_preference: 'female',
    available_date: '2025-06-01',
    lease_duration_months: 6,
    contact_phone: '7165550003',
    contact_name: 'Meera',
    photos: [],
    is_active: true,
    edit_token: 'dummy3',
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 29 * 86400000).toISOString(),
  },
]

export default function HomePage() {
  const [listings, setListings] = useState<Listing[]>(DUMMY_LISTINGS)
  const [selected, setSelected] = useState<Listing | null>(null)
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)
  const [loading, setLoading] = useState(false)

  const fetchListings = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.type !== 'all') params.set('type', filters.type)
      if (filters.min_rent > 0) params.set('min_rent', String(filters.min_rent))
      if (filters.max_rent < 9999) params.set('max_rent', String(filters.max_rent))
      if (filters.bedrooms !== 'all') params.set('bedrooms', String(filters.bedrooms))
      if (filters.furnished === true) params.set('furnished', 'true')
      if (filters.utilities_included === true) params.set('utilities_included', 'true')

      const res = await fetch(`/api/listings?${params}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0) setListings(data)
    } catch {
      // Fall back to dummy data if API not yet configured
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchListings()
  }, [fetchListings])

  const handlePinClick = useCallback((listing: Listing) => {
    setSelected(listing)
  }, [])

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-zinc-950">
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-10">
        <div className="flex items-center justify-between px-4 py-3 bg-zinc-900/95 backdrop-blur border-b border-zinc-800">
          <div>
            <span className="text-white font-bold text-lg tracking-tight">UB Housing</span>
            <span className="text-zinc-500 text-xs ml-2 hidden sm:inline">University at Buffalo</span>
          </div>
          <Link
            href="/post"
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            + Post Listing
          </Link>
        </div>
        <FilterBar filters={filters} onChange={setFilters} count={listings.length} />
      </div>

      {/* Map */}
      <div className="absolute inset-0 pt-[88px]">
        <Map listings={listings} onPinClick={handlePinClick} selectedId={selected?.id} />
      </div>

      {/* Legend */}
      <div className="absolute bottom-8 left-4 z-10 flex gap-3 bg-zinc-900/90 backdrop-blur border border-zinc-800 rounded-xl px-3 py-2">
        <span className="flex items-center gap-1.5 text-xs text-zinc-300">
          <span className="w-3 h-3 rounded-full bg-green-500 inline-block" /> Room Available
        </span>
        <span className="flex items-center gap-1.5 text-xs text-zinc-300">
          <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" /> Sublease
        </span>
        <span className="flex items-center gap-1.5 text-xs text-zinc-300">
          <span className="w-3 h-3 rounded-full bg-orange-500 inline-block" /> Roommate Needed
        </span>
      </div>

      {/* Selected listing card */}
      {selected && (
        <div className="absolute bottom-8 right-4 z-20 w-full max-w-sm px-4 sm:px-0">
          <ListingCard listing={selected} onClose={() => setSelected(null)} />
        </div>
      )}
    </div>
  )
}
