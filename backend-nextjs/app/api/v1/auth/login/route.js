import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { ApiError, withErrorHandling } from '@/lib/errors'
import { generateToken, getExpirationSeconds } from '@/lib/jwt'
import { toUserResponse } from '@/lib/dto'
import { logAudit } from '@/lib/audit'
import { resolveClientIp } from '@/lib/auth'

// Always execute fresh on every request — never statically cache or serve
// stale data for this dynamic, per-project API.
export const dynamic = 'force-dynamic'

export const POST = withErrorHandling(async (request) => {
  const body = await request.json().catch(() => ({}))
  const { identifier, organizationName, email, password } = body
  const loginIdentifier = (identifier || email || '').trim()

  if (!loginIdentifier || !password) {
    throw ApiError.badRequest('Email or username and password are required.')
  }

  const organization = organizationName ? await prisma.organization.findUnique({ where: { name: organizationName.trim() } }) : null
  const user = await prisma.user.findFirst({
    where: { OR: [{ email: loginIdentifier }, { username: loginIdentifier }], ...(organization ? { organizationId: organization.id } : {}) },
    include: { organization: true },
  })
  if (!user) {
    throw ApiError.unauthorized('Invalid email or password.')
  }

  const matches = await bcrypt.compare(password, user.passwordHash)
  if (!matches) {
    throw ApiError.unauthorized('Invalid email or password.')
  }

  const token = await generateToken(user.email, user.role, user.id, user.organizationId)
  await logAudit(user.id, 'LOGIN', 'AUTH', resolveClientIp(request))

  return NextResponse.json({
    token,
    tokenType: 'Bearer',
    expiresInSeconds: getExpirationSeconds(),
    user: toUserResponse(user),
  })
})
