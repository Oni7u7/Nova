export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { withAuth, JWTPayload } from '@/lib/auth/middleware'
import { supabaseAdmin } from '@/lib/supabase/client'

export const GET = withAuth(async (_req: NextRequest, user: JWTPayload) => {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('id, email, full_name, account_type, business_name, created_at')
    .eq('id', user.userId)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
  }

  return NextResponse.json({
    ...data,
    stellar_public_key: user.stellarPublicKey,
  })
})
