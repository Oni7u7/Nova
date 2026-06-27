/**
 * Script de diagnóstico: inspecciona pagos USDC recibidos por la cuenta del comerciante.
 *
 * Uso:
 *   npx ts-node --skip-project scripts/check-txs.ts
 *
 * Resultados confirmados (Jun 26 2026):
 *   Op 14181500975071233 → tx c807b52f... | 2.0 USDC | memo 6877069B
 *   Op 14182755105509377 → tx 1525b05f... | 1.0 USDC | memo 3C5F5E59
 *   Issuer: GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5 (NUEVO ✅)
 *   To: GBBGMARTBXPZC3JQOU6AMUBFMGUYSFRN664Y2RVBAARUFGXZFTM3DHHY
 */

import { Horizon } from '@stellar/stellar-sdk'

const server = new Horizon.Server('https://horizon-testnet.stellar.org')

// Dirección del comerciante confirmada en Horizon
const MERCHANT_KEY = 'GBBGMARTBXPZC3JQOU6AMUBFMGUYSFRN664Y2RVBAARUFGXZFTM3DHHY'

async function main() {
  console.log('Cuenta:', MERCHANT_KEY)

  const page = await server.payments()
    .forAccount(MERCHANT_KEY)
    .limit(50)
    .order('desc')
    .call()

  const usdc = (page.records as any[]).filter(
    (r) => r.type === 'payment' && r.to?.trim() === MERCHANT_KEY && r.asset_code === 'USDC'
  )

  console.log(`\nTotal pagos en Horizon: ${page.records.length}`)
  console.log(`Pagos USDC recibidos: ${usdc.length}\n`)

  for (const p of usdc) {
    const tx = await server.transactions().transaction(p.transaction_hash).call()
    console.log('─'.repeat(50))
    console.log('tx_hash     :', p.transaction_hash)
    console.log('amount      :', p.amount, 'USDC')
    console.log('from        :', p.from)
    console.log('asset_issuer:', p.asset_issuer)
    console.log('created_at  :', p.created_at)
    console.log('memo_type   :', (tx as any).memo_type)
    console.log('memo        :', (tx as any).memo)
  }
}

main().catch(console.error)
