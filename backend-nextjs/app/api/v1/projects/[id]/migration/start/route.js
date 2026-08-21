import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ApiError, withErrorHandling } from '@/lib/errors'
import { requireUser } from '@/lib/auth'
import { findProjectOrThrow } from '@/lib/projects'
import { parseCsv, stringifyCsv } from '@/lib/csv'
import { applyTransform } from '@/lib/transform'

// Always execute fresh on every request — never statically cache or serve
// stale data for this dynamic, per-project API.
export const dynamic = 'force-dynamic'

/**
 * NOTE on the Vercel serverless adaptation:
 * The original Spring Boot service ran this pipeline on a background thread
 * pool (@Async) so /start returned immediately (202) and the client polled
 * /status. Vercel functions have no background worker threads, so this runs
 * the whole transform synchronously inside the request and marks the job
 * COMPLETED before responding. For very large source files this can run
 * into the function's execution time limit — raise `maxDuration` in
 * vercel.json (see the project README) or move very large migrations to a
 * queue-based worker (Vercel Cron/QStash) if you hit that limit.
 */
export const POST = withErrorHandling(async (request, { params }) => {
  const actor = await requireUser(request)
  const project = await findProjectOrThrow(params.id)

  const config = await prisma.connectorConfig.findUnique({ where: { projectId: project.id } })
  if (!config) throw ApiError.badRequest('No source connector configured for this project.')
  if (!config.sourceData) throw ApiError.badRequest('No source data has been ingested for this project yet.')

  const rules = await prisma.mappingRule.findMany({ where: { projectId: project.id } })
  if (rules.length === 0) throw ApiError.badRequest('Cannot start migration: no field mapping rules are configured.')

  const startedAt = new Date()
  let job = await prisma.migrationJob.create({
    data: {
      projectId: project.id,
      status: 'RUNNING',
      jobType: 'MIGRATION',
      startedAt,
      triggeredById: actor.id,
    },
  })

  await prisma.project.update({ where: { id: project.id }, data: { status: 'ACTIVE' } })

  const startTime = Date.now()
  const { rows } = parseCsv(config.sourceData)
  const targetHeaders = rules.map((r) => `${r.targetTable}.${r.targetField}`)

  let total = 0, success = 0, failed = 0
  const outRows = []
  const logs = []

  for (const record of rows) {
    total++
    try {
      const outRow = {}
      for (const rule of rules) {
        const raw = record[rule.sourceField]
        if (rule.required && (raw == null || String(raw).trim() === '')) {
          throw new Error(`Missing required field: ${rule.sourceField}`)
        }
        const transformed = applyTransform(raw, rule.customTransformationLogic)
        outRow[`${rule.targetTable}.${rule.targetField}`] = transformed == null ? '' : transformed
      }
      outRows.push(outRow)
      success++
    } catch (rowError) {
      failed++
      logs.push({ recordType: 'RECORD', status: 'FAILED', message: `Row ${total} failed transformation: ${rowError.message}` })
    }
  }

  const elapsed = Date.now() - startTime
  const udmCsv = stringifyCsv(targetHeaders, outRows)

  logs.push({
    recordType: 'PIPELINE',
    status: 'COMPLETED',
    message: `Migration completed: ${success} succeeded, ${failed} failed out of ${total} records.`,
  })

  job = await prisma.migrationJob.update({
    where: { id: job.id },
    data: {
      status: 'COMPLETED',
      totalRecords: total,
      successRecords: success,
      failedRecords: failed,
      executionTimeMs: elapsed,
      completedAt: new Date(),
      udmData: udmCsv,
    },
  })

  if (logs.length) {
    await prisma.migrationLog.createMany({
      data: logs.map((l) => ({ jobId: job.id, recordType: l.recordType, status: l.status, message: l.message })),
    })
  }

  return NextResponse.json(
    {
      jobId: job.id,
      status: job.status,
      message: 'Migration pipeline completed synchronously.',
      startedAt,
    },
    { status: 202 }
  )
})
