export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { data, error } = await supabaseAdmin
    .from('payment_requests')
    .select('id, amount_usdc, description, memo, status, expires_at, created_at')
    .eq('id', params.id)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Cobro no encontrado' }, { status: 404 })
  }

  // Verificar expiración
  if (data.status === 'pending' && data.expires_at && new Date(data.expires_at) < new Date()) {
    await supabaseAdmin
      .from('payment_requests')
      .update({ status: 'expired' })
      .eq('id', params.id)
    data.status = 'expired'
  }

  return NextResponse.json(data)
}
