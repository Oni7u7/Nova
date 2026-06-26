'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { QRGenerator } from '@/components/business/QRGenerator'
import { ToastContainer } from '@/components/ui/Toast'

export default function CobrarPage() {
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
      <ToastContainer />
      <div>
        <h1 className="text-xl font-bold text-white">Generar cobro</h1>
        <p className="text-sm text-slate-400 mt-1">
          Ingresa el monto y comparte el QR o el link
        </p>
      </div>
      <QRGenerator token={token} />
    </div>
  )
}
