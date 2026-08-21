import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ApiError, withErrorHandling } from '@/lib/errors'
import { requireUser } from '@/lib/auth'
import { toProjectResponse } from '@/lib/dto'
import { logAudit } from '@/lib/audit'
import { resolveClientIp } from '@/lib/auth'
import { SOURCE_SYSTEMS } from '@/lib/sourceSystems'

// Always execute fresh on every request — never statically cache or serve
// stale data for this dynamic, per-project API.
export const dynamic = 'force-dynamic'

const FILE_SOURCE_ERPS = [
  'Excel (.xlsx / .xls)',
  'Access (.mdb / .accdb)',
  'CSV (.csv)',
  'Text (.txt)',
  'TSV (.tsv)',
  'XML (.xml)',
  'JSON (.json)',
]
const DATABASE_SOURCE_ERPS = [
  'Generic MySQL Database',
  'Generic PostgreSQL Database',
  'Microsoft SQL Server',
  'Oracle Database',
]
const VALID_SOURCE_ERPS = new Set([
  ...SOURCE_SYSTEMS.map((s) => s.name),
  ...FILE_SOURCE_ERPS,
  ...DATABASE_SOURCE_ERPS,
])
const PROJECT_STATUSES = new Set(['CREATED', 'ACTIVE', 'COMPLETED', 'ARCHIVED', 'FAILED'])

export const GET = withErrorHandling(async (request) => {
  await requireUser(request)
  const { searchParams } = new URL(request.url)
  const statusParam = searchParams.get('status')
  const size = parseInt(searchParams.get('size') || '10', 10)
  const page = parseInt(searchParams.get('page') || '0', 10)

  let status
  if (statusParam) {
    status = statusParam.toUpperCase()
    if (!PROJECT_STATUSES.has(status)) {
      throw ApiError.badRequest(`Invalid status: ${statusParam}`)
    }
  }

  const where = status ? { status } : {}
  const [total, items] = await Promise.all([
    prisma.project.count({ where }),
    prisma.project.findMany({
      where,
      orderBy: { id: 'asc' },
      skip: page * size,
      take: size,
    }),
  ])

  return NextResponse.json({
    content: items.map(toProjectResponse),
    number: page,
    size,
    totalElements: total,
    totalPages: Math.max(1, Math.ceil(total / size)),
  })
})

export const POST = withErrorHandling(async (request) => {
  const actor = await requireUser(request)
  const body = await request.json().catch(() => ({}))
  const { name, description, sourceErp, targetErp } = body

  if (!name || !name.trim() || name.length > 150) {
    throw ApiError.badRequest('name is required and must be at most 150 characters.')
  }
  if (!sourceErp) throw ApiError.badRequest('sourceErp is required.')
  if (!VALID_SOURCE_ERPS.has(sourceErp)) {
    throw ApiError.unprocessable(`Invalid sourceErp: ${sourceErp}`)
  }

  const project = await prisma.project.create({
    data: {
      name,
      description: description ?? null,
      sourceErp,
      targetErp: targetErp || 'SAP_S4HANA',
      status: 'CREATED',
      createdById: actor.id,
    },
  })

  await logAudit(actor.id, 'CREATE_PROJECT', 'PROJECT', resolveClientIp(request))

  return NextResponse.json(toProjectResponse(project), { status: 201 })
})
