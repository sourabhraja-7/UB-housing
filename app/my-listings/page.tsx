'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { Listing, LISTING_TYPE_LABELS } from '@/lib/types'
import { formatDate, daysUntil } from '@/lib/utils'

export default function MyListingsPage() {
  const router = useRouter()
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        router.replace('/login?next=/my-listings')
        return
      }

      setUserEmail(data.user.email ?? null)

      const { data: listings } = await supabase
        .from('listings')
        .select('*')
        .eq('user_id', data.user.id)
        .order('created_at', { ascending: false })

      setListings(listings ?? [])
      setLoading(false)
    })
  }, [])

  const handleDelete = async (listing: Listing) => {
    if (!confirm('Delete this listing permanently?')) return
    const supabase = createClient()
    await supabase
      .from('listings')
      .update({ is_active: false })
      .eq('id', listing.id)
    setListings((prev) => prev.filter((l) => l.id !== listing.id))
  }

  const TYPE_BADGE: Record<string, string> = {
    room_available: 'bg-green-500/20 text-green-400 border-green-500/30',
    sublease: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Nav */}
      <div className="border-b border-zinc-800 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-zinc-400 hover:text-white transition-colors text-sm">← Map</Link>
          <h1 className="text-white font-semibold text-lg">My Listings</h1>
        </div>
        {userEmail && (
          <span className="text-zinc-500 text-xs hidden sm:inline">{userEmail}</span>
        )}
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {listings.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-zinc-400 text-base mb-4">You haven't posted any listings yet.</p>
            <Link
              href="/post"
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
            >
              + Post a Listing
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {listings.map((listing) => {
              const daysLeft = daysUntil(listing.expires_at)
              const expired = daysLeft <= 0

              return (
                <div
                  key={listing.id}
                  className={`bg-zinc-900 border rounded-2xl p-5 ${expired ? 'border-zinc-700 opacity-60' : 'border-zinc-800'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {/* Type + expired badge */}
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${TYPE_BADGE[listing.type]}`}>
                          {LISTING_TYPE_LABELS[listing.type]}
                        </span>
                        {expired && (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full border bg-red-500/20 text-red-400 border-red-500/30">
                            Expired
                          </span>
                        )}
                        {!expired && daysLeft <= 5 && (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full border bg-amber-500/20 text-amber-400 border-amber-500/30">
                            Expires in {daysLeft}d
                          </span>
                        )}
                      </div>

                      {/* Title + rent */}
                      <h2 className="text-white font-semibold text-base leading-snug truncate">{listing.title}</h2>
                      <p className="text-zinc-400 text-sm mt-0.5">
                        ${listing.rent.toLocaleString()}/mo
                        {listing.available_date && ` · Available ${formatDate(listing.available_date)}`}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 flex-shrink-0">
                      <Link
                        href={`/edit/${listing.edit_token}`}
                        className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium rounded-lg transition-colors"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(listing)}
                        className="px-3 py-1.5 bg-zinc-800 hover:bg-red-900/40 hover:text-red-400 text-zinc-400 text-xs font-medium rounded-lg transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Footer */}
                  <p className="text-zinc-600 text-xs mt-3">
                    {expired ? 'Expired' : `Expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`}
                    {' · '}{listing.address}
                  </p>
                </div>
              )
            })}

            <Link
              href="/post"
              className="block w-full text-center bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition-colors text-sm mt-6"
            >
              + Post Another Listing
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
