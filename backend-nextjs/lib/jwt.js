import { SignJWT, jwtVerify } from 'jose'

const EXPIRATION_SECONDS = parseInt(process.env.JWT_EXPIRATION_SECONDS || '86400', 10)

function secretKey() {
  const secret = process.env.JWT_SECRET || 'change-this-super-secret-key-min-32-chars-long-for-hs256'
  return new TextEncoder().encode(secret)
}

export async function generateToken(email, role, userId, organizationId) {
  return await new SignJWT({ role, uid: userId, organizationId })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(email)
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + EXPIRATION_SECONDS)
    .sign(secretKey())
}

export async function verifyToken(token) {
  const { payload } = await jwtVerify(token, secretKey())
  return payload // { sub: email, role, uid, iat, exp }
}

export function getExpirationSeconds() {
  return EXPIRATION_SECONDS
}
