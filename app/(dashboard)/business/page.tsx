'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { BalanceCard } from '@/components/business/BalanceCard'
import { TransactionList } from '@/components/business/TransactionList'
import { Card } from '@/components/ui/Card'

interface User {
  full_name: string
  business_name: string | null
  stellar_public_key: string
}

export default function BusinessDashboard() {
  const router = useRouter()
  const [token, setToken] = useState('')
  const [user, setUser] = useState<User | null>(null)
  const [refreshTx, setRefreshTx] = useState(0)

  useEffect(() => {
    const t = localStorage.getItem('pospago_token')
    const u = localStorage.getItem('pospago_user')
    if (!t || !u) { router.replace('/login'); return }
    setToken(t)
    setUser(JSON.parse(u))
  }, [router])

  // Polling cada 5s para refrescar balance y transacciones automáticamente
  useEffect(() => {
    if (!token) return
    const interval = setInterval(() => {
      setRefreshTx(n => n + 1)
    }, 5000)
    return () => clearInterval(interval)
  }, [token])

  if (!token || !user) return null

  return (
    <div className="space-y-5">
      {/* Saludo */}
      <div>
        <p className="text-slate-400 text-sm">Bienvenido,</p>
        <h1 className="text-xl font-bold text-white">
          {user.business_name ?? user.full_name}
        </h1>
      </div>

      {/* Saldo */}
      <BalanceCard token={token} refreshTrigger={refreshTx} />

      {/* Acciones rápidas */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/business/cobrar">
          <Card className="text-center py-5 hover:border-indigo-500/50 transition-colors cursor-pointer">
            <div className="text-3xl mb-2">💲</div>
            <p className="font-semibold text-white text-sm">Cobrar</p>
            <p className="text-xs text-slate-400 mt-0.5">Generar QR</p>
          </Card>
        </Link>
        <Card className="text-center py-5 opacity-60 cursor-not-allowed">
          <div className="text-3xl mb-2">🏦</div>
          <p className="font-semibold text-white text-sm">Retirar</p>
          <p className="text-xs text-slate-400 mt-0.5">A tu banco</p>
        </Card>
      </div>

      {/* Transacciones recientes */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-white">Movimientos recientes</h2>
          <Link href="/business/historial" className="text-indigo-400 text-sm">
            Ver todo
          </Link>
        </div>
        <Card>
          <TransactionList token={token} refreshTrigger={refreshTx} />
        </Card>
      </div>
    </div>
  )
}
