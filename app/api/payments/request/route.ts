export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { withAuth, JWTPayload, getKeypairForUser } from '@/lib/auth/middleware'
import { supabaseAdmin } from '@/lib/supabase/client'
import { generateQRBase64, buildSEP7PaymentURI } from '@/lib/utils/qr'
import { getUSDCAssetCode, getUSDCIssuer } from '@/lib/stellar/usdc'

export const POST = withAuth(async (req: NextRequest, user: JWTPayload) => {
  try {
    const body = await req.json()
    const { amount_usdc, description } = body

    if (!amount_usdc || isNaN(parseFloat(amount_usdc)) || parseFloat(amount_usdc) <= 0) {
      return NextResponse.json({ error: 'Monto inválido' }, { status: 400 })
    }

    // Crear payment_request con memo de 8 chars (primeros 8 del UUID)
    const { data: paymentRequest, error } = await supabaseAdmin
      .from('payment_requests')
      .insert({
        user_id: user.userId,
        amount_usdc: parseFloat(amount_usdc),
        description: description ?? null,
        status: 'pending',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h
      })
      .select('id, amount_usdc, description, status, expires_at')
      .single()

    if (error || !paymentRequest) {
      console.error('Error creando payment request:', error)
      return NextResponse.json({ error: 'Error al generar el cobro' }, { status: 500 })
    }

    const memo = paymentRequest.id.replace(/-/g, '').slice(0, 8).toUpperCase()

    // Actualizar con el memo generado
    await supabaseAdmin
      .from('payment_requests')
      .update({ memo })
      .eq('id', paymentRequest.id)

    // Validar public key — si el JWT trae datos corruptos, leer de DB directamente
    let destination = user.stellarPublicKey.trim()
    console.log('[QR dest check] publicKey length:', destination.length, 'value:', destination)
    if (!destination.startsWith('G') || destination.length !== 56) {
      console.error('[QR] public key inválida en JWT, releyendo de DB...')
      try {
        const keypair = await getKeypairForUser(user.userId)
        destination = keypair.publicKey()
        console.log('[QR] public key recuperada de DB:', destination)
      } catch {
        return NextResponse.json({ error: 'Dirección Stellar inválida, re-inicia sesión' }, { status: 500 })
      }
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://pospago.app'
    // Incluir dest, amount, memo y desc para que la página pública muestre todos los datos
    const paymentUrl = `${baseUrl}/pagar/${paymentRequest.id}?dest=${destination}&amount=${paymentRequest.amount_usdc}&memo=${memo}&desc=${encodeURIComponent(description ?? '')}`
    const assetCode = getUSDCAssetCode()
    const assetIssuer = getUSDCIssuer()
    console.log('[QR] destination:', destination, 'amount:', amount_usdc, 'assetCode:', assetCode, 'assetIssuer:', assetIssuer)

    // El QR apunta a la página pública — funciona con cualquier cámara de celular
    const qr_base64 = await generateQRBase64(paymentUrl)

    // El URI SEP-7 se devuelve para uso opcional (desktop wallets)
    const sep7Uri = buildSEP7PaymentURI({
      destination,
      amount: parseFloat(amount_usdc).toFixed(7),
      assetCode,
      assetIssuer,
      memo,
    })

    return NextResponse.json({
      id: paymentRequest.id,
      memo,
      amount_usdc: paymentRequest.amount_usdc,
      description: paymentRequest.description,
      payment_url: paymentUrl,
      sep7_uri: sep7Uri,
      destination,
      qr_base64,
      expires_at: paymentRequest.expires_at,
    })
  } catch (err) {
    console.error('Payment request error:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
})
