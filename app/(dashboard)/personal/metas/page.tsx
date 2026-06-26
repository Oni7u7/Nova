'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { formatUSDC } from '@/lib/utils/format'
import { toast } from '@/components/ui/Toast'

interface SavingsGoal {
  id: string
  name: string
  target_usdc: number
  current_usdc: number
  deadline: string | null
  is_active: boolean
}

export default function MetasPage() {
  const router = useRouter()
  const [token, setToken] = useState('')
  const [goals, setGoals] = useState<SavingsGoal[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', target_usdc: '', deadline: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const t = localStorage.getItem('pospago_token')
    if (!t) { router.replace('/login'); return }
    setToken(t)
    fetchGoals(t)
  }, [router])

  async function fetchGoals(t: string) {
    try {
      const res = await fetch('/api/savings', {
        headers: { Authorization: `Bearer ${t}` },
      })
      if (res.ok) {
        const data = await res.json()
        setGoals(data.goals ?? [])
      }
    } finally {
      setLoading(false)
    }
  }

  async function createGoal() {
    if (!form.name || !form.target_usdc) return
    setSaving(true)
    try {
      const res = await fetch('/api/savings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: form.name,
          target_usdc: parseFloat(form.target_usdc),
          deadline: form.deadline || undefined,
        }),
      })
      if (res.ok) {
        toast('Meta creada', 'success')
        setShowForm(false)
        setForm({ name: '', target_usdc: '', deadline: '' })
        fetchGoals(token)
      } else {
        const d = await res.json()
        toast(d.error ?? 'Error al crear la meta', 'error')
      }
    } finally {
      setSaving(false)
    }
  }

  if (!token) return null

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Mis metas de ahorro</h1>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : '+ Nueva'}
        </Button>
      </div>

      {showForm && (
        <Card className="space-y-3">
          <h2 className="font-semibold text-white">Nueva meta</h2>
          <Input
            label="Nombre de la meta"
            placeholder="Ej. Vacaciones"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Input
            label="Meta en dólares (USD)"
            type="number"
            placeholder="500"
            value={form.target_usdc}
            onChange={(e) => setForm({ ...form, target_usdc: e.target.value })}
          />
          <Input
            label="Fecha límite (opcional)"
            type="date"
            value={form.deadline}
            onChange={(e) => setForm({ ...form, deadline: e.target.value })}
          />
          <Button onClick={createGoal} loading={saving} fullWidth>
            Crear meta
          </Button>
        </Card>
      )}

      {loading ? (
        <p className="text-slate-500 text-center py-10">Cargando...</p>
      ) : goals.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <p className="text-4xl mb-3">🎯</p>
          <p className="font-medium text-slate-400">Sin metas de ahorro</p>
          <p className="text-sm mt-1">Crea una meta para empezar a ahorrar en dólares</p>
        </div>
      ) : (
        <div className="space-y-3">
          {goals.map((goal) => {
            const pct = Math.min((goal.current_usdc / goal.target_usdc) * 100, 100)
            return (
              <Card key={goal.id} className="space-y-3">
                <div className="flex items-start justify-between">
                  <p className="font-semibold text-white">{goal.name}</p>
                  <span className="text-sm font-mono text-emerald-400">
                    {pct.toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div
                    className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex justify-between text-sm text-slate-400">
                  <span className="font-mono">${formatUSDC(goal.current_usdc)} USD</span>
                  <span className="font-mono">Meta: ${formatUSDC(goal.target_usdc)}</span>
                </div>
                {goal.deadline && (
                  <p className="text-xs text-slate-500">
                    Fecha límite: {new Date(goal.deadline).toLocaleDateString('es')}
                  </p>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
