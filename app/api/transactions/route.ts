export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { withAuth, JWTPayload } from '@/lib/auth/middleware'
import { supabaseAdmin } from '@/lib/supabase/client'

export const GET = withAuth(async (req: NextRequest, user: JWTPayload) => {
  const { searchParams } = req.nextUrl
  const limit = parseInt(searchParams.get('limit') ?? '20')
  const offset = parseInt(searchParams.get('offset') ?? '0')

  const { data, error, count } = await supabaseAdmin
    .from('transactions')
    .select('*', { count: 'exact' })
    .eq('user_id', user.userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    return NextResponse.json({ error: 'Error al obtener transacciones' }, { status: 500 })
  }

  return NextResponse.json({ transactions: data, total: count })
})
