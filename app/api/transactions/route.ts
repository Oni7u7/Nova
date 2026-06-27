export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { withAuth, JWTPayload } from '@/lib/auth/middleware'
import { supabaseAdmin } from '@/lib/supabase/client'
import { server } from '@/lib/stellar/client'
import { getUSDCAssetCode, getUSDCIssuer } from '@/lib/stellar/usdc'

interface HorizonPayment {
  type: string
  to: string
  from: string
  asset_code?: string
  asset_issuer?: string
  amount: string
  transaction_hash: string
  created_at: string
  transaction: () => Promise<{ memo: string | null }>
}

async function syncHorizonPayments(userId: string, publicKey: string): Promise<void> {
  const usdcCode = getUSDCAssetCode()

  console.log('[sync] publicKey:', publicKey)
  console.log('[sync] USDC_ISSUER env:', getUSDCIssuer())

  // Traer últimos pagos de Horizon
  const page = await server.payments().forAccount(publicKey).limit(200).order('desc').call()

  console.log('[sync] total payments from Horizon:', page.records.length)
  ;(page.records as HorizonPayment[]).forEach((r: any) => {
    console.log('[sync] record:', r.type, r.asset_code, r.to?.slice(0, 8), r.transaction_hash?.slice(0, 8))
  })

  // Filtrar solo pagos USDC recibidos en esta cuenta
  const pk = publicKey.trim()
  const usdcPayments = (page.records as any[]).filter(
    (r) =>
      r.type === 'payment' &&
      (r.to?.trim() === pk || r.into?.trim() === pk) &&
      r.asset_code === usdcCode
  )

  for (const payment of usdcPayments) {
    try {
      // Verificar en DB si ya existe este tx — fuente única de verdad
      const { data: existing } = await supabaseAdmin
        .from('transactions')
        .select('id')
        .eq('stellar_tx_hash', payment.transaction_hash)
        .maybeSingle()

      if (existing) continue

      const tx = await payment.transaction()
      const memo = tx.memo ?? null

      const { data: newTx } = await supabaseAdmin
        .from('transactions')
        .insert({
          user_id: userId,
          stellar_tx_hash: payment.transaction_hash,
          type: 'payment_received',
          amount_usdc: parseFloat(payment.amount),
          memo,
          status: 'confirmed',
          created_at: payment.created_at,
        })
        .select('id')
        .single()

      // Marcar payment_request como pagado si el memo coincide
      if (memo && newTx) {
        const { data: pr } = await supabaseAdmin
          .from('payment_requests')
          .select('id')
          .eq('memo', memo)
          .eq('user_id', userId)
          .eq('status', 'pending')
          .single()

        if (pr) {
          await supabaseAdmin
            .from('payment_requests')
            .update({ status: 'paid', paid_tx_id: newTx.id })
            .eq('id', pr.id)
        }
      }

      console.log('[sync] nuevo pago insertado:', payment.transaction_hash?.slice(0, 8), 'memo:', memo)
    } catch (err) {
      console.error('[transactions] error syncing payment:', payment.transaction_hash, err)
    }
  }
}

export const GET = withAuth(async (req: NextRequest, user: JWTPayload) => {
  const { searchParams } = req.nextUrl
  const limit = parseInt(searchParams.get('limit') ?? '20')
  const offset = parseInt(searchParams.get('offset') ?? '0')

  // Obtener public_key real de DB
  const { data: stellarAccount } = await supabaseAdmin
    .from('stellar_accounts')
    .select('public_key')
    .eq('user_id', user.userId)
    .single()

  // Sincronizar pagos de Horizon antes de devolver los de DB
  if (stellarAccount?.public_key) {
    try {
      await syncHorizonPayments(user.userId, stellarAccount.public_key.trim())
    } catch (err) {
      console.error('[transactions] Horizon sync error:', err)
      // No bloquear el response si Horizon falla
    }
  }

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
