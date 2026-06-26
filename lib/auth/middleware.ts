import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { supabaseAdmin } from '@/lib/supabase/client'
import { decryptSecret } from '@/lib/crypto/encryption'
import { Keypair } from '@stellar/stellar-sdk'

const JWT_SECRET = process.env.JWT_SECRET!

export interface JWTPayload {
  userId: string
  accountType: 'personal' | 'business'
  stellarPublicKey: string
}

export type AuthedHandler = (
  req: NextRequest,
  user: JWTPayload
) => Promise<NextResponse>

export function withAuth(handler: AuthedHandler) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const token = authHeader.slice(7)
    try {
      const payload = jwt.verify(token, JWT_SECRET) as JWTPayload
      return handler(req, payload)
    } catch {
      return NextResponse.json({ error: 'Token inválido o expirado' }, { status: 401 })
    }
  }
}

/**
 * Obtiene el Keypair de Stellar para un usuario dado su userId.
 * Desencripta la secret key en memoria, firma, y descarta.
 */
export async function getKeypairForUser(userId: string): Promise<Keypair> {
  const { data, error } = await supabaseAdmin
    .from('stellar_accounts')
    .select('encrypted_secret, iv, auth_tag')
    .eq('user_id', userId)
    .single()

  if (error || !data) {
    throw new Error('Cuenta Stellar no encontrada')
  }

  const secret = decryptSecret(data.encrypted_secret, data.iv, data.auth_tag)
  const keypair = Keypair.fromSecret(secret)
  return keypair
}
