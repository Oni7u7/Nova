import { server } from './client'
import { USDC } from './usdc'

export type PaymentEvent = {
  id: string
  txHash: string
  amount: string
  from: string
  memo: string | null
  createdAt: string
}

/**
 * Abre un stream de pagos entrantes para una cuenta Stellar.
 * Retorna la función para cerrar el stream.
 */
export function streamIncomingPayments(
  publicKey: string,
  onPayment: (payment: PaymentEvent) => void,
  onError: (err: Error) => void
): () => void {
  const closeStream = server
    .payments()
    .forAccount(publicKey)
    .cursor('now')
    .stream({
      onmessage: (record) => {
        // Solo pagos entrantes en USDC
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
        if (payment.to !== publicKey) return
        if (
          payment.asset_code !== USDC.getCode() ||
          payment.asset_issuer !== USDC.getIssuer()
        ) return

        payment.transaction().then((tx) => {
          onPayment({
            id: payment.id,
            txHash: payment.transaction_hash,
            amount: payment.amount,
            from: payment.from,
            memo: tx.memo ?? null,
            createdAt: payment.created_at,
          })
        }).catch(onError)
      },
      onerror: (err: unknown) => onError(new Error(String(err))),
    })

  return closeStream
}
