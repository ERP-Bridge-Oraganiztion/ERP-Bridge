import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ApiError, withErrorHandling } from '@/lib/errors'
import { requireUser, resolveClientIp } from '@/lib/auth'
import { toProjectResponse } from '@/lib/dto'
import { logAudit } from '@/lib/audit'
import { findProjectOrThrow } from '@/lib/projects'

// Always execute fresh on every request — never statically cache or serve
// stale data for this dynamic, per-project API.
export const dynamic = 'force-dynamic'

const PROJECT_STATUSES = new Set(['CREATED', 'ACTIVE', 'COMPLETED', 'ARCHIVED', 'FAILED'])

export const GET = withErrorHandling(async (request, { params }) => {
  await requireUser(request)
  const project = await findProjectOrThrow(params.id)
  return NextResponse.json(toProjectResponse(project))
})

export const PUT = withErrorHandling(async (request, { params }) => {
  const actor = await requireUser(request)
  const project = await findProjectOrThrow(params.id)
  const body = await request.json().catch(() => ({}))

  const data = {}
  if (body.name && body.name.trim()) data.name = body.name
  if (body.description !== undefined) data.description = body.description
  if (body.targetErp) data.targetErp = body.targetErp
  if (body.status) {
    const upper = body.status.toUpperCase()
    if (!PROJECT_STATUSES.has(upper)) throw ApiError.unprocessable(`Invalid project status: ${body.status}`)
    data.status = upper
  }

  const updated = await prisma.project.update({ where: { id: project.id }, data })
  await logAudit(actor.id, 'UPDATE_PROJECT', 'PROJECT', resolveClientIp(request))
  return NextResponse.json(toProjectResponse(updated))
})

export const DELETE = withErrorHandling(async (request, { params }) => {
  const actor = await requireUser(request)
  const project = await findProjectOrThrow(params.id)
  await prisma.project.delete({ where: { id: project.id } })
  await logAudit(actor.id, 'DELETE_PROJECT', 'PROJECT', resolveClientIp(request))
  return new NextResponse(null, { status: 204 })
})
