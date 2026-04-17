'use client'

import { useState, useRef, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { ListingFormData, ListingType, GenderPreference } from '@/lib/types'

const LocationPicker = dynamic(() => import('./LocationPicker'), { ssr: false })

interface ListingFormProps {
  initial?: Partial<ListingFormData>
  onSubmit: (data: ListingFormData) => Promise<void>
  submitLabel: string
  extraActions?: React.ReactNode
}

const EMPTY: ListingFormData = {
  type: 'room_available',
  title: '',
  description: '',
  rent: '',
  bedrooms: 1,
  bathrooms: 1,
  address: '',
  latitude: null,
  longitude: null,
  furnished: false,
  utilities_included: false,
  gender_preference: 'any',
  available_date: '',
  lease_duration_months: 12,
  contact_phone: '',
  contact_name: '',
  photos: [],
}

const LEASE_DEFAULTS: Record<ListingType, number> = {
  sublease: 3,
  room_available: 12,
  roommate_needed: 6,
}

type FurnishedLevel = 'none' | 'semi' | 'full'

const FURNISHED_OPTIONS: { value: FurnishedLevel; label: string }[] = [
  { value: 'none', label: 'Not Furnished' },
  { value: 'semi', label: 'Semi-Furnished' },
  { value: 'full', label: 'Fully Furnished' },
]

const AMENITIES = [
  'Dishwasher',
  'Washer/Dryer',
  'Air Conditioning',
  'Heating',
  'Wi-Fi',
  'TV',
  'Carpet Flooring',
  'Hardwood Flooring',
  'Parking',
  'Balcony',
  'Gym Access',
  'Pet Friendly',
]

const COUNTRY_CODES = [
  { code: '+1', country: 'US', flag: '🇺🇸', name: 'United States' },
  { code: '+1', country: 'CA', flag: '🇨🇦', name: 'Canada' },
  { code: '+91', country: 'IN', flag: '🇮🇳', name: 'India' },
  { code: '+86', country: 'CN', flag: '🇨🇳', name: 'China' },
  { code: '+82', country: 'KR', flag: '🇰🇷', name: 'South Korea' },
  { code: '+977', country: 'NP', flag: '🇳🇵', name: 'Nepal' },
  { code: '+880', country: 'BD', flag: '🇧🇩', name: 'Bangladesh' },
  { code: '+92', country: 'PK', flag: '🇵🇰', name: 'Pakistan' },
  { code: '+94', country: 'LK', flag: '🇱🇰', name: 'Sri Lanka' },
  { code: '+84', country: 'VN', flag: '🇻🇳', name: 'Vietnam' },
  { code: '+44', country: 'GB', flag: '🇬🇧', name: 'United Kingdom' },
  { code: '+81', country: 'JP', flag: '🇯🇵', name: 'Japan' },
  { code: '+234', country: 'NG', flag: '🇳🇬', name: 'Nigeria' },
  { code: '+52', country: 'MX', flag: '🇲🇽', name: 'Mexico' },
  { code: '+55', country: 'BR', flag: '🇧🇷', name: 'Brazil' },
]

const STREETS_NEAR_BUS_STOPS = [
  'Main Street',
  'Merrimac Street',
  'Englewood Avenue',
  'Winspear Avenue',
  'Custer Street',
  'Heath Street',
  'Tyler Street',
  'Minnesota Avenue',
  'Berkshire Avenue',
  'Callodine Avenue',
]

export default function ListingForm({ initial, onSubmit, submitLabel, extraActions }: ListingFormProps) {
  const [form, setForm] = useState<ListingFormData>({ ...EMPTY, ...initial })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [furnishedLevel, setFurnishedLevel] = useState<FurnishedLevel>(
    initial?.furnished ? 'full' : 'none'
  )
  const [amenities, setAmenities] = useState<string[]>([])
  const [countryIdx, setCountryIdx] = useState(0)
  const [countryOpen, setCountryOpen] = useState(false)
  const countryRef = useRef<HTMLDivElement>(null)
  const [preferredStreets, setPreferredStreets] = useState<string[]>([])
  const [rentMin, setRentMin] = useState<number | ''>('')
  const [rentMax, setRentMax] = useState<number | ''>('')

  const set = (key: keyof ListingFormData, value: any) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const handleType = (type: ListingType) => {
    set('type', type)
    set('lease_duration_months', LEASE_DEFAULTS[type])
  }

  const handleFurnishedLevel = (level: FurnishedLevel) => {
    setFurnishedLevel(level)
    set('furnished', level !== 'none')
  }

  const toggleAmenity = (a: string) => {
    setAmenities((prev) => {
      const next = prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]
      set('utilities_included', next.length > 0)
      return next
    })
  }

  const toggleStreet = (s: string) => {
    setPreferredStreets((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]))
  }

  useEffect(() => {
    if (!countryOpen) return
    const onClick = (e: MouseEvent) => {
      if (countryRef.current && !countryRef.current.contains(e.target as Node)) {
        setCountryOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [countryOpen])

  const isRoommate = form.type === 'roommate_needed'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!isRoommate) {
      if (!form.address || form.latitude === null) {
        setError('Please select a location from the map.')
        return
      }
    } else {
      if (rentMin === '' || rentMax === '' || Number(rentMin) > Number(rentMax)) {
        setError('Please enter a valid rent range (min ≤ max).')
        return
      }
    }
    if (!form.contact_phone.match(/\d{10}/)) {
      setError('Please enter a valid 10-digit phone number.')
      return
    }

    setLoading(true)
    try {
      const payload: ListingFormData = isRoommate
        ? {
            ...form,
            rent: Number(rentMin),
            address: preferredStreets.length
              ? `Prefers: ${preferredStreets.join(', ')}`
              : 'No specific street preference',
            latitude: form.latitude ?? 42.9987,
            longitude: form.longitude ?? -78.7877,
          }
        : form
      await onSubmit(payload)
    } catch (err: any) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  const inputCls =
    'w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm'
  const labelCls = 'block text-sm font-medium text-zinc-300 mb-1.5'
  const selectedCountry = COUNTRY_CODES[countryIdx]

  const CheckBadge = ({ on }: { on: boolean }) => (
    <span
      className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
        on ? 'bg-indigo-500 border-indigo-500' : 'border-zinc-600'
      }`}
    >
      {on && (
        <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
          <path d="M2 6l3 3 5-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </span>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Listing Type */}
      <div>
        <label className={labelCls}>Listing Type *</label>
        <div className="grid grid-cols-3 gap-2">
          {(['room_available', 'sublease', 'roommate_needed'] as ListingType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => handleType(t)}
              className={`py-2.5 px-3 rounded-xl text-xs font-semibold border transition-colors ${
                form.type === t
                  ? 'bg-indigo-600 border-indigo-500 text-white'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500'
              }`}
            >
              {t === 'room_available' ? 'Room Available' : t === 'sublease' ? 'Sublease' : 'Roommate Needed'}
            </button>
          ))}
        </div>
      </div>

      {/* Title */}
      <div>
        <label className={labelCls}>Title *</label>
        <input
          required
          type="text"
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
          placeholder={
            isRoommate
              ? 'Looking for roommate near South Campus'
              : '1 BED available in 2BHK near South Campus'
          }
          className={inputCls}
          maxLength={100}
        />
      </div>

      {/* Rent OR Rent Range */}
      {isRoommate ? (
        <div>
          <label className={labelCls}>Desired Rent Range ($/month) *</label>
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">$</span>
              <input
                type="number"
                min={0}
                value={rentMin}
                onChange={(e) => setRentMin(parseInt(e.target.value) || '')}
                placeholder="Min 500"
                className={`${inputCls} pl-8`}
              />
            </div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">$</span>
              <input
                type="number"
                min={0}
                value={rentMax}
                onChange={(e) => setRentMax(parseInt(e.target.value) || '')}
                placeholder="Max 900"
                className={`${inputCls} pl-8`}
              />
            </div>
          </div>
        </div>
      ) : (
        <div>
          <label className={labelCls}>Rent ($/month per person) *</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">$</span>
            <input
              required
              type="number"
              min={0}
              value={form.rent}
              onChange={(e) => set('rent', parseInt(e.target.value) || '')}
              placeholder="650"
              className={`${inputCls} pl-8`}
            />
          </div>
        </div>
      )}

      {/* Bedrooms/Bathrooms — only for places you have */}
      {!isRoommate && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Bedrooms *</label>
            <select
              value={form.bedrooms}
              onChange={(e) => set('bedrooms', parseInt(e.target.value))}
              className={inputCls}
            >
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Bathrooms *</label>
            <select
              value={form.bathrooms}
              onChange={(e) => set('bathrooms', parseInt(e.target.value))}
              className={inputCls}
            >
              {[1, 2, 3].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Location for place-based, Preferred Streets for roommate */}
      {isRoommate ? (
        <div>
          <label className={labelCls}>Preferred Streets (near bus stops)</label>
          <p className="text-xs text-zinc-500 mb-2">
            Select any streets you'd prefer — all close to South Campus Main Circle.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {STREETS_NEAR_BUS_STOPS.map((s) => {
              const selected = preferredStreets.includes(s)
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleStreet(s)}
                  className={`flex items-center gap-2 py-2 px-3 rounded-xl text-xs font-medium border transition-colors text-left ${
                    selected
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                  }`}
                >
                  <CheckBadge on={selected} />
                  {s}
                </button>
              )
            })}
          </div>
        </div>
      ) : (
        <div>
          <label className={labelCls}>Location *</label>
          <LocationPicker
            onLocationSelect={(address, lat, lng) => {
              set('address', address)
              set('latitude', lat)
              set('longitude', lng)
            }}
            initialAddress={form.address}
            initialLat={form.latitude}
            initialLng={form.longitude}
          />
        </div>
      )}

      {/* Available date + Lease */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Available Date</label>
          <input
            type="date"
            value={form.available_date}
            onChange={(e) => set('available_date', e.target.value)}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Lease Duration</label>
          <select
            value={form.lease_duration_months}
            onChange={(e) => set('lease_duration_months', parseInt(e.target.value))}
            className={inputCls}
          >
            <option value={1}>1 month</option>
            <option value={3}>3 months</option>
            <option value={6}>6 months</option>
            <option value={12}>12 months</option>
          </select>
        </div>
      </div>

      {/* Furnished level + Amenities — hide for roommate needed */}
      {!isRoommate && (
        <>
          <div>
            <label className={labelCls}>Furnished</label>
            <div className="grid grid-cols-3 gap-2">
              {FURNISHED_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleFurnishedLevel(opt.value)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-colors ${
                    furnishedLevel === opt.value
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={labelCls}>Amenities & Utilities</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {AMENITIES.map((a) => {
                const selected = amenities.includes(a)
                return (
                  <button
                    key={a}
                    type="button"
                    onClick={() => toggleAmenity(a)}
                    className={`flex items-center gap-2 py-2 px-3 rounded-xl text-xs font-medium border transition-colors text-left ${
                      selected
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200'
                        : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                    }`}
                  >
                    <CheckBadge on={selected} />
                    {a}
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}

      {/* Gender preference */}
      <div>
        <label className={labelCls}>Gender Preference</label>
        <div className="flex gap-2">
          {(['any', 'male', 'female'] as GenderPreference[]).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => set('gender_preference', g)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-colors capitalize ${
                form.gender_preference === g
                  ? 'bg-indigo-600 border-indigo-500 text-white'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className={labelCls}>Description</label>
        <textarea
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder={
            isRoommate
              ? 'Tell people about yourself — year, major, lifestyle, schedule...'
              : 'Tell people about the place — nearby bus stops, amenities, vibe...'
          }
          rows={4}
          className={`${inputCls} resize-none`}
        />
      </div>

      {/* Contact */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Your Name *</label>
          <input
            required
            type="text"
            value={form.contact_name}
            onChange={(e) => set('contact_name', e.target.value)}
            placeholder="First name"
            className={inputCls}
          />
        </div>
        <div ref={countryRef}>
          <label className={labelCls}>WhatsApp Number *</label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setCountryOpen(!countryOpen)}
              className="absolute left-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 bg-zinc-700 hover:bg-zinc-600 rounded-lg pl-1.5 pr-2 py-1.5 text-xs font-medium z-10"
            >
              <span
                className="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center text-base leading-none bg-zinc-900/50"
                aria-hidden="true"
              >
                {selectedCountry.flag}
              </span>
              <span className="text-zinc-200">{selectedCountry.code}</span>
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none" className="text-zinc-400">
                <path
                  d="M3 4.5l3 3 3-3"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            {countryOpen && (
              <div className="absolute left-0 top-full mt-1 bg-zinc-800 border border-zinc-700 rounded-xl shadow-xl max-h-60 overflow-y-auto z-20 w-64">
                {COUNTRY_CODES.map((c, idx) => (
                  <button
                    key={`${c.code}-${c.country}`}
                    type="button"
                    onClick={() => {
                      setCountryIdx(idx)
                      setCountryOpen(false)
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-zinc-700 ${
                      idx === countryIdx ? 'bg-zinc-700/50' : ''
                    }`}
                  >
                    <span className="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center text-base leading-none bg-zinc-900/50 flex-shrink-0">
                      {c.flag}
                    </span>
                    <span className="text-zinc-200 flex-1">{c.name}</span>
                    <span className="text-zinc-400">{c.code}</span>
                  </button>
                ))}
              </div>
            )}
            <input
              required
              type="tel"
              value={form.contact_phone}
              onChange={(e) => set('contact_phone', e.target.value.replace(/\D/g, ''))}
              placeholder="7165550001"
              maxLength={10}
              className={`${inputCls} pl-24`}
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 text-red-400 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          {loading ? 'Saving...' : submitLabel}
        </button>
        {extraActions}
      </div>
    </form>
  )
}
