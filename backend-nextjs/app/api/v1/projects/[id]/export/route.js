import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { prisma } from '@/lib/prisma'
import { ApiError, withErrorHandling } from '@/lib/errors'
import { requireUser } from '@/lib/auth'
import { findProjectOrThrow } from '@/lib/projects'
import { parseCsv } from '@/lib/csv'

// Always execute fresh on every request — never statically cache or serve
// stale data for this dynamic, per-project API.
export const dynamic = 'force-dynamic'

function escapeJson(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

function csvToJson(csvText) {
  const { headers, rows } = parseCsv(csvText)
  const lines = rows.map((row) => {
    const parts = headers.map((h) => `"${escapeJson(h)}": "${escapeJson(row[h] ?? '')}"`)
    return `  {${parts.join(', ')}}`
  })
  return `[\n${lines.join(',\n')}\n]`
}

function csvToXlsxBase64(csvText) {
  const { headers, rows } = parseCsv(csvText)
  const worksheetData = [headers, ...rows.map((r) => headers.map((h) => r[h] ?? ''))]
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'SAP_Export')
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
  return buffer.toString('base64')
}

export const POST = withErrorHandling(async (request, { params }) => {
  await requireUser(request)
  const project = await findProjectOrThrow(params.id)
  const body = await request.json().catch(() => ({}))
  const { jobId, format } = body

  if (!jobId) throw ApiError.badRequest('jobId is required.')

  const job = await prisma.migrationJob.findUnique({ where: { id: Number(jobId) } })
  if (!job) throw ApiError.notFound(`Migration job ${jobId} not found.`)
  if (job.status !== 'COMPLETED') {
    throw ApiError.badRequest(`Export can only be initiated for jobs that have completed successfully (current status: ${job.status}).`)
  }
  if (!job.udmData) {
    throw ApiError.badRequest(`No transformed UDM output found for job ${job.id}. Run migration first.`)
  }

  const fmt = (format || 'CSV').toUpperCase()
  let fileName, fileData, sizeBytes

  if (fmt === 'CSV') {
    fileName = `sap_bp_export_job_${job.id}.csv`
    fileData = job.udmData
    sizeBytes = Buffer.byteLength(fileData, 'utf8')
  } else if (fmt === 'XLSX') {
    fileName = `sap_bp_export_job_${job.id}.xlsx`
    fileData = csvToXlsxBase64(job.udmData)
    sizeBytes = Buffer.byteLength(fileData, 'base64')
  } else if (fmt === 'JSON') {
    fileName = `sap_bp_export_job_${job.id}.json`
    fileData = csvToJson(job.udmData)
    sizeBytes = Buffer.byteLength(fileData, 'utf8')
  } else {
    throw ApiError.unprocessable(`Unsupported export format: ${format}`)
  }

  const exported = await prisma.exportedFile.upsert({
    where: { jobId: job.id },
    update: {
      fileName,
      fileType: fmt,
      fileSizeBytes: sizeBytes,
      fileData,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
    create: {
      jobId: job.id,
      fileName,
      fileType: fmt,
      fileSizeBytes: sizeBytes,
      fileData,
      downloadUrl: '',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  })

  const downloadUrl = `/api/v1/exports/${exported.id}/download`
  await prisma.exportedFile.update({ where: { id: exported.id }, data: { downloadUrl } })
  await prisma.project.update({ where: { id: project.id }, data: { status: 'COMPLETED' } })

  return NextResponse.json({
    fileId: exported.id,
    jobId: job.id,
    fileName,
    fileType: fmt,
    fileSizeBytes: sizeBytes,
    downloadUrl,
  })
})
