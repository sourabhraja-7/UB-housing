'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

function SuccessContent() {
  const params = useSearchParams()
  const id = params.get('id')

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h1 className="text-white text-2xl font-bold mb-2">Your listing is live!</h1>
        <p className="text-zinc-400 text-sm mb-8">
          It will appear on the map and expire in 30 days. You can manage it anytime from My Listings.
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href={`/listing/${id}`}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            View Your Listing
          </Link>
          <Link
            href="/my-listings"
            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold py-3 rounded-xl transition-colors"
          >
            My Listings
          </Link>
          <Link
            href="/"
            className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors"
          >
            Back to Map
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  )
}
