import crypto from 'crypto'

const ALGO = 'aes-256-gcm'
const IV_LENGTH = 12

function deriveKey() {
  const raw = process.env.CONNECTOR_ENCRYPTION_KEY || 'change-this-aes-encryption-master-key'
  return crypto.createHash('sha256').update(raw, 'utf8').digest()
}

export function encrypt(plainText) {
  if (plainText == null) return null
  const key = deriveKey()
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGO, key, iv)
  const encrypted = Buffer.concat([cipher.update(String(plainText), 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  // layout: iv || ciphertext || authTag  (matches Java's iv||cipherText+tag combined buffer)
  return Buffer.concat([iv, encrypted, authTag]).toString('base64')
}

export function decrypt(encoded) {
  if (encoded == null) return null
  const key = deriveKey()
  const combined = Buffer.from(encoded, 'base64')
  const iv = combined.subarray(0, IV_LENGTH)
  const authTag = combined.subarray(combined.length - 16)
  const cipherText = combined.subarray(IV_LENGTH, combined.length - 16)
  const decipher = crypto.createDecipheriv(ALGO, key, iv)
  decipher.setAuthTag(authTag)
  const decrypted = Buffer.concat([decipher.update(cipherText), decipher.final()])
  return decrypted.toString('utf8')
}
