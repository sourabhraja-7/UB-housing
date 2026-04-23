'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import ListingForm from '@/components/ListingForm'
import { Listing, ListingFormData } from '@/lib/types'

export default function EditPage() {
  const { token } = useParams<{ token: string }>()
  const router = useRouter()
  const [listing, setListing] = useState<Listing | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    import('@/lib/supabase').then(({ createClient }) => {
      createClient().auth.getUser().then(({ data }) => {
        if (!data.user) {
          router.replace(`/login?next=/edit/${token}`)
          return
        }
        fetch(`/api/listings/edit/${token}`)
          .then((r) => (r.ok ? r.json() : Promise.reject()))
          .then(setListing)
          .catch(() => setNotFound(true))
      })
    })
  }, [token])

  const handleUpdate = async (data: ListingFormData) => {
    const res = await fetch(`/api/listings/edit/${token}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, rent: Number(data.rent) }),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Failed to update')
    }
    router.push(`/listing/${listing!.id}`)
  }

  const handleDelete = async () => {
    if (!confirm('Delete this listing permanently?')) return
    setDeleting(true)
    await fetch(`/api/listings/edit/${token}`, { method: 'DELETE' })
    router.push('/')
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-center px-4">
        <div>
          <p className="text-zinc-400 text-lg mb-4">Listing not found or invalid edit link.</p>
          <Link href="/" className="text-indigo-400 hover:text-indigo-300">← Back to Map</Link>
        </div>
      </div>
    )
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const initial: Partial<ListingFormData> = {
    type: listing.type,
    title: listing.title,
    description: listing.description || '',
    rent: listing.rent,
    bedrooms: listing.bedrooms,
    bathrooms: listing.bathrooms,
    address: listing.address,
    latitude: listing.latitude,
    longitude: listing.longitude,
    furnished: listing.furnished,
    utilities_included: listing.utilities_included,
    gender_preference: listing.gender_preference,
    available_date: listing.available_date || '',
    sublease_end_date: listing.sublease_end_date || '',
    lease_duration_months: listing.lease_duration_months || 12,
    contact_phone: listing.contact_phone,
    contact_name: listing.contact_name,
    photos: listing.photos,
    amenities: listing.amenities || [],
    floor_level: listing.floor_level ?? '',
    food_preference: listing.food_preference || '',
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="border-b border-zinc-800 px-4 py-4 flex items-center gap-3">
        <Link href="/" className="text-zinc-400 hover:text-white transition-colors text-sm">← Map</Link>
        <h1 className="text-white font-semibold text-lg">Edit Listing</h1>
      </div>

      <div className="max-w-xl mx-auto px-4 py-8">
        <ListingForm
          initial={initial}
          onSubmit={handleUpdate}
          submitLabel="Update Listing"
          extraActions={
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 bg-zinc-800 hover:bg-red-900/40 border border-zinc-700 hover:border-red-700 text-zinc-300 hover:text-red-400 font-semibold py-3 rounded-xl transition-colors text-sm"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          }
        />
      </div>
    </div>
  )
}
