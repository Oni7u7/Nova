export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { withAuth, JWTPayload } from '@/lib/auth/middleware'
import { supabaseAdmin } from '@/lib/supabase/client'

export const GET = withAuth(async (_req: NextRequest, user: JWTPayload) => {
  const { data, error } = await supabaseAdmin
    .from('savings_goals')
    .select('*')
    .eq('user_id', user.userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Error al obtener metas' }, { status: 500 })
  }

  return NextResponse.json({ goals: data })
})

export const POST = withAuth(async (req: NextRequest, user: JWTPayload) => {
  const body = await req.json()
  const { name, target_usdc, deadline } = body

  if (!name || !target_usdc || isNaN(parseFloat(target_usdc)) || parseFloat(target_usdc) <= 0) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('savings_goals')
    .insert({
      user_id: user.userId,
      name,
      target_usdc: parseFloat(target_usdc),
      deadline: deadline ?? null,
    })
    .select()
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Error al crear la meta' }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
})
