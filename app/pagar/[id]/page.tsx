'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

interface PaymentRequest {
  id: string
  amount_usdc: number
  description: string | null
  memo: string | null
  status: 'pending' | 'paid' | 'expired' | 'cancelled'
  expires_at: string | null
}

// La dirección de destino no viene en el GET /api/payments/[id] público.
// La obtenemos via el query param que agrega el link compartido,
// o bien la consultamos desde la página de cobro.
// Por ahora la mostramos si viene en el hash (#dest=G...) para no exponer la clave en BD pública.
// El flujo real: el comerciante comparte el link con la dest incluida via ?dest=

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={copy}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-indigo-500/20 text-slate-400 hover:text-indigo-300 text-xs font-medium transition-colors shrink-0"
    >
      {copied ? (
        <>
          <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-emerald-400">Copiado</span>
        </>
      ) : (
        <>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          {label}
        </>
      )}
    </button>
  )
}

export default function PagarPage() {
  const { id } = useParams<{ id: string }>()
  const [payment, setPayment] = useState<PaymentRequest | null>(null)
  const [destination, setDestination] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [paid, setPaid] = useState(false)

  // Leer destination desde query param ?dest=G...
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const dest = params.get('dest')
    if (dest && dest.startsWith('G')) {
      setDestination(dest)
    }
  }, [])

  // Fetch inicial + polling cada 3 segundos
  useEffect(() => {
    if (!id) return

    async function fetchPayment() {
      const res = await fetch(`/api/payments/${id}`)
      if (!res.ok) {
        setError('Este cobro no existe o ya expiró')
        return
      }
      const data: PaymentRequest = await res.json()
      setPayment(data)

      if (data.status === 'paid') {
        setPaid(true)
      }
    }

    fetchPayment()
    const interval = setInterval(() => {
      if (!paid) fetchPayment()
    }, 3000)

    return () => clearInterval(interval)
  }, [id, paid])

  // Actualizar la URL del comerciante para incluir dest si viene en la route del servidor
  // (cuando el comerciante comparte el link, lo hace desde QRGenerator que tiene la dest)

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <p className="text-4xl">⚠️</p>
          <p className="text-white font-semibold">{error}</p>
          <p className="text-slate-400 text-sm">El link puede haber expirado o ser incorrecto</p>
        </div>
      </div>
    )
  }

  if (!payment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (paid) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-24 h-24 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
            <svg className="w-12 h-12 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">¡Pago recibido!</p>
            <p className="font-mono text-3xl font-bold text-emerald-400 mt-1">
              ${payment.amount_usdc} USD
            </p>
            {payment.description && (
              <p className="text-slate-400 text-sm mt-2">{payment.description}</p>
            )}
          </div>
          <p className="text-slate-500 text-sm">El comerciante ya recibió tu pago en dólares</p>
        </div>
      </div>
    )
  }

  if (payment.status === 'expired') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <p className="text-4xl">⏰</p>
          <p className="text-white font-semibold">Este cobro expiró</p>
          <p className="text-slate-400 text-sm">Pide al comerciante que genere uno nuevo</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-5">

        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <span className="font-bold text-white">PosPago</span>
          </div>
          <p className="text-slate-400 text-sm">Te están cobrando</p>
          <p className="font-mono text-4xl font-bold text-white mt-1">
            ${payment.amount_usdc}
            <span className="text-lg text-slate-400 ml-1">USD</span>
          </p>
          {payment.description && (
            <p className="text-slate-400 mt-1">{payment.description}</p>
          )}
        </div>

        {/* Instrucciones */}
        <div className="bg-[#1A1A3E] rounded-2xl border border-white/10 p-5 space-y-4">
          <p className="text-sm font-semibold text-slate-300">
            Paga con cualquier wallet Stellar (Lobstr, LOBSTR, etc.)
          </p>

          <div className="space-y-1">
            {/* Paso 1: Dirección */}
            <div className="space-y-1.5">
              <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">
                1 · Dirección de destino
              </p>
              <div className="flex items-center gap-2 bg-[#12122E] rounded-xl px-4 py-3">
                <p className="font-mono text-xs text-slate-300 flex-1 break-all leading-relaxed">
                  {destination ?? '—'}
                </p>
                {destination && <CopyButton value={destination} label="Copiar" />}
              </div>
              {!destination && (
                <p className="text-xs text-yellow-400">
                  Pide al comerciante que te comparta el link completo con la dirección incluida
                </p>
              )}
            </div>

            {/* Paso 2: Monto */}
            <div className="space-y-1.5 pt-1">
              <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">
                2 · Monto exacto
              </p>
              <div className="flex items-center gap-2 bg-[#12122E] rounded-xl px-4 py-3">
                <p className="font-mono text-sm text-white flex-1">
                  {payment.amount_usdc} USDC
                </p>
                <CopyButton value={String(payment.amount_usdc)} label="Copiar" />
              </div>
            </div>

            {/* Paso 3: Memo */}
            <div className="space-y-1.5 pt-1">
              <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">
                3 · Memo
              </p>
              <div className="flex items-center gap-2 bg-[#12122E] rounded-xl px-4 py-3">
                <p className="font-mono text-sm text-white flex-1 tracking-widest">
                  {payment.memo ?? '—'}
                </p>
                {payment.memo && <CopyButton value={payment.memo} label="Copiar" />}
              </div>
              <p className="text-xs text-yellow-400 flex items-center gap-1">
                <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Debes incluir este memo o el pago no se identificará
              </p>
            </div>
          </div>
        </div>

        {/* Indicador de espera */}
        <div className="flex items-center justify-center gap-2 text-slate-500 text-sm">
          <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          Esperando confirmación de pago...
        </div>
      </div>
    </div>
  )
}
