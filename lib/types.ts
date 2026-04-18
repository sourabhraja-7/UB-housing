export type ListingType = 'room_available' | 'sublease'
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
  sublease_end_date: string | null
  lease_duration_months: number | null
  contact_phone: string
  contact_name: string
  photos: string[]
  amenities: string[]
  floor_level: number | null
  food_preference: string | null
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
  sublease_end_date: string
  lease_duration_months: number
  contact_phone: string
  contact_name: string
  photos: string[]
  amenities: string[]
  floor_level: number | ''
  food_preference: string
}

export interface FilterState {
  type: ListingType | 'all'
  min_rent: number
  max_rent: number
  bedrooms: number | 'all'
  bathrooms: number | 'all'
  furnished: boolean | null
  utilities_included: boolean | null
  amenities: string[]
  food_preference: string | null
}

export const LISTING_TYPE_LABELS: Record<ListingType, string> = {
  room_available: 'Houses for Rent',
  sublease: 'Sublease',
}

export const LISTING_TYPE_COLORS: Record<ListingType, string> = {
  room_available: '#22c55e',
  sublease: '#3b82f6',
}

export const PIN_COLORS: Record<ListingType, string> = {
  room_available: '#16a34a',
  sublease: '#2563eb',
}

export interface WalkInfo {
  distanceMeters: number
  durationSeconds: number
}
