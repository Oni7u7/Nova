'use client'

import { useEffect, useState } from 'react'
import { TransactionSkeleton } from '@/components/ui/Skeleton'
import { formatUSDC, formatRelativeTime } from '@/lib/utils/format'

interface Transaction {
  id: string
  type: 'payment_received' | 'withdrawal' | 'deposit'
  amount_usdc: number
  memo: string | null
  status: 'pending' | 'confirmed' | 'failed'
  created_at: string
}

interface TransactionListProps {
  token: string
  refreshTrigger?: number
  limit?: number
}

const STATUS_BADGE = {
  pending: { label: 'Pendiente', className: 'bg-yellow-500/20 text-yellow-400' },
  confirmed: { label: 'Confirmado', className: 'bg-emerald-500/20 text-emerald-400' },
  failed: { label: 'Fallido', className: 'bg-red-500/20 text-red-400' },
}

const TYPE_ICON = {
  payment_received: (
    <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
    </svg>
  ),
  withdrawal: (
    <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
    </svg>
  ),
  deposit: (
    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  ),
}

const TYPE_LABEL = {
  payment_received: 'Cobro recibido',
  withdrawal: 'Retiro al banco',
  deposit: 'Depósito',
}

export function TransactionList({ token, refreshTrigger, limit = 5 }: TransactionListProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchTransactions() {
      try {
        const res = await fetch(`/api/transactions?limit=${limit}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) {
          console.error('[TransactionList] API error:', res.status, await res.text())
          return
        }
        const data = await res.json()
        console.log('[TransactionList] transactions received:', data.transactions?.length ?? 0)
        setTransactions(data.transactions ?? [])
      } finally {
        setLoading(false)
      }
    }

    fetchTransactions()
  }, [token, refreshTrigger, limit])

  if (loading) {
    return (
      <div className="space-y-1 divide-y divide-white/5">
        {Array.from({ length: 3 }).map((_, i) => <TransactionSkeleton key={i} />)}
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-10 text-slate-500">
        <p className="text-4xl mb-3">💸</p>
        <p className="font-medium text-slate-400">Sin movimientos aún</p>
        <p className="text-sm mt-1">Genera un cobro para empezar</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-white/5">
      {transactions.map((tx) => {
        const badge = STATUS_BADGE[tx.status]
        return (
          <div key={tx.id} className="flex items-center gap-3 py-3">
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0">
              {TYPE_ICON[tx.type]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-200">
                {tx.memo ? `Ref: ${tx.memo}` : TYPE_LABEL[tx.type]}
              </p>
              <p className="text-xs text-slate-500">{formatRelativeTime(tx.created_at)}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-mono text-sm font-semibold text-white">
                {tx.type === 'withdrawal' ? '-' : '+'}${formatUSDC(tx.amount_usdc)}
              </p>
              <span className={`text-xs px-1.5 py-0.5 rounded-md font-medium ${badge.className}`}>
                {badge.label}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
