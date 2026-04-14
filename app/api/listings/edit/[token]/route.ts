import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  _req: NextRequest,
  { params }: { params: { token: string } }
) {
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .eq('edit_token', params.token)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(data)
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  const body = await req.json()

  // Verify the token exists
  const { data: existing, error: fetchError } = await supabase
    .from('listings')
    .select('id')
    .eq('edit_token', params.token)
    .single()

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Listing not found or invalid token' }, { status: 404 })
  }

  // Strip fields that shouldn't be updated directly
  const { id, edit_token, created_at, expires_at, ...updateFields } = body

  const { data, error } = await supabase
    .from('listings')
    .update(updateFields)
    .eq('edit_token', params.token)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { token: string } }
) {
  const { error } = await supabase
    .from('listings')
    .update({ is_active: false })
    .eq('edit_token', params.token)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
