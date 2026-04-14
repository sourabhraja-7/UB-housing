'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ListingForm from '@/components/ListingForm'
import { ListingFormData } from '@/lib/types'

export default function PostPage() {
  const router = useRouter()

  const handleSubmit = async (data: ListingFormData) => {
    const res = await fetch('/api/listings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        rent: Number(data.rent),
      }),
    })

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Failed to post listing')
    }

    const listing = await res.json()
    router.push(`/post/success?id=${listing.id}&token=${listing.edit_token}`)
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Nav */}
      <div className="border-b border-zinc-800 px-4 py-4 flex items-center gap-3">
        <Link href="/" className="text-zinc-400 hover:text-white transition-colors text-sm">
          ← Map
        </Link>
        <h1 className="text-white font-semibold text-lg">Post a Listing</h1>
      </div>

      <div className="max-w-xl mx-auto px-4 py-8">
        <ListingForm onSubmit={handleSubmit} submitLabel="Post Listing" />
      </div>
    </div>
  )
}
