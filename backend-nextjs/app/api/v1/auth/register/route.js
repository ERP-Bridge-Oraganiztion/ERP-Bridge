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
  const { name, organizationName, username, email, password } = body

  if (!name || !name.trim()) throw ApiError.badRequest('name is required.')
  const resolvedOrganizationName = (organizationName || name || '').trim()
  if (!resolvedOrganizationName) throw ApiError.badRequest('organizationName is required.')
  if (!username || !/^[a-zA-Z0-9._-]{3,30}$/.test(username.trim())) throw ApiError.badRequest('Username must be 3-30 characters and contain only letters, numbers, dots, underscores or hyphens.')
  if (!email || !EMAIL_RULE.test(email)) throw ApiError.badRequest('A valid email is required.')
  if (!password || !PASSWORD_RULE.test(password)) {
    throw ApiError.badRequest(
      'Password must be at least 8 characters and include upper, lower, digit and special character.'
    )
  }

  const existing = await prisma.user.findFirst({ where: { OR: [{ email: email.trim() }, { username: username.trim() }] } })
  if (existing) {
    throw ApiError.conflict('That email or username is already in use.')
  }

  const passwordHash = await bcrypt.hash(password, 10)
  const user = await prisma.$transaction(async (transaction) => {
    const organization = await transaction.organization.create({ data: { name: resolvedOrganizationName } })
    return transaction.user.create({
      data: { name: name.trim(), username: username.trim(), email: email.trim(), passwordHash, role: 'ADMIN', status: 'ACTIVE', organizationId: organization.id },
      include: { organization: true },
    })
  })

  await logAudit(user.id, 'REGISTER', 'AUTH', resolveClientIp(request))

  return NextResponse.json(toUserResponse(user), { status: 201 })
})
