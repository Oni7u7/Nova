'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { toast } from '@/components/ui/Toast'

type AccountType = 'personal' | 'business'

export function RegisterForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [accountType, setAccountType] = useState<AccountType>('business')
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    business_name: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate() {
    const errs: Record<string, string> = {}
    if (!form.full_name.trim()) errs.full_name = 'Ingresa tu nombre completo'
    if (!form.email.trim()) errs.email = 'Ingresa tu correo'
    if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Correo inválido'
    if (form.password.length < 8) errs.password = 'Mínimo 8 caracteres'
    if (accountType === 'business' && !form.business_name.trim())
      errs.business_name = 'Ingresa el nombre de tu negocio'
    return errs
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) {
      setErrors(errs)
      return
    }
    setErrors({})
    setLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, account_type: accountType }),
      })
      const data = await res.json()

      if (!res.ok) {
        toast(data.error ?? 'Error al registrarte', 'error')
        return
      }

      localStorage.setItem('pospago_token', data.token)
      localStorage.setItem('pospago_user', JSON.stringify(data.user))
      toast('Cuenta creada', 'success')
      router.push(accountType === 'business' ? '/business' : '/personal')
    } catch {
      toast('Error de conexión', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Selector de tipo de cuenta */}
      <div className="grid grid-cols-2 gap-2 p-1 bg-[#12122E] rounded-xl">
        {(['business', 'personal'] as AccountType[]).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setAccountType(type)}
            className={`py-2.5 rounded-lg text-sm font-semibold transition-all ${
              accountType === type
                ? 'bg-indigo-500 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {type === 'business' ? 'Negocio' : 'Personal'}
          </button>
        ))}
      </div>

      <Input
        label="Tu nombre completo"
        placeholder="María García"
        value={form.full_name}
        onChange={(e) => setForm({ ...form, full_name: e.target.value })}
        error={errors.full_name}
        autoComplete="name"
      />

      {accountType === 'business' && (
        <Input
          label="Nombre de tu negocio"
          placeholder="Taquería El Buen Sabor"
          value={form.business_name}
          onChange={(e) => setForm({ ...form, business_name: e.target.value })}
          error={errors.business_name}
        />
      )}

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
        placeholder="Mínimo 8 caracteres"
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
        error={errors.password}
        hint="Mínimo 8 caracteres"
        autoComplete="new-password"
      />

      <Button type="submit" loading={loading} fullWidth size="lg" className="mt-2">
        Crear cuenta gratis
      </Button>
    </form>
  )
}
