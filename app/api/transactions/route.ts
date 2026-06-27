export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { withAuth, JWTPayload } from '@/lib/auth/middleware'
import { supabaseAdmin } from '@/lib/supabase/client'

async function syncHorizonPayments(userId: string, publicKey: string): Promise<void> {
  const { Horizon } = await import('@stellar/stellar-sdk')
  const horizonServer = new Horizon.Server(
    process.env.STELLAR_NETWORK === 'mainnet'
      ? 'https://horizon.stellar.org'
      : 'https://horizon-testnet.stellar.org'
  )

  // Una sola query al inicio — todos los hashes conocidos para este usuario
  const { data: existing } = await supabaseAdmin
    .from('transactions')
    .select('stellar_tx_hash')
    .eq('user_id', userId)
    .eq('type', 'payment_received')

  const knownHashes = new Set(
    (existing ?? []).map((r: any) => r.stellar_tx_hash).filter(Boolean)
  )

  const payments = await horizonServer.payments()
    .forAccount(publicKey)
    .limit(200)
    .order('desc')
    .call()

  console.log('[sync] publicKey:', publicKey, '| records:', payments.records.length)

  for (const record of payments.records as any[]) {
    if (record.type !== 'payment') continue
    if (record.asset_code !== 'USDC') continue
    if (record.to?.trim() !== publicKey.trim()) continue

    const txHash: string = record.transaction_hash
    if (knownHashes.has(txHash)) continue

    let memo = ''
    try {
      const tx = await horizonServer.transactions().transaction(txHash).call()
      memo = tx.memo_type === 'text' ? (tx.memo ?? '') : ''
    } catch {
      memo = ''
    }

    console.log('[sync] procesando:', txHash.slice(0, 8), '| memo:', memo || '(sin memo)')

    const { data: inserted, error } = await supabaseAdmin
      .from('transactions')
      .insert({
        user_id: userId,
        stellar_tx_hash: txHash,
        type: 'payment_received',
        amount_usdc: parseFloat(record.amount),
        memo: memo || null,
        status: 'confirmed',
        created_at: record.created_at,
      })
      .select('id')
      .single()

    if (error) {
      if (error.code === '23505') {
        knownHashes.add(txHash) // ya existe — no reintentar
      } else {
        console.error('[sync] error insertando:', error.code, error.message)
      }
      continue
    }

    knownHashes.add(txHash)
    console.log('[sync] insertado:', txHash.slice(0, 8), '| memo:', memo || '(sin memo)')

    if (memo && inserted) {
      await supabaseAdmin
        .from('payment_requests')
        .update({ status: 'paid', paid_tx_id: inserted.id })
        .ilike('memo', memo)
        .eq('user_id', userId)
        .eq('status', 'pending')
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
