import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './types'

let _supabaseAdmin: SupabaseClient<Database> | null = null
let _supabaseClient: SupabaseClient<Database> | null = null

export function getSupabaseAdmin(): SupabaseClient<Database> {
  if (!_supabaseAdmin) {
    _supabaseAdmin = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )
  }
  return _supabaseAdmin
}

export function getSupabaseClient(): SupabaseClient<Database> {
  if (!_supabaseClient) {
    _supabaseClient = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return _supabaseClient
}

// Alias conveniente para API Routes (siempre usa admin)
export const supabaseAdmin = new Proxy({} as SupabaseClient<Database>, {
  get(_target, prop) {
    return getSupabaseAdmin()[prop as keyof SupabaseClient<Database>]
  },
})
