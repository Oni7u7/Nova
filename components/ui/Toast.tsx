'use client'

import { useEffect, useState } from 'react'

export type ToastType = 'success' | 'error' | 'info'

interface ToastMessage {
  id: number
  message: string
  type: ToastType
}

let toastId = 0
type ToastListener = (msg: ToastMessage) => void
const listeners: ToastListener[] = []

export function toast(message: string, type: ToastType = 'info') {
  const msg = { id: ++toastId, message, type }
  listeners.forEach((l) => l(msg))
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  useEffect(() => {
    const handler = (msg: ToastMessage) => {
      setToasts((prev) => [...prev, msg])
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== msg.id))
      }, 3500)
    }
    listeners.push(handler)
    return () => {
      const idx = listeners.indexOf(handler)
      if (idx !== -1) listeners.splice(idx, 1)
    }
  }, [])

  const icons = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
  }

  const colors = {
    success: 'bg-emerald-500',
    error: 'bg-red-500',
    info: 'bg-indigo-500',
  }

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-[320px]">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl text-white text-sm font-medium shadow-lg ${colors[t.type]} animate-in slide-in-from-right-4 duration-200`}
        >
          <span className="text-base">{icons[t.type]}</span>
          {t.message}
        </div>
      ))}
    </div>
  )
}
