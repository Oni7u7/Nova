import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

function getMasterKey(): Buffer {
  return Buffer.from(process.env.ENCRYPTION_MASTER_KEY!, 'hex')
}

export function encryptSecret(secret: string): {
  encrypted: string
  iv: string
  authTag: string
} {
  const iv = randomBytes(16)
  const cipher = createCipheriv('aes-256-gcm', getMasterKey(), iv)
  const encrypted = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()])
  return {
    encrypted: encrypted.toString('hex'),
    iv: iv.toString('hex'),
    authTag: cipher.getAuthTag().toString('hex'),
  }
}

export function decryptSecret(encrypted: string, iv: string, authTag: string): string {
  const decipher = createDecipheriv('aes-256-gcm', getMasterKey(), Buffer.from(iv, 'hex'))
  decipher.setAuthTag(Buffer.from(authTag, 'hex'))
  return Buffer.concat([
    decipher.update(Buffer.from(encrypted, 'hex')),
    decipher.final(),
  ]).toString('utf8')
}
