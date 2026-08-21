import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ApiError, withErrorHandling } from '@/lib/errors'
import { requireUser } from '@/lib/auth'
import { findProjectOrThrow } from '@/lib/projects'
import { parseCsv } from '@/lib/csv'

// Always execute fresh on every request — never statically cache or serve
// stale data for this dynamic, per-project API.
export const dynamic = 'force-dynamic'

const MAX_ROWS_PER_PUSH = 500

function truncate(value) {
  if (!value) return ''
  return value.length > 300 ? value.substring(0, 300) + '...' : value
}

export const POST = withErrorHandling(async (request, { params }) => {
  await requireUser(request)
  const project = await findProjectOrThrow(params.id)
  const body = await request.json().catch(() => ({}))
  const { jobId, endpointUrl, username, password } = body

  if (!jobId) throw ApiError.badRequest('jobId is required.')
  if (!endpointUrl || !endpointUrl.trim()) throw ApiError.badRequest('endpointUrl is required.')

  const job = await prisma.migrationJob.findUnique({ where: { id: Number(jobId) } })
  if (!job) throw ApiError.notFound(`Migration job ${jobId} not found.`)
  if (job.status !== 'COMPLETED') {
    throw ApiError.badRequest(`SAP push requires a completed migration job (current status: ${job.status}).`)
  }
  if (!job.udmData) {
    throw ApiError.badRequest(`No transformed UDM output found for job ${job.id}. Run migration first.`)
  }

  let authHeader = null
  if (username && username.trim()) {
    const raw = `${username}:${password || ''}`
    authHeader = `Basic ${Buffer.from(raw, 'utf8').toString('base64')}`
  }

  const { rows } = parseCsv(job.udmData)

  let sent = 0
  let failed = 0
  let lastError = null

  for (const row of rows) {
    if (sent + failed >= MAX_ROWS_PER_PUSH) break

    try {
      const headers = { 'Content-Type': 'application/json', Accept: 'application/json' }
      if (authHeader) headers.Authorization = authHeader

      const response = await fetch(endpointUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(row),
      })

      if (response.ok) {
        sent++
      } else {
        failed++
        lastError = `HTTP ${response.status}: ${truncate(await response.text())}`
      }
    } catch (rowError) {
      failed++
      lastError = rowError.message
    }
  }

  let status, message
  if (sent > 0 && failed === 0) {
    status = 'SUCCESS'
    message = `Pushed ${sent} record(s) to the SAP endpoint successfully.`
    await prisma.project.update({ where: { id: project.id }, data: { status: 'COMPLETED' } })
  } else if (sent > 0) {
    status = 'PARTIAL'
    message = `${sent} record(s) succeeded, ${failed} failed. Last error: ${lastError}`
  } else {
    status = 'FAILED'
    message = `No records were pushed. Last error: ${lastError}`
  }

  return NextResponse.json({ jobId: job.id, status, recordsSent: sent, recordsFailed: failed, message })
})
