'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('pospago_token')
    const userStr = localStorage.getItem('pospago_user')

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr)
        router.replace(user.account_type === 'business' ? '/business' : '/personal')
        return
      } catch {
        localStorage.removeItem('pospago_token')
        localStorage.removeItem('pospago_user')
      }
    }

    router.replace('/login')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
