'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { BalanceSkeleton } from '@/components/ui/Skeleton'
import { formatUSDC, formatCurrency } from '@/lib/utils/format'

interface BalanceData {
  usdc: string
  ars: string
  brl: string
  cop: string
}

interface BalanceCardProps {
  token: string
  localCurrency?: 'ars' | 'brl' | 'cop'
}

const CURRENCY_CONFIG = {
  ars: { label: 'Pesos argentinos', locale: 'es-AR', code: 'ARS' },
  brl: { label: 'Reales brasileños', locale: 'pt-BR', code: 'BRL' },
  cop: { label: 'Pesos colombianos', locale: 'es-CO', code: 'COP' },
}

export function BalanceCard({ token, localCurrency = 'ars' }: BalanceCardProps) {
  const [balance, setBalance] = useState<BalanceData | null>(null)
  const [loading, setLoading] = useState(true)

  async function fetchBalance() {
    try {
      const res = await fetch('/api/wallet/balance', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return
      const data = await res.json()
      setBalance(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBalance()
    const interval = setInterval(fetchBalance, 30_000)
    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  if (loading) return <BalanceSkeleton />

  const currConfig = CURRENCY_CONFIG[localCurrency]
  const localAmount = balance ? parseFloat(balance[localCurrency]) : 0

  return (
    <Card gradient className="space-y-1">
      <p className="text-sm text-slate-400 font-medium">Tu saldo en dólares</p>
      <p className="font-mono text-4xl font-bold text-white">
        ${formatUSDC(balance?.usdc ?? '0')}
        <span className="text-lg text-slate-400 ml-1">USD</span>
      </p>
      <p className="text-sm text-emerald-400">
        ≈ {formatCurrency(localAmount, currConfig.code, currConfig.locale)}{' '}
        <span className="text-slate-500">{currConfig.label}</span>
      </p>
    </Card>
  )
}
