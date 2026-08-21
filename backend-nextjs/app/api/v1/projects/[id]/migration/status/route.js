import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ApiError, withErrorHandling } from '@/lib/errors'
import { requireUser } from '@/lib/auth'
import { findProjectOrThrow } from '@/lib/projects'
import { toMigrationStatusResponse } from '@/lib/dto'

// Always execute fresh on every request — never statically cache or serve
// stale data for this dynamic, per-project API.
export const dynamic = 'force-dynamic'

export const GET = withErrorHandling(async (request, { params }) => {
  await requireUser(request)
  const project = await findProjectOrThrow(params.id)
  const { searchParams } = new URL(request.url)
  const jobId = searchParams.get('jobId')

  const job = jobId
    ? await prisma.migrationJob.findUnique({ where: { id: Number(jobId) } })
    : await prisma.migrationJob.findFirst({
        where: { projectId: project.id, jobType: 'MIGRATION' },
        orderBy: { id: 'desc' },
      })

  if (!job) {
    throw ApiError.notFound(
      jobId ? 'Migration job not found.' : 'No migration job has been started for this project.'
    )
  }

  return NextResponse.json(toMigrationStatusResponse(job))
})
