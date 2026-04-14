'use client'

import Link from 'next/link'
import { Listing, LISTING_TYPE_LABELS, LISTING_TYPE_COLORS } from '@/lib/types'
import { formatWhatsAppUrl, formatDate, daysUntil, daysAgo } from '@/lib/utils'

interface ListingCardProps {
  listing: Listing
  onClose: () => void
}

const TYPE_BG: Record<string, string> = {
  room_available: 'bg-green-500/20 text-green-400 border-green-500/30',
  sublease: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  roommate_needed: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
}

export default function ListingCard({ listing, onClose }: ListingCardProps) {
  const daysLeft = daysUntil(listing.expires_at)
  const postedDays = daysAgo(listing.created_at)
  const waUrl = formatWhatsAppUrl(listing.contact_phone)

  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl p-4 w-full max-w-sm">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <span
          className={`text-xs font-semibold px-2 py-1 rounded-full border ${TYPE_BG[listing.type]}`}
        >
          {LISTING_TYPE_LABELS[listing.type]}
        </span>
        <button
          onClick={onClose}
          className="text-zinc-500 hover:text-white transition-colors text-lg leading-none"
          aria-label="Close"
        >
          ×
        </button>
      </div>

      {/* Title + Rent */}
      <h3 className="text-white font-semibold text-base leading-snug mb-1">{listing.title}</h3>
      <p className="text-2xl font-bold text-white mb-3">
        ${listing.rent.toLocaleString()}
        <span className="text-sm font-normal text-zinc-400">/mo</span>
      </p>

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-1.5 text-xs text-zinc-400 mb-3">
        <span>🛏 {listing.bedrooms} bed · {listing.bathrooms} bath</span>
        {listing.available_date && (
          <span>📅 Avail. {formatDate(listing.available_date)}</span>
        )}
        {listing.lease_duration_months && (
          <span>⏱ {listing.lease_duration_months} month lease</span>
        )}
        {listing.furnished && <span>🛋 Furnished</span>}
        {listing.utilities_included && <span>💡 Utilities incl.</span>}
        {listing.gender_preference !== 'any' && (
          <span>👤 {listing.gender_preference === 'male' ? 'Male' : 'Female'} preferred</span>
        )}
      </div>

      {/* Description snippet */}
      {listing.description && (
        <p className="text-zinc-400 text-xs leading-relaxed mb-3 line-clamp-2">
          {listing.description}
        </p>
      )}

      {/* Meta */}
      <p className="text-zinc-600 text-xs mb-3">
        Posted {postedDays === 0 ? 'today' : `${postedDays}d ago`} · Expires in {daysLeft}d
      </p>

      {/* Actions */}
      <div className="flex gap-2">
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 bg-green-600 hover:bg-green-500 text-white text-sm font-semibold py-2 rounded-xl text-center transition-colors"
        >
          Message on WhatsApp
        </a>
        <Link
          href={`/listing/${listing.id}`}
          className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm rounded-xl transition-colors"
        >
          Details
        </Link>
      </div>
    </div>
  )
}
