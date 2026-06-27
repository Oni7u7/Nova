export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { withAuth, JWTPayload } from '@/lib/auth/middleware'
import { server } from '@/lib/stellar/client'
import { USDC } from '@/lib/stellar/usdc'
import { supabaseAdmin } from '@/lib/supabase/client'

type ExchangeRates = {
  ars: number
  brl: number
  cop: number
}

async function getExchangeRates(): Promise<ExchangeRates> {
  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=usd-coin&vs_currencies=ars,brl,cop',
      { next: { revalidate: 300 } } // cache 5 minutos
    )
    if (!res.ok) throw new Error('CoinGecko unavailable')
    const data = await res.json()
    return {
      ars: data['usd-coin'].ars,
      brl: data['usd-coin'].brl,
      cop: data['usd-coin'].cop,
    }
  } catch {
    // Fallback con tasas aproximadas
    return { ars: 1050, brl: 5.0, cop: 4100 }
  }
}

export const GET = withAuth(async (_req: NextRequest, user: JWTPayload) => {
  try {
    // Leer public_key de DB — evita usar clave corrupta del JWT
    const { data: stellarAccount } = await supabaseAdmin
      .from('stellar_accounts')
      .select('public_key')
      .eq('user_id', user.userId)
      .single()

    const publicKey = stellarAccount?.public_key.trim() ?? user.stellarPublicKey.trim()

    const [account, rates] = await Promise.all([
      server.accounts().accountId(publicKey).call(),
      getExchangeRates(),
    ])

    const usdcBalance = account.balances.find(
      (b) =>
        b.asset_type === 'credit_alphanum4' &&
        (b as { asset_code: string; asset_issuer: string }).asset_code === USDC.getCode() &&
        (b as { asset_code: string; asset_issuer: string }).asset_issuer === USDC.getIssuer()
    )

    const hasTrustline = !!usdcBalance
    const usdc = parseFloat(usdcBalance?.balance ?? '0')

    return NextResponse.json({
      usdc: usdc.toFixed(2),
      ars: (usdc * rates.ars).toFixed(0),
      brl: (usdc * rates.brl).toFixed(2),
      cop: (usdc * rates.cop).toFixed(0),
      hasTrustline,
      rates,
    })
  } catch (err) {
    const error = err as { response?: { status: number } }
    if (error?.response?.status === 404) {
      return NextResponse.json({
        usdc: '0.00',
        ars: '0',
        brl: '0.00',
        cop: '0',
        hasTrustline: false,
        rates: { ars: 0, brl: 0, cop: 0 },
      })
    }
    console.error('Balance error:', err)
    return NextResponse.json({ error: 'Error al obtener el saldo' }, { status: 500 })
  }
})
