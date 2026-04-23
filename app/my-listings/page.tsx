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
  const [exitingIds, setExitingIds] = useState<Set<string>>(new Set())
  const [confirmFill, setConfirmFill] = useState<Listing | null>(null)

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

  const handleMarkFilledConfirmed = async () => {
    if (!confirmFill) return
    const target = confirmFill
    setConfirmFill(null)
    setExitingIds((prev) => {
      const next = new Set(prev)
      next.add(target.id)
      return next
    })

    const supabase = createClient()
    supabase
      .from('listings')
      .delete()
      .eq('id', target.id)
      .then(() => {})

    setTimeout(() => {
      setListings((prev) => prev.filter((l) => l.id !== target.id))
      setExitingIds((prev) => {
        const next = new Set(prev)
        next.delete(target.id)
        return next
      })
    }, 750)
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
          <div>
            {listings.map((listing) => {
              const daysLeft = daysUntil(listing.expires_at)
              const expired = daysLeft <= 0
              const exiting = exitingIds.has(listing.id)

              return (
                <div
                  key={listing.id}
                  className={`overflow-hidden transition-all duration-700 ease-out ${
                    exiting ? 'max-h-0 opacity-0 mb-0' : 'max-h-[500px] opacity-100 mb-4'
                  }`}
                >
                  <div
                    className={`bg-zinc-900 border rounded-2xl p-5 transition-all duration-700 ease-out ${
                      exiting ? 'translate-x-[110%] scale-95 opacity-0' : 'translate-x-0 scale-100 opacity-100'
                    } ${expired ? 'border-zinc-700 opacity-60' : 'border-zinc-800'}`}
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
                      <div className="flex gap-2 flex-shrink-0 items-start">
                        <Link
                          href={`/edit/${listing.edit_token}`}
                          className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium rounded-lg transition-colors"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => setConfirmFill(listing)}
                          title="Mark as Filled"
                          aria-label="Mark as Filled"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-emerald-500/15 border border-zinc-700 hover:border-emerald-500/50 text-zinc-300 hover:text-emerald-400 text-xs font-medium rounded-lg transition-colors"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 11l3 3L22 4" />
                            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                          </svg>
                          <span className="hidden sm:inline">Mark Filled</span>
                        </button>
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

      {/* Mark as Filled confirmation modal */}
      {confirmFill && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4 animate-[fadeIn_0.2s_ease-out]"
          onClick={() => setConfirmFill(null)}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-[scaleIn_0.2s_ease-out]"
          >
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 mx-auto mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h3 className="text-white font-semibold text-lg text-center mb-1">Mark as Filled?</h3>
            <p className="text-zinc-400 text-sm text-center mb-5 leading-relaxed">
              &ldquo;{confirmFill.title}&rdquo; will be removed from the map and other users won&apos;t see it anymore.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmFill(null)}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium py-2.5 rounded-xl transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleMarkFilledConfirmed}
                className="flex-1 inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm shadow-lg shadow-emerald-900/40"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Yes, mark filled
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}
