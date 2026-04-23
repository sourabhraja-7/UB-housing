'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Listing, FilterState, WalkInfo } from '@/lib/types'
import FilterBar from '@/components/FilterBar'
import ListingCard from '@/components/ListingCard'
import { createClient } from '@/lib/supabase'

const Map = dynamic(() => import('@/components/Map'), { ssr: false })

const DEFAULT_FILTERS: FilterState = {
  type: 'all',
  min_rent: 0,
  max_rent: 9999,
  bedrooms: 'all',
  bathrooms: 'all',
  furnished: null,
  utilities_included: null,
  amenities: [],
  food_preference: null,
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
    sublease_end_date: null,
    lease_duration_months: 12,
    contact_phone: '7165550001',
    contact_name: 'Alex',
    photos: [],
    amenities: ['Wi-Fi', 'Parking', 'Washer/Dryer (Free)'],
    floor_level: 2,
    food_preference: null,
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
    sublease_end_date: '2025-08-15',
    lease_duration_months: 3,
    contact_phone: '7165550002',
    contact_name: 'Priya',
    photos: [],
    amenities: ['Wi-Fi', 'Air Conditioning'],
    floor_level: null,
    food_preference: 'Veg',
    is_active: true,
    edit_token: 'dummy2',
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 18 * 86400000).toISOString(),
  },
]

export default function HomePage() {
  const [listings, setListings] = useState<Listing[]>(DUMMY_LISTINGS)
  const [selected, setSelected] = useState<Listing | null>(null)
  const [walkInfo, setWalkInfo] = useState<WalkInfo | null>(null)
  const [cluster, setCluster] = useState<Listing[] | null>(null)
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)
  const [user, setUser] = useState<any>(null)
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, [])

  useEffect(() => {
    if (!profileOpen) return
    const onClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [profileOpen])

  const handleLogout = async () => {
    setProfileOpen(false)
    await supabase.auth.signOut()
    setUser(null)
    router.refresh()
  }

  const avatarUrl: string | undefined =
    user?.user_metadata?.avatar_url || user?.user_metadata?.picture
  const displayName: string =
    user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || ''
  const initial = displayName.trim().charAt(0).toUpperCase() || 'U'

  const fetchListings = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (filters.type !== 'all') params.set('type', filters.type)
      if (filters.min_rent > 0) params.set('min_rent', String(filters.min_rent))
      if (filters.max_rent < 9999) params.set('max_rent', String(filters.max_rent))
      if (filters.bedrooms !== 'all') params.set('bedrooms', String(filters.bedrooms))
      if (filters.bathrooms !== 'all') params.set('bathrooms', String(filters.bathrooms))
      if (filters.furnished === true) params.set('furnished', 'true')
      if (filters.utilities_included === true) params.set('utilities_included', 'true')

      const res = await fetch(`/api/listings?${params}`)
      if (!res.ok) throw new Error('Failed to fetch')
      let data: Listing[] = await res.json()

      // Client-side filters for amenities and food preference
      if (filters.amenities.length > 0) {
        data = data.filter((l) =>
          filters.amenities.every((a) =>
            l.amenities?.some((la) => la.startsWith(a))
          )
        )
      }
      if (filters.food_preference) {
        data = data.filter((l) => l.food_preference === filters.food_preference)
      }

      setListings(data)
    } catch {
      // Fall back to dummy data if API not yet configured
    }
  }, [filters])

  useEffect(() => {
    fetchListings()
  }, [fetchListings])

  const handlePinClick = useCallback((listings: Listing[], info: WalkInfo | null) => {
    if (listings.length === 1) {
      setSelected(listings[0])
      setWalkInfo(info)
      setCluster(null)
    } else {
      setCluster(listings)
      setSelected(null)
      setWalkInfo(info)
    }
  }, [])

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-zinc-950">
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-40">
        <div className="relative z-10 flex items-center justify-between px-4 py-3 bg-zinc-900/95 backdrop-blur border-b border-zinc-800">
          <div>
            <span className="text-white font-bold text-lg tracking-tight">UB Housing</span>
            <span className="text-zinc-500 text-xs ml-2 hidden sm:inline">University at Buffalo</span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={user ? '/post' : '/login?next=/post'}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
            >
              + Post Listing
            </Link>
            {user && (
              <div ref={profileRef} className="relative">
                <button
                  type="button"
                  onClick={() => setProfileOpen((o) => !o)}
                  aria-label="Profile menu"
                  className="w-10 h-10 rounded-full overflow-hidden bg-zinc-800 border border-zinc-700 hover:border-indigo-500 flex items-center justify-center transition-colors"
                >
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-white text-sm font-semibold">{initial}</span>
                  )}
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl overflow-hidden z-30">
                    <div className="px-4 py-3 border-b border-zinc-800">
                      <p className="text-white text-sm font-semibold truncate">{displayName || 'Signed in'}</p>
                      {user.email && displayName !== user.email && (
                        <p className="text-zinc-500 text-xs truncate">{user.email}</p>
                      )}
                    </div>
                    <Link
                      href="/my-listings"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-zinc-200 hover:bg-zinc-800 transition-colors"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        <polyline points="9 22 9 12 15 12 15 22" />
                      </svg>
                      My Listings
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:bg-zinc-800 transition-colors"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
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
      </div>

      {/* Cluster picker */}
      {cluster && !selected && (
        <div className="absolute bottom-8 right-4 z-20 w-full max-w-sm px-4 sm:px-0">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <p className="text-white font-semibold text-sm">{cluster.length} listings at this location</p>
              <button onClick={() => { setCluster(null); setWalkInfo(null) }} className="text-zinc-400 hover:text-white text-lg leading-none">✕</button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {cluster.map((l) => (
                <button
                  key={l.id}
                  onClick={() => { setSelected(l); setCluster(null) }}
                  className="w-full text-left bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl px-4 py-3 transition-colors"
                >
                  <p className="text-white text-sm font-semibold truncate">{l.title}</p>
                  <p className="text-zinc-400 text-xs mt-0.5">${l.rent.toLocaleString()}/mo · {l.type === 'room_available' ? 'House for Rent' : 'Sublease'}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Selected listing card */}
      {selected && (
        <div className="absolute bottom-8 right-4 z-20 w-full max-w-sm px-4 sm:px-0">
          <ListingCard
            listing={selected}
            walkInfo={walkInfo}
            onClose={() => { setSelected(null); setWalkInfo(null) }}
          />
        </div>
      )}
    </div>
  )
}
