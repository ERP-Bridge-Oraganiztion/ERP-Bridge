import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ApiError, withErrorHandling } from '@/lib/errors'
import { requireUser } from '@/lib/auth'
import { findProjectOrThrow } from '@/lib/projects'
import { toValidationErrorDto } from '@/lib/dto'

// Always execute fresh on every request — never statically cache or serve
// stale data for this dynamic, per-project API.
export const dynamic = 'force-dynamic'

const SEVERITIES = new Set(['WARNING', 'ERROR', 'CRITICAL'])

export const GET = withErrorHandling(async (request, { params }) => {
  await requireUser(request)
  const project = await findProjectOrThrow(params.id)
  const { searchParams } = new URL(request.url)
  const jobId = searchParams.get('jobId')
  const severityParam = searchParams.get('severity')
  const size = parseInt(searchParams.get('size') || '20', 10)
  const page = parseInt(searchParams.get('page') || '0', 10)

  let severity
  if (severityParam) {
    severity = severityParam.toUpperCase()
    if (!SEVERITIES.has(severity)) throw ApiError.badRequest(`Invalid severity: ${severityParam}`)
  }

  const job = jobId
    ? await prisma.migrationJob.findUnique({ where: { id: Number(jobId) } })
    : await prisma.migrationJob.findFirst({
        where: { projectId: project.id, jobType: 'VALIDATION' },
        orderBy: { id: 'desc' },
      })

  if (!job) {
    throw ApiError.notFound(jobId ? `Validation job ${jobId} not found.` : 'No validation job has been run for this project yet.')
  }

  const where = severity ? { jobId: job.id, severity } : { jobId: job.id }
  const [total, items] = await Promise.all([
    prisma.validationError.count({ where }),
    prisma.validationError.findMany({ where, orderBy: { id: 'asc' }, skip: page * size, take: size }),
  ])

  return NextResponse.json({
    projectId: project.id,
    jobId: job.id,
    errors: items.map(toValidationErrorDto),
    pageInfo: {
      page,
      size,
      totalElements: total,
      totalPages: Math.max(1, Math.ceil(total / size)),
    },
  })
})
