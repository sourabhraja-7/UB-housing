export type ListingType = 'room_available' | 'sublease' | 'roommate_needed'
export type GenderPreference = 'any' | 'male' | 'female'

export interface Listing {
  id: string
  type: ListingType
  title: string
  description: string | null
  rent: number
  bedrooms: number
  bathrooms: number
  address: string
  latitude: number
  longitude: number
  furnished: boolean
  utilities_included: boolean
  gender_preference: GenderPreference
  available_date: string | null
  lease_duration_months: number | null
  contact_phone: string
  contact_name: string
  photos: string[]
  is_active: boolean
  edit_token: string
  created_at: string
  expires_at: string
}

export interface ListingFormData {
  type: ListingType
  title: string
  description: string
  rent: number | ''
  bedrooms: number
  bathrooms: number
  address: string
  latitude: number | null
  longitude: number | null
  furnished: boolean
  utilities_included: boolean
  gender_preference: GenderPreference
  available_date: string
  lease_duration_months: number
  contact_phone: string
  contact_name: string
  photos: string[]
}

export interface FilterState {
  type: ListingType | 'all'
  min_rent: number
  max_rent: number
  bedrooms: number | 'all'
  furnished: boolean | null
  utilities_included: boolean | null
}

export const LISTING_TYPE_LABELS: Record<ListingType, string> = {
  room_available: 'Room Available',
  sublease: 'Sublease',
  roommate_needed: 'Roommate Needed',
}

export const LISTING_TYPE_COLORS: Record<ListingType, string> = {
  room_available: '#22c55e',   // green
  sublease: '#3b82f6',          // blue
  roommate_needed: '#f97316',  // orange
}

export const PIN_COLORS: Record<ListingType, string> = {
  room_available: '#16a34a',
  sublease: '#2563eb',
  roommate_needed: '#ea580c',
}
