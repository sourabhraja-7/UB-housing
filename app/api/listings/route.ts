import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')
  const min_rent = searchParams.get('min_rent')
  const max_rent = searchParams.get('max_rent')
  const bedrooms = searchParams.get('bedrooms')
  const bathrooms = searchParams.get('bathrooms')
  const furnished = searchParams.get('furnished')
  const utilities_included = searchParams.get('utilities_included')

  let query = supabase
    .from('listings')
    .select('*')
    .eq('is_active', true)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })

  if (type && type !== 'all') query = query.eq('type', type)
  if (min_rent) query = query.gte('rent', parseInt(min_rent))
  if (max_rent) query = query.lte('rent', parseInt(max_rent))
  if (bedrooms && bedrooms !== 'all') query = query.eq('bedrooms', parseInt(bedrooms))
  if (bathrooms && bathrooms !== 'all') query = query.eq('bathrooms', parseInt(bathrooms))
  if (furnished === 'true') query = query.eq('furnished', true)
  if (utilities_included === 'true') query = query.eq('utilities_included', true)

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  const required = ['type', 'title', 'rent', 'address', 'latitude', 'longitude', 'contact_phone', 'contact_name']
  for (const field of required) {
    if (body[field] === undefined || body[field] === null || body[field] === '') {
      return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 })
    }
  }

  const expires_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

  // Convert empty strings to null for optional integer/date fields
  const intFields = ['floor_level', 'lease_duration_months', 'bedrooms', 'bathrooms']
  const dateFields = ['available_date', 'sublease_end_date']
  for (const field of [...intFields, ...dateFields]) {
    if (body[field] === '') body[field] = null
  }

  const { data, error } = await supabase
    .from('listings')
    .insert({
      ...body,
      user_id: user.id,
      expires_at,
      is_active: true,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
