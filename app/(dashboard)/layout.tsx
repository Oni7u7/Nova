'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { ToastContainer } from '@/components/ui/Toast'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [ready, setReady] = useState(false)
  const [accountType, setAccountType] = useState<'business' | 'personal' | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('pospago_token')
    const userStr = localStorage.getItem('pospago_user')
    if (!token || !userStr) {
      router.replace('/login')
      return
    }
    try {
      const user = JSON.parse(userStr)
      setAccountType(user.account_type)
      setReady(true)
    } catch {
      router.replace('/login')
    }
  }, [router])

  function logout() {
    localStorage.removeItem('pospago_token')
    localStorage.removeItem('pospago_user')
    router.push('/login')
  }

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const navLinks =
    accountType === 'business'
      ? [
          { href: '/business', label: 'Inicio', icon: '🏠' },
          { href: '/business/cobrar', label: 'Cobrar', icon: '💲' },
          { href: '/business/historial', label: 'Historial', icon: '📋' },
        ]
      : [
          { href: '/personal', label: 'Inicio', icon: '🏠' },
          { href: '/personal/metas', label: 'Metas', icon: '🎯' },
        ]

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto">
      <ToastContainer />

      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
            <span className="text-white font-bold text-sm">P</span>
          </div>
          <span className="font-bold text-white">PosPago</span>
        </div>
        <button
          onClick={logout}
          className="text-sm text-slate-400 hover:text-slate-200 transition-colors"
        >
          Salir
        </button>
      </header>

      {/* Contenido */}
      <main className="flex-1 px-4 py-6 space-y-4 overflow-y-auto pb-24">
        {children}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md border-t border-white/10 bg-[#0F0F23] px-4 py-2 flex justify-around">
        {navLinks.map((link) => {
          const isActive = pathname === link.href
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center gap-0.5 py-2 px-4 rounded-lg transition-colors ${
                isActive
                  ? 'text-indigo-400'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <span className="text-xl">{link.icon}</span>
              <span className="text-xs font-medium">{link.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
