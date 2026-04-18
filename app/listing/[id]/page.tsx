import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Listing, LISTING_TYPE_LABELS } from '@/lib/types'
import { formatWhatsAppUrl, formatDate, daysUntil, daysAgo } from '@/lib/utils'

async function getListing(id: string): Promise<Listing | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/listings/${id}`, { cache: 'no-store' })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

const TYPE_BADGE: Record<string, string> = {
  room_available: 'bg-green-500/20 text-green-400 border-green-500/30',
  sublease: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
}

export default async function ListingDetailPage({ params }: { params: { id: string } }) {
  const listing = await getListing(params.id)
  if (!listing) notFound()

  const daysLeft = daysUntil(listing.expires_at)
  const postedDays = daysAgo(listing.created_at)
  const waUrl = formatWhatsAppUrl(listing.contact_phone)

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Nav */}
      <div className="border-b border-zinc-800 px-4 py-4 flex items-center gap-3">
        <Link href="/" className="text-zinc-400 hover:text-white transition-colors text-sm">← Map</Link>
        <h1 className="text-white font-semibold">Listing Details</h1>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Type badge */}
        <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full border ${TYPE_BADGE[listing.type]}`}>
          {LISTING_TYPE_LABELS[listing.type]}
        </span>

        {/* Title + Rent */}
        <div>
          <h2 className="text-white text-2xl font-bold mb-1">{listing.title}</h2>
          <p className="text-3xl font-bold text-white">
            ${listing.rent.toLocaleString()}
            <span className="text-base font-normal text-zinc-400">/month per person</span>
          </p>
        </div>

        {/* Photos placeholder */}
        {listing.photos && listing.photos.length > 0 && (
          <div className="flex gap-2 overflow-x-auto">
            {listing.photos.map((url, i) => (
              <img key={i} src={url} alt={`Photo ${i + 1}`} className="h-48 rounded-xl object-cover flex-shrink-0" />
            ))}
          </div>
        )}

        {/* Details */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 grid grid-cols-2 gap-4">
          {listing.type !== 'sublease' && listing.bedrooms != null && (
            <Detail label="Bedrooms" value={`${listing.bedrooms} bed`} />
          )}
          {listing.bathrooms != null && (
            <Detail label="Bathrooms" value={`${listing.bathrooms} bath`} />
          )}
          {listing.type === 'sublease' && listing.available_date && listing.sublease_end_date ? (
            <Detail label="Sublease Period" value={`${formatDate(listing.available_date)} → ${formatDate(listing.sublease_end_date)} (${listing.lease_duration_months} mo)`} />
          ) : (
            <>
              {listing.available_date && <Detail label="Available" value={formatDate(listing.available_date)} />}
              {listing.lease_duration_months && <Detail label="Lease" value={`${listing.lease_duration_months} months`} />}
            </>
          )}
          <Detail label="Furnished" value={listing.furnished ? 'Furnished' : 'Not Furnished'} />
          <Detail label="Utilities" value={listing.utilities_included ? 'Included' : 'Not included'} />
          {listing.floor_level != null && (
            <Detail label="Floor Level" value={`Floor ${listing.floor_level}`} />
          )}
          <Detail
            label="Gender Preference"
            value={
              listing.gender_preference === 'male' ? 'Male preferred'
              : listing.gender_preference === 'female' ? 'Female preferred'
              : 'No preference'
            }
          />
          {listing.type === 'sublease' && listing.food_preference && (
            <Detail label="Food Preference" value={listing.food_preference} />
          )}
        </div>

        {/* Amenities */}
        {listing.amenities && listing.amenities.length > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <p className="text-xs text-zinc-500 uppercase tracking-wide mb-3">Amenities</p>
            <div className="flex flex-wrap gap-2">
              {listing.amenities.map((amenity) => (
                <span
                  key={amenity}
                  className="text-xs font-medium px-3 py-1 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700"
                >
                  {amenity}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Address */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Location</p>
          <p className="text-zinc-200 text-sm">{listing.address}</p>
        </div>

        {/* Description */}
        {listing.description && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <p className="text-xs text-zinc-500 uppercase tracking-wide mb-2">About this place</p>
            <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-line">{listing.description}</p>
          </div>
        )}

        {/* Meta */}
        <p className="text-zinc-600 text-xs">
          Posted by {listing.contact_name} · {postedDays === 0 ? 'today' : `${postedDays} days ago`} · Expires in {daysLeft} days
        </p>

        {/* CTA */}
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full bg-green-600 hover:bg-green-500 text-white text-center font-semibold py-4 rounded-2xl transition-colors text-base"
        >
          Message {listing.contact_name} on WhatsApp
        </a>

        {/* Report */}
        <p className="text-center">
          <a
            href={`mailto:admin@ubhousing.com?subject=Report listing ${listing.id}`}
            className="text-zinc-600 text-xs hover:text-zinc-400 transition-colors"
          >
            Report this listing
          </a>
        </p>
      </div>
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-zinc-500 uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-zinc-200 text-sm font-medium">{value}</p>
    </div>
  )
}
