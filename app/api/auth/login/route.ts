export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { supabaseAdmin } from '@/lib/supabase/client'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Correo y contraseña son obligatorios' }, { status: 400 })
    }

    // Buscar usuario
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, account_type, business_name, password_hash')
      .eq('email', email.toLowerCase())
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'Correo o contraseña incorrectos' }, { status: 401 })
    }

    // Verificar contraseña
    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) {
      return NextResponse.json({ error: 'Correo o contraseña incorrectos' }, { status: 401 })
    }

    // Obtener public key de Stellar
    const { data: stellarAccount } = await supabaseAdmin
      .from('stellar_accounts')
      .select('public_key')
      .eq('user_id', user.id)
      .single()

    if (!stellarAccount) {
      return NextResponse.json({ error: 'Cuenta incompleta, contacta soporte' }, { status: 500 })
    }

    const publicKey = stellarAccount.public_key.trim()
    if (!publicKey.startsWith('G') || publicKey.length !== 56) {
      console.error('[login] public_key inválida en DB:', JSON.stringify(stellarAccount.public_key))
      return NextResponse.json({ error: 'Cuenta Stellar corrupta, contacta soporte' }, { status: 500 })
    }

    const token = jwt.sign(
      {
        userId: user.id,
        accountType: user.account_type,
        stellarPublicKey: publicKey,
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    )

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        account_type: user.account_type,
        business_name: user.business_name,
        stellar_public_key: publicKey,
      },
    })
  } catch (err) {
    console.error('Login error:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
