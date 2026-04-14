'use client'

import { useState } from 'react'
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

export default function ListingForm({ initial, onSubmit, submitLabel, extraActions }: ListingFormProps) {
  const [form, setForm] = useState<ListingFormData>({ ...EMPTY, ...initial })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = (key: keyof ListingFormData, value: any) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const handleType = (type: ListingType) => {
    set('type', type)
    set('lease_duration_months', LEASE_DEFAULTS[type])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!form.address || form.latitude === null) {
      setError('Please select a location from the map.')
      return
    }
    if (!form.contact_phone.match(/\d{10}/)) {
      setError('Please enter a valid 10-digit phone number.')
      return
    }

    setLoading(true)
    try {
      await onSubmit(form)
    } catch (err: any) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm'
  const labelCls = 'block text-sm font-medium text-zinc-300 mb-1.5'

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
          placeholder="1 BED available in 2BHK near South Campus"
          className={inputCls}
          maxLength={100}
        />
      </div>

      {/* Rent */}
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

      {/* Bedrooms + Bathrooms */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Bedrooms *</label>
          <select value={form.bedrooms} onChange={(e) => set('bedrooms', parseInt(e.target.value))} className={inputCls}>
            {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Bathrooms *</label>
          <select value={form.bathrooms} onChange={(e) => set('bathrooms', parseInt(e.target.value))} className={inputCls}>
            {[1, 2, 3].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      </div>

      {/* Location */}
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
          <select value={form.lease_duration_months} onChange={(e) => set('lease_duration_months', parseInt(e.target.value))} className={inputCls}>
            <option value={1}>1 month</option>
            <option value={3}>3 months</option>
            <option value={6}>6 months</option>
            <option value={12}>12 months</option>
          </select>
        </div>
      </div>

      {/* Toggles */}
      <div className="flex gap-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.furnished} onChange={(e) => set('furnished', e.target.checked)} className="accent-indigo-500 w-4 h-4" />
          <span className="text-sm text-zinc-300">Furnished</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.utilities_included} onChange={(e) => set('utilities_included', e.target.checked)} className="accent-indigo-500 w-4 h-4" />
          <span className="text-sm text-zinc-300">Utilities Included</span>
        </label>
      </div>

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
          placeholder="Tell people about the place — nearby bus stops, amenities, vibe..."
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
        <div>
          <label className={labelCls}>WhatsApp Number *</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">+1</span>
            <input
              required
              type="tel"
              value={form.contact_phone}
              onChange={(e) => set('contact_phone', e.target.value.replace(/\D/g, ''))}
              placeholder="7165550001"
              maxLength={10}
              className={`${inputCls} pl-10`}
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
