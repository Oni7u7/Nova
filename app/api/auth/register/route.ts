export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { Keypair } from '@stellar/stellar-sdk'
import { supabaseAdmin } from '@/lib/supabase/client'
import { encryptSecret } from '@/lib/crypto/encryption'
import { fundTestnetAccount } from '@/lib/stellar/friendbot'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password, full_name, account_type, business_name } = body

    if (!email || !password || !full_name || !account_type) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
    }

    if (!['personal', 'business'].includes(account_type)) {
      return NextResponse.json({ error: 'Tipo de cuenta inválido' }, { status: 400 })
    }

    if (account_type === 'business' && !business_name) {
      return NextResponse.json({ error: 'El nombre del negocio es obligatorio' }, { status: 400 })
    }

    // Verificar que el email no exista ya
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single()

    if (existingUser) {
      return NextResponse.json({ error: 'Este correo ya está registrado' }, { status: 409 })
    }

    // Hashear contraseña
    const password_hash = await bcrypt.hash(password, 12)

    // Crear usuario
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        email: email.toLowerCase(),
        password_hash,
        full_name,
        account_type,
        business_name: account_type === 'business' ? business_name : null,
      })
      .select('id, email, full_name, account_type, business_name')
      .single()

    if (userError || !user) {
      console.error('Error creando usuario:', userError)
      return NextResponse.json({ error: 'Error al crear la cuenta' }, { status: 500 })
    }

    // Crear wallet Stellar
    const keypair = Keypair.random()
    const { encrypted, iv, authTag } = encryptSecret(keypair.secret())

    const { error: stellarError } = await supabaseAdmin
      .from('stellar_accounts')
      .insert({
        user_id: user.id,
        public_key: keypair.publicKey(),
        encrypted_secret: encrypted,
        iv,
        auth_tag: authTag,
        network: process.env.STELLAR_NETWORK as 'testnet' | 'mainnet',
        funded: false,
      })

    if (stellarError) {
      console.error('Error creando cuenta Stellar:', stellarError)
      // Revertir usuario creado
      await supabaseAdmin.from('users').delete().eq('id', user.id)
      return NextResponse.json({ error: 'Error al crear la cuenta' }, { status: 500 })
    }

    // Fondear en testnet (no bloqueante para el response)
    if (process.env.STELLAR_NETWORK === 'testnet') {
      fundTestnetAccount(keypair.publicKey())
        .then(() =>
          supabaseAdmin
            .from('stellar_accounts')
            .update({ funded: true })
            .eq('user_id', user.id)
        )
        .catch((err) => console.error('Friendbot error:', err))
    }

    // Emitir JWT
    const token = jwt.sign(
      {
        userId: user.id,
        accountType: user.account_type,
        stellarPublicKey: keypair.publicKey(),
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
        stellar_public_key: keypair.publicKey(),
      },
    })
  } catch (err) {
    console.error('Register error:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
