import { prisma } from './prisma'
import { verifyToken } from './jwt'
import { ApiError } from './errors'

/**
 * Reads the Authorization: Bearer <token> header, verifies it, and returns
 * the authenticated User row (or throws ApiError.unauthorized).
 */
export async function requireUser(request) {
  const header = request.headers.get('authorization') || request.headers.get('Authorization')
  if (!header || !header.startsWith('Bearer ')) {
    throw ApiError.unauthorized('Missing or invalid Authorization header.')
  }

  const token = header.substring('Bearer '.length).trim()

  let payload
  try {
    payload = await verifyToken(token)
  } catch {
    throw ApiError.unauthorized('Invalid or expired token.')
  }

  const user = await prisma.user.findUnique({ where: { email: payload.sub }, include: { organization: true } })
  if (!user || user.status !== 'ACTIVE') {
    throw ApiError.unauthorized('User not found or inactive.')
  }
  if (payload.organizationId && user.organizationId !== payload.organizationId) {
    throw ApiError.unauthorized('User organization no longer matches this session.')
  }
  return user
}

export function resolveClientIp(request) {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return 'UNKNOWN'
}
