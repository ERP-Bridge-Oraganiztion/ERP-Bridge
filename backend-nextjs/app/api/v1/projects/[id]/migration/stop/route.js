import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ApiError, withErrorHandling } from '@/lib/errors'
import { requireUser } from '@/lib/auth'
import { findProjectOrThrow } from '@/lib/projects'
import { toMigrationStatusResponse } from '@/lib/dto'

// Always execute fresh on every request — never statically cache or serve
// stale data for this dynamic, per-project API.
export const dynamic = 'force-dynamic'

// Since /start now runs the pipeline synchronously to completion (see that
// route's comment on the Vercel serverless adaptation), a job is essentially
// never still RUNNING by the time /stop could be called. This endpoint is
// kept for API compatibility with the frontend and will mark a job STOPPED
// if it somehow is still RUNNING (e.g. a previous invocation crashed mid-way).
export const POST = withErrorHandling(async (request, { params }) => {
  await requireUser(request)
  const project = await findProjectOrThrow(params.id)
  const { searchParams } = new URL(request.url)
  const jobId = searchParams.get('jobId')

  let job = jobId
    ? await prisma.migrationJob.findUnique({ where: { id: Number(jobId) } })
    : await prisma.migrationJob.findFirst({
        where: { projectId: project.id, jobType: 'MIGRATION' },
        orderBy: { id: 'desc' },
      })

  if (!job) throw ApiError.notFound('No active migration job for this project.')

  if (job.status === 'RUNNING') {
    job = await prisma.migrationJob.update({
      where: { id: job.id },
      data: { status: 'STOPPED', completedAt: new Date() },
    })
  }

  return NextResponse.json(toMigrationStatusResponse(job))
})
