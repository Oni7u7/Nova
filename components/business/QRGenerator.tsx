'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { toast } from '@/components/ui/Toast'
import Image from 'next/image'

interface QRData {
  id: string
  memo: string
  amount_usdc: number
  description: string | null
  payment_url: string
  destination: string
  qr_base64: string
  expires_at: string
}

interface QRGeneratorProps {
  token: string
}

function CopyRow({ label, value, warning }: { label: string; value: string; warning?: string }) {
  async function copy() {
    await navigator.clipboard.writeText(value)
    toast(`${label} copiado`, 'success')
  }

  const display = value.length > 20 ? `${value.slice(0, 8)}...${value.slice(-8)}` : value

  return (
    <div className="flex items-center justify-between gap-3 py-2.5 border-b border-white/5 last:border-0">
      <div className="min-w-0">
        <p className="text-xs text-slate-500 mb-0.5">{label}</p>
        <p className="font-mono text-sm text-slate-200 truncate">{display}</p>
        {warning && <p className="text-xs text-yellow-400 mt-0.5">{warning}</p>}
      </div>
      <button
        onClick={copy}
        className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-indigo-500/20 text-slate-400 hover:text-indigo-300 text-xs font-medium transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        Copiar
      </button>
    </div>
  )
}

export function QRGenerator({ token }: QRGeneratorProps) {
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [qrData, setQrData] = useState<QRData | null>(null)
  const [amountError, setAmountError] = useState('')

  async function generateQR() {
    const num = parseFloat(amount)
    if (!amount || isNaN(num) || num <= 0) {
      setAmountError('Ingresa un monto válido')
      return
    }
    setAmountError('')
    setLoading(true)

    try {
      const res = await fetch('/api/payments/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount_usdc: num, description: description || undefined }),
      })
      const data = await res.json()

      if (!res.ok) {
        toast(data.error ?? 'Error generando el cobro', 'error')
        return
      }

      setQrData(data)
    } catch {
      toast('Error de conexión', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function shareLink() {
    if (!qrData) return
    // Incluir dest en el link para que la página pública pueda mostrar la dirección
    const linkWithDest = `${qrData.payment_url}?dest=${qrData.destination}`
    if (navigator.share) {
      await navigator.share({
        title: 'Pago con PosPago',
        text: `Paga $${qrData.amount_usdc} USD${qrData.description ? ` — ${qrData.description}` : ''}`,
        url: linkWithDest,
      })
    } else {
      await navigator.clipboard.writeText(linkWithDest)
      toast('Link copiado', 'success')
    }
  }

  function newCharge() {
    setQrData(null)
    setAmount('')
    setDescription('')
  }

  if (qrData) {
    return (
      <Card className="space-y-4">
        {/* Monto */}
        <div className="text-center">
          <p className="text-slate-400 text-sm">Cobrar</p>
          <p className="font-mono text-3xl font-bold text-white">
            ${qrData.amount_usdc}{' '}
            <span className="text-base text-slate-400">USD</span>
          </p>
          {qrData.description && (
            <p className="text-slate-400 text-sm mt-1">{qrData.description}</p>
          )}
        </div>

        {/* QR — apunta a la página pública */}
        <div className="flex justify-center">
          <div className="bg-white p-3 rounded-2xl">
            <Image
              src={qrData.qr_base64}
              alt="QR de cobro"
              width={220}
              height={220}
              className="rounded-lg"
            />
          </div>
        </div>

        <p className="text-center text-xs text-slate-500">
          El cliente escanea con la cámara del celular
        </p>

        {/* Datos copiables para quien no pueda escanear */}
        <div className="bg-[#12122E] rounded-xl px-4 py-1">
          <CopyRow
            label="Dirección de destino"
            value={qrData.destination}
          />
          <CopyRow
            label="Memo (obligatorio)"
            value={qrData.memo}
            warning="El cliente DEBE incluir este memo"
          />
          <CopyRow
            label="Monto"
            value={`${qrData.amount_usdc} USDC`}
          />
        </div>

        {/* Acciones */}
        <div className="space-y-2">
          <Button onClick={shareLink} fullWidth size="lg" variant="primary">
            Compartir link
          </Button>
          <Button onClick={newCharge} fullWidth variant="ghost">
            Nuevo cobro
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card className="space-y-4">
      <h2 className="text-lg font-semibold text-white">Generar cobro</h2>

      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-lg">$</span>
        <input
          type="number"
          inputMode="decimal"
          placeholder="0.00"
          value={amount}
          onChange={(e) => { setAmount(e.target.value); setAmountError('') }}
          className={`
            w-full pl-8 pr-16 py-4 rounded-xl bg-[#12122E] border
            font-mono text-3xl font-bold text-white placeholder:text-slate-600
            focus:outline-none focus:ring-2 focus:ring-indigo-500
            min-h-[72px]
            ${amountError ? 'border-red-500' : 'border-white/10'}
          `}
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold">USD</span>
      </div>
      {amountError && <p className="text-xs text-red-400 -mt-2">{amountError}</p>}

      <Input
        label="Descripción (opcional)"
        placeholder="Ej. Tacos de suadero"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <Button onClick={generateQR} loading={loading} fullWidth size="lg">
        Generar QR
      </Button>
    </Card>
  )
}
