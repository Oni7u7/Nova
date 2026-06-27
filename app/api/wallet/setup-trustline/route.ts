export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { withAuth, JWTPayload, getKeypairForUser } from '@/lib/auth/middleware'
import { server } from '@/lib/stellar/client'
import { TransactionBuilder, Operation, Asset, Networks, BASE_FEE } from '@stellar/stellar-sdk'

export const POST = withAuth(async (_req: NextRequest, user: JWTPayload) => {
  try {
    const keypair = await getKeypairForUser(user.userId)
    const usdc = new Asset(process.env.USDC_ASSET_CODE!, process.env.USDC_ISSUER!)
    const networkPassphrase =
      process.env.STELLAR_NETWORK === 'mainnet' ? Networks.PUBLIC : Networks.TESTNET

    const account = await server.loadAccount(keypair.publicKey())
    const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase })
      .addOperation(Operation.changeTrust({ asset: usdc }))
      .setTimeout(30)
      .build()
    tx.sign(keypair)
    await server.submitTransaction(tx)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Setup trustline error:', err)
    return NextResponse.json({ error: 'Error al configurar trustline USDC' }, { status: 500 })
  }
})
