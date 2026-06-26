'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { BalanceCard } from '@/components/business/BalanceCard'
import { TransactionList } from '@/components/business/TransactionList'
import { Card } from '@/components/ui/Card'

export default function PersonalDashboard() {
  const router = useRouter()
  const [token, setToken] = useState('')
  const [user, setUser] = useState<{ full_name: string } | null>(null)

  useEffect(() => {
    const t = localStorage.getItem('pospago_token')
    const u = localStorage.getItem('pospago_user')
    if (!t || !u) { router.replace('/login'); return }
    setToken(t)
    setUser(JSON.parse(u))
  }, [router])

  if (!token || !user) return null

  return (
    <div className="space-y-5">
      <div>
        <p className="text-slate-400 text-sm">Hola,</p>
        <h1 className="text-xl font-bold text-white">{user.full_name}</h1>
      </div>

      <BalanceCard token={token} localCurrency="ars" />

      <div className="grid grid-cols-2 gap-3">
        <Link href="/personal/metas">
          <Card className="text-center py-5 hover:border-indigo-500/50 transition-colors cursor-pointer">
            <div className="text-3xl mb-2">🎯</div>
            <p className="font-semibold text-white text-sm">Metas</p>
            <p className="text-xs text-slate-400 mt-0.5">Ahorro en USD</p>
          </Card>
        </Link>
        <Card className="text-center py-5 opacity-60 cursor-not-allowed">
          <div className="text-3xl mb-2">💳</div>
          <p className="font-semibold text-white text-sm">Depositar</p>
          <p className="text-xs text-slate-400 mt-0.5">Próximamente</p>
        </Card>
      </div>

      <div>
        <h2 className="font-semibold text-white mb-3">Mis movimientos</h2>
        <Card>
          <TransactionList token={token} />
        </Card>
      </div>
    </div>
  )
}
