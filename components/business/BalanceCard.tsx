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
  hasTrustline: boolean
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
  const [activating, setActivating] = useState(false)
  const [activateError, setActivateError] = useState('')
  const [activated, setActivated] = useState(false)

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

  async function activateTrustline() {
    setActivating(true)
    setActivateError('')
    try {
      const res = await fetch('/api/wallet/setup-trustline', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      if (!res.ok) {
        const data = await res.json()
        setActivateError(data.error ?? 'Error al activar')
        return
      }
      setActivated(true)
      await fetchBalance()
    } catch {
      setActivateError('Error de conexión')
    } finally {
      setActivating(false)
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
    <div className="space-y-3">
      {balance && !balance.hasTrustline && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
          <p className="text-xs">
            {activated ? (
              <span className="text-emerald-400">¡Cuenta activada! Ya puedes recibir USDC.</span>
            ) : (
              <span className="text-yellow-300">Tu cuenta no puede recibir USDC todavía.</span>
            )}
            {activateError && (
              <span className="block text-red-400 mt-0.5">{activateError}</span>
            )}
          </p>
          <button
            onClick={activateTrustline}
            disabled={activating}
            className="shrink-0 px-3 py-1.5 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-200 text-xs font-semibold transition-colors disabled:opacity-50"
          >
            {activating ? 'Activando...' : 'Activar ahora'}
          </button>
        </div>
      )}
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
    </div>
  )
}
