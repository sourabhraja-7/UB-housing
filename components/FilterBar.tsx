'use client'

import { useState, useRef, useEffect } from 'react'
import { FilterState, ListingType } from '@/lib/types'

const AMENITIES = [
  'Dishwasher', 'Washer/Dryer', 'Oven', 'Microwave', 'AC', 'Heating',
  'Wi-Fi', 'TV', 'Carpet Flooring', 'Hardwood Flooring', 'Parking',
  'Balcony', 'Gym Access', 'Pet Friendly',
]

const FOOD_PREFS = ['Veg', 'Non-Veg', 'Eggetarian', 'No Preference']

interface FilterBarProps {
  filters: FilterState
  onChange: (f: FilterState) => void
  count: number
}

export default function FilterBar({ filters, onChange, count }: FilterBarProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [rentOpen, setRentOpen] = useState(false)
  const rentRef = useRef<HTMLDivElement>(null)

  const update = (partial: Partial<FilterState>) => onChange({ ...filters, ...partial })

  const toggleAmenity = (a: string) => {
    const next = filters.amenities.includes(a)
      ? filters.amenities.filter((x) => x !== a)
      : [...filters.amenities, a]
    update({ amenities: next })
  }

  const hasRentFilter = filters.min_rent > 0 || filters.max_rent < 9999
  const rentLabel = hasRentFilter
    ? `$${filters.min_rent > 0 ? filters.min_rent : '0'} – $${filters.max_rent < 9999 ? filters.max_rent : '∞'}`
    : 'Rent Range'

  const moreActiveCount = [
    filters.furnished === true,
    filters.utilities_included === true,
    filters.amenities.length > 0,
    filters.food_preference !== null,
  ].filter(Boolean).length

  const chipCls = (active: boolean) =>
    `px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors whitespace-nowrap cursor-pointer select-none ${
      active
        ? 'bg-indigo-600 border-indigo-500 text-white'
        : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700'
    }`

  // Close rent popover on outside click
  useEffect(() => {
    if (!rentOpen) return
    const handler = (e: MouseEvent) => {
      if (rentRef.current && !rentRef.current.contains(e.target as Node)) {
        setRentOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [rentOpen])

  return (
    <>
      {/* Filter bar */}
      <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900/90 backdrop-blur border-b border-zinc-800 overflow-x-auto scrollbar-none">
        {/* Type */}
        <select
          value={filters.type}
          onChange={(e) => update({ type: e.target.value as ListingType | 'all' })}
          className="bg-zinc-800 text-zinc-200 text-xs rounded-full px-3 py-1.5 border border-zinc-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 whitespace-nowrap flex-shrink-0"
        >
          <option value="all">All Types</option>
          <option value="room_available">Houses for Rent</option>
          <option value="sublease">Sublease</option>
        </select>

        {/* Bathrooms */}
        <select
          value={filters.bathrooms}
          onChange={(e) => update({ bathrooms: e.target.value === 'all' ? 'all' : parseInt(e.target.value) })}
          className="bg-zinc-800 text-zinc-200 text-xs rounded-full px-3 py-1.5 border border-zinc-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 whitespace-nowrap flex-shrink-0"
        >
          <option value="all">Any Bath</option>
          <option value="1">1 Bath</option>
          <option value="2">2 Bath</option>
          <option value="3">3 Bath</option>
        </select>

        {/* Rent Range pill + popover */}
        <div className="relative flex-shrink-0" ref={rentRef}>
          <button
            onClick={() => setRentOpen((o) => !o)}
            className={chipCls(hasRentFilter)}
          >
            {rentLabel}
          </button>
          {rentOpen && (
            <div className="absolute top-full left-0 mt-2 bg-zinc-900 border border-zinc-700 rounded-2xl p-4 shadow-xl z-40 w-56">
              <p className="text-xs text-zinc-500 uppercase tracking-wide mb-3">Rent Range / month</p>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <p className="text-zinc-500 text-xs mb-1">Min</p>
                  <input
                    type="number"
                    placeholder="$0"
                    value={filters.min_rent || ''}
                    onChange={(e) => update({ min_rent: parseInt(e.target.value) || 0 })}
                    className="w-full bg-zinc-800 text-zinc-200 text-xs rounded-lg px-3 py-2 border border-zinc-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <span className="text-zinc-600 text-xs mt-4">–</span>
                <div className="flex-1">
                  <p className="text-zinc-500 text-xs mb-1">Max</p>
                  <input
                    type="number"
                    placeholder="Any"
                    value={filters.max_rent === 9999 ? '' : filters.max_rent}
                    onChange={(e) => update({ max_rent: parseInt(e.target.value) || 9999 })}
                    className="w-full bg-zinc-800 text-zinc-200 text-xs rounded-lg px-3 py-2 border border-zinc-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
              {hasRentFilter && (
                <button
                  onClick={() => { update({ min_rent: 0, max_rent: 9999 }); setRentOpen(false) }}
                  className="mt-3 w-full text-xs text-zinc-400 hover:text-white transition-colors"
                >
                  Clear range
                </button>
              )}
            </div>
          )}
        </div>

        {/* More Filters */}
        <button
          onClick={() => setDrawerOpen(true)}
          className={chipCls(moreActiveCount > 0)}
        >
          {moreActiveCount > 0 ? `Filters · ${moreActiveCount}` : 'More Filters'}
        </button>

        {/* Count */}
        <span className="ml-auto text-zinc-500 text-xs flex-shrink-0 pl-2">
          {count} listing{count !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Drawer overlay */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end" onClick={() => setDrawerOpen(false)}>
          <div
            className="bg-zinc-900 border-t border-zinc-800 rounded-t-2xl p-5 max-h-[75vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-semibold text-base">More Filters</h2>
              <button onClick={() => setDrawerOpen(false)} className="text-zinc-400 hover:text-white text-sm">
                ✕ Close
              </button>
            </div>

            {/* Furnished */}
            <div className="mb-5">
              <p className="text-xs text-zinc-500 uppercase tracking-wide mb-2">Furnished</p>
              <button
                onClick={() => update({ furnished: filters.furnished === true ? null : true })}
                className={chipCls(filters.furnished === true)}
              >
                Furnished
              </button>
            </div>

            {/* Utilities */}
            <div className="mb-5">
              <p className="text-xs text-zinc-500 uppercase tracking-wide mb-2">Utilities</p>
              <button
                onClick={() => update({ utilities_included: filters.utilities_included === true ? null : true })}
                className={chipCls(filters.utilities_included === true)}
              >
                Utilities Included
              </button>
            </div>

            {/* Amenities */}
            <div className="mb-5">
              <p className="text-xs text-zinc-500 uppercase tracking-wide mb-2">Amenities</p>
              <div className="flex flex-wrap gap-2">
                {AMENITIES.map((a) => (
                  <button
                    key={a}
                    onClick={() => toggleAmenity(a)}
                    className={chipCls(filters.amenities.includes(a))}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>

            {/* Food Preference */}
            <div className="mb-5">
              <p className="text-xs text-zinc-500 uppercase tracking-wide mb-2">Food Preference</p>
              <div className="flex flex-wrap gap-2">
                {FOOD_PREFS.map((fp) => (
                  <button
                    key={fp}
                    onClick={() => update({ food_preference: filters.food_preference === fp ? null : fp })}
                    className={chipCls(filters.food_preference === fp)}
                  >
                    {fp}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2 border-t border-zinc-800">
              <button
                onClick={() => {
                  update({ furnished: null, utilities_included: null, amenities: [], food_preference: null })
                  setDrawerOpen(false)
                }}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors"
              >
                Clear
              </button>
              <button
                onClick={() => setDrawerOpen(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-500 transition-colors"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
