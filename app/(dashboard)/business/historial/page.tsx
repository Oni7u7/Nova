'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { TransactionList } from '@/components/business/TransactionList'
import { Card } from '@/components/ui/Card'

export default function HistorialPage() {
  const router = useRouter()
  const [token, setToken] = useState('')

  useEffect(() => {
    const t = localStorage.getItem('pospago_token')
    if (!t) { router.replace('/login'); return }
    setToken(t)
  }, [router])

  if (!token) return null

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-white">Historial</h1>
      <Card>
        <TransactionList token={token} limit={50} />
      </Card>
    </div>
  )
}
