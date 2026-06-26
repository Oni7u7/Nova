import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'
import { server } from '@/lib/stellar/client'
import { supabaseAdmin } from '@/lib/supabase/client'
import { USDC } from '@/lib/stellar/usdc'
import type { JWTPayload } from '@/lib/auth/middleware'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  // Verificar JWT desde query param (EventSource no soporta headers)
  const token = req.nextUrl.searchParams.get('token')
  if (!token) {
    return new Response('No autorizado', { status: 401 })
  }

  let user: JWTPayload
  try {
    user = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload
  } catch {
    return new Response('Token inválido', { status: 401 })
  }

  const encoder = new TextEncoder()
  let closeStream: (() => void) | null = null

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        )
      }

      // Heartbeat cada 30s para mantener la conexión viva
      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(': heartbeat\n\n'))
      }, 30_000)

      closeStream = server
        .payments()
        .forAccount(user.stellarPublicKey)
        .cursor('now')
        .stream({
          onmessage: async (record) => {
            if (record.type !== 'payment') return

            const payment = record as {
              type: string
              to: string
              asset_code?: string
              asset_issuer?: string
              amount: string
              from: string
              transaction_hash: string
              id: string
              created_at: string
              transaction: () => Promise<{ memo: string | null }>
            }

            if (payment.to !== user.stellarPublicKey) return
            if (
              payment.asset_code !== USDC.getCode() ||
              payment.asset_issuer !== USDC.getIssuer()
            ) return

            try {
              const tx = await payment.transaction()
              const memo = tx.memo ?? null

              // Insertar transacción
              const { data: transaction } = await supabaseAdmin
                .from('transactions')
                .insert({
                  user_id: user.userId,
                  stellar_tx_hash: payment.transaction_hash,
                  type: 'payment_received',
                  amount_usdc: parseFloat(payment.amount),
                  memo,
                  status: 'confirmed',
                })
                .select('id')
                .single()

              // Si el memo coincide con un payment_request, marcarlo como pagado
              if (memo && transaction) {
                const { data: pr } = await supabaseAdmin
                  .from('payment_requests')
                  .select('id')
                  .eq('memo', memo)
                  .eq('user_id', user.userId)
                  .eq('status', 'pending')
                  .single()

                if (pr) {
                  await supabaseAdmin
                    .from('payment_requests')
                    .update({ status: 'paid', paid_tx_id: transaction.id })
                    .eq('id', pr.id)
                }
              }

              send('payment', {
                id: payment.id,
                txHash: payment.transaction_hash,
                amount: payment.amount,
                from: payment.from,
                memo,
                createdAt: payment.created_at,
              })
            } catch (err) {
              console.error('Stream payment processing error:', err)
            }
          },
          onerror: (err) => {
            console.error('Horizon stream error:', err)
            clearInterval(heartbeat)
            controller.close()
          },
        })

      // Limpiar cuando el cliente desconecta
      req.signal.addEventListener('abort', () => {
        clearInterval(heartbeat)
        if (closeStream) closeStream()
        controller.close()
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
