'use client'

import { FilterState, ListingType } from '@/lib/types'

interface FilterBarProps {
  filters: FilterState
  onChange: (f: FilterState) => void
  count: number
}

export default function FilterBar({ filters, onChange, count }: FilterBarProps) {
  const update = (partial: Partial<FilterState>) => onChange({ ...filters, ...partial })

  return (
    <div className="flex flex-wrap items-center gap-2 px-4 py-2 bg-zinc-900/90 backdrop-blur border-b border-zinc-800">
      {/* Type */}
      <select
        value={filters.type}
        onChange={(e) => update({ type: e.target.value as ListingType | 'all' })}
        className="bg-zinc-800 text-zinc-200 text-xs rounded-lg px-3 py-1.5 border border-zinc-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      >
        <option value="all">All Types</option>
        <option value="room_available">Room Available</option>
        <option value="sublease">Sublease</option>
        <option value="roommate_needed">Roommate Needed</option>
      </select>

      {/* Bedrooms */}
      <select
        value={filters.bedrooms}
        onChange={(e) => update({ bedrooms: e.target.value === 'all' ? 'all' : parseInt(e.target.value) })}
        className="bg-zinc-800 text-zinc-200 text-xs rounded-lg px-3 py-1.5 border border-zinc-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      >
        <option value="all">Any Beds</option>
        <option value="1">1 Bed</option>
        <option value="2">2 Beds</option>
        <option value="3">3 Beds</option>
        <option value="4">4+ Beds</option>
      </select>

      {/* Rent range */}
      <div className="flex items-center gap-1.5">
        <span className="text-zinc-500 text-xs">$</span>
        <input
          type="number"
          placeholder="Min"
          value={filters.min_rent || ''}
          onChange={(e) => update({ min_rent: parseInt(e.target.value) || 0 })}
          className="bg-zinc-800 text-zinc-200 text-xs rounded-lg px-2 py-1.5 border border-zinc-700 w-16 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <span className="text-zinc-500 text-xs">–</span>
        <input
          type="number"
          placeholder="Max"
          value={filters.max_rent || ''}
          onChange={(e) => update({ max_rent: parseInt(e.target.value) || 9999 })}
          className="bg-zinc-800 text-zinc-200 text-xs rounded-lg px-2 py-1.5 border border-zinc-700 w-16 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      {/* Furnished */}
      <label className="flex items-center gap-1.5 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={filters.furnished === true}
          onChange={(e) => update({ furnished: e.target.checked ? true : null })}
          className="accent-indigo-500 w-3.5 h-3.5"
        />
        <span className="text-zinc-300 text-xs">Furnished</span>
      </label>

      {/* Utilities */}
      <label className="flex items-center gap-1.5 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={filters.utilities_included === true}
          onChange={(e) => update({ utilities_included: e.target.checked ? true : null })}
          className="accent-indigo-500 w-3.5 h-3.5"
        />
        <span className="text-zinc-300 text-xs">Utilities incl.</span>
      </label>

      {/* Count */}
      <span className="ml-auto text-zinc-500 text-xs">{count} listing{count !== 1 ? 's' : ''}</span>
    </div>
  )
}
