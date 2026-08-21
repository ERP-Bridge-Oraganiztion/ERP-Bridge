import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { ApiError, withErrorHandling } from '@/lib/errors'
import { requireUser } from '@/lib/auth'
import { toUserResponse } from '@/lib/dto'

export const dynamic = 'force-dynamic'
const PASSWORD_RULE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>_\-+=]).{8,}$/
const ROLES = new Set(['PROJECT_MANAGER', 'CONSULTANT', 'VIEWER'])

export const GET = withErrorHandling(async (request) => {
  const admin = await requireUser(request)
  if (admin.role !== 'ADMIN') throw ApiError.forbidden('Only organization administrators can manage members.')
  const users = await prisma.user.findMany({ where: { organizationId: admin.organizationId }, orderBy: { createdAt: 'asc' }, include: { organization: true } })
  return NextResponse.json(users.map(toUserResponse))
})

export const POST = withErrorHandling(async (request) => {
  const admin = await requireUser(request)
  if (admin.role !== 'ADMIN') throw ApiError.forbidden('Only organization administrators can create members.')
  if (!admin.organizationId) throw ApiError.badRequest('Admin is not assigned to an organization.')
  const body = await request.json().catch(() => ({}))
  const { name, email, password, role = 'VIEWER' } = body
  if (!name?.trim() || !email?.trim() || !password) throw ApiError.badRequest('name, email and password are required.')
  if (!PASSWORD_RULE.test(password)) throw ApiError.badRequest('Password must include upper, lower, digit, special character and be at least 8 characters.')
  if (!ROLES.has(role)) throw ApiError.badRequest('Members can be PROJECT_MANAGER, CONSULTANT, or VIEWER.')
  const existing = await prisma.user.findFirst({ where: { organizationId: admin.organizationId, email: email.trim() } })
  if (existing) throw ApiError.conflict('A member with this email already exists in your organization.')
  const user = await prisma.user.create({ data: { name: name.trim(), email: email.trim(), passwordHash: await bcrypt.hash(password, 10), role, status: 'ACTIVE', organizationId: admin.organizationId }, include: { organization: true } })
  return NextResponse.json(toUserResponse(user), { status: 201 })
})

export const PATCH = withErrorHandling(async (request) => {
  const admin = await requireUser(request)
  if (admin.role !== 'ADMIN') throw ApiError.forbidden('Only organization administrators can reset member passwords.')
  const body = await request.json().catch(() => ({}))
  const { userId, password } = body
  if (!userId || !password) throw ApiError.badRequest('userId and password are required.')
  if (!PASSWORD_RULE.test(password)) throw ApiError.badRequest('Password must include upper, lower, digit, special character and be at least 8 characters.')

  const member = await prisma.user.findFirst({ where: { id: Number(userId), organizationId: admin.organizationId } })
  if (!member) throw ApiError.notFound('Member not found in your organization.')
  await prisma.user.update({ where: { id: member.id }, data: { passwordHash: await bcrypt.hash(password, 10) } })
  return NextResponse.json({ message: 'Member password reset successfully.' })
})

export const DELETE = withErrorHandling(async (request) => {
  const admin = await requireUser(request)
  if (admin.role !== 'ADMIN') throw ApiError.forbidden('Only organization administrators can delete members.')
  const { searchParams } = new URL(request.url)
  const userId = Number(searchParams.get('userId'))
  if (!userId) throw ApiError.badRequest('userId is required.')
  if (userId === admin.id) throw ApiError.badRequest('You cannot delete your own administrator account.')

  const member = await prisma.user.findFirst({ where: { id: userId, organizationId: admin.organizationId } })
  if (!member) throw ApiError.notFound('Member not found in your organization.')
  if (member.role === 'ADMIN') throw ApiError.forbidden('Administrator accounts cannot be deleted here.')
  await prisma.user.delete({ where: { id: member.id } })
  return new NextResponse(null, { status: 204 })
})