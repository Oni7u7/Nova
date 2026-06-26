'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { toast } from '@/components/ui/Toast'

export function LoginForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (!form.email) errs.email = 'Ingresa tu correo'
    if (!form.password) errs.password = 'Ingresa tu contraseña'
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()

      if (!res.ok) {
        toast(data.error ?? 'Error al iniciar sesión', 'error')
        return
      }

      localStorage.setItem('pospago_token', data.token)
      localStorage.setItem('pospago_user', JSON.stringify(data.user))
      router.push(data.user.account_type === 'business' ? '/business' : '/personal')
    } catch {
      toast('Error de conexión', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Correo electrónico"
        type="email"
        placeholder="tu@correo.com"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        error={errors.email}
        autoComplete="email"
      />
      <Input
        label="Contraseña"
        type="password"
        placeholder="Tu contraseña"
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
        error={errors.password}
        autoComplete="current-password"
      />
      <Button type="submit" loading={loading} fullWidth size="lg" className="mt-2">
        Entrar
      </Button>
    </form>
  )
}
