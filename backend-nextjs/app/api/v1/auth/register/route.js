import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { ApiError, withErrorHandling } from '@/lib/errors'
import { toUserResponse } from '@/lib/dto'
import { logAudit } from '@/lib/audit'
import { resolveClientIp } from '@/lib/auth'

// Always execute fresh on every request — never statically cache or serve
// stale data for this dynamic, per-project API.
export const dynamic = 'force-dynamic'

const VALID_ROLES = new Set(['ADMIN', 'PROJECT_MANAGER', 'CONSULTANT', 'VIEWER'])
const PASSWORD_RULE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>_\-+=]).{8,}$/
const EMAIL_RULE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const POST = withErrorHandling(async (request) => {
  const body = await request.json().catch(() => ({}))
  const { name, email, password, role } = body

  if (!name || !name.trim()) throw ApiError.badRequest('name is required.')
  if (!email || !EMAIL_RULE.test(email)) throw ApiError.badRequest('A valid email is required.')
  if (!password || !PASSWORD_RULE.test(password)) {
    throw ApiError.badRequest(
      'Password must be at least 8 characters and include upper, lower, digit and special character.'
    )
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    throw ApiError.conflict('A user with this email already exists.')
  }

  let resolvedRole = 'VIEWER'
  if (role) {
    const upper = role.toUpperCase()
    if (!VALID_ROLES.has(upper)) {
      throw ApiError.badRequest('Invalid role. Must be one of ADMIN, PROJECT_MANAGER, CONSULTANT, VIEWER.')
    }
    resolvedRole = upper
  }

  const passwordHash = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: { name, email, passwordHash, role: resolvedRole, status: 'ACTIVE' },
  })

  await logAudit(user.id, 'REGISTER', 'AUTH', resolveClientIp(request))

  return NextResponse.json(toUserResponse(user), { status: 201 })
})
