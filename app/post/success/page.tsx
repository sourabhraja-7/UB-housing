'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

function SuccessContent() {
  const params = useSearchParams()
  const id = params.get('id')
  const token = params.get('token')
  const editUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/edit/${token}`
  const listingUrl = `/listing/${id}`

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h1 className="text-white text-2xl font-bold mb-2">Your listing is live!</h1>
        <p className="text-zinc-400 text-sm mb-8">
          It will appear on the map and expire in 30 days.
        </p>

        <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-4 mb-6 text-left">
          <p className="text-xs text-zinc-400 mb-2 font-medium uppercase tracking-wide">
            Save your edit link
          </p>
          <p className="text-xs text-amber-400 break-all font-mono">{editUrl}</p>
          <p className="text-xs text-zinc-500 mt-2">
            This is the only way to edit or delete your listing. Save it somewhere safe.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Link
            href={listingUrl}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            View Your Listing
          </Link>
          <Link
            href="/"
            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold py-3 rounded-xl transition-colors"
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
