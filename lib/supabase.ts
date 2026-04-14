import { createClient } from '@supabase/supabase-js'
import { Listing } from './types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      listings: {
        Row: Listing
        Insert: Omit<Listing, 'id' | 'created_at' | 'edit_token' | 'expires_at' | 'is_active'>
        Update: Partial<Listing>
      }
    }
  }
}
