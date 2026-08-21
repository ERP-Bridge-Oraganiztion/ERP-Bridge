import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ApiError, withErrorHandling } from '@/lib/errors'
import { requireUser } from '@/lib/auth'
import { findProjectOrThrow } from '@/lib/projects'
import { parseCsv } from '@/lib/csv'

// Always execute fresh on every request — never statically cache or serve
// stale data for this dynamic, per-project API.
export const dynamic = 'force-dynamic'

const EMAIL_RFC5322 = /^[a-zA-Z0-9_+&*-]+(?:\.[a-zA-Z0-9_+&*-]+)*@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,7}$/
const ISO_CURRENCIES = new Set(['USD', 'EUR', 'GBP', 'PKR', 'INR', 'AED', 'SAR', 'JPY', 'CNY', 'AUD', 'CAD', 'CHF', 'SGD'])

function isNumeric(v) {
  return /^-?\d+(\.\d+)?$/.test(v)
}
function isLikelyDate(v) {
  return /^\d{4}-\d{2}-\d{2}([T ].*)?$/.test(v)
}

export const POST = withErrorHandling(async (request, { params }) => {
  await requireUser(request)
  const project = await findProjectOrThrow(params.id)

  const config = await prisma.connectorConfig.findUnique({ where: { projectId: project.id } })
  if (!config) throw ApiError.badRequest('No connector/source file configured for this project yet.')
  if (!config.sourceData) {
    throw ApiError.badRequest('No source data file uploaded for this project. Discover schema / upload a file first.')
  }

  const metadata = await prisma.sourceMetadata.findMany({ where: { projectId: project.id } })
  if (metadata.length === 0) throw ApiError.badRequest('Schema metadata has not been discovered for this project yet.')
  const tableName = metadata[0].tableName

  const rules = await prisma.mappingRule.findMany({ where: { projectId: project.id } })
  const requiredFields = new Map()
  for (const r of rules) {
    requiredFields.set(r.sourceField, requiredFields.get(r.sourceField) || r.required)
  }

  const primaryKeyFields = new Set(metadata.filter((m) => m.isPrimaryKey).map((m) => m.columnName))
  const columnTypes = new Map(metadata.map((m) => [m.columnName, m.dataType]))

  const job = await prisma.migrationJob.create({
    data: { projectId: project.id, status: 'RUNNING', jobType: 'VALIDATION', startedAt: new Date() },
  })

  const startTime = Date.now()
  const { headers, rows } = parseCsv(config.sourceData)

  let total = 0
  let errorCount = 0
  let warningCount = 0
  const seenPks = new Set()
  const errorsToSave = []

  const saveError = (recordId, field, severity, errorType, description) => {
    errorsToSave.push({ jobId: job.id, tableName, recordId, fieldName: field, severity, errorType, description })
  }

  for (const record of rows) {
    total++
    let recordId = null
    for (const pk of primaryKeyFields) {
      if (headers.includes(pk) && record[pk] != null) {
        recordId = record[pk]
        break
      }
    }
    if (recordId == null) recordId = String(total)

    for (const header of headers) {
      const value = record[header]
      const isRequired = !!requiredFields.get(header)
      const blank = value == null || String(value).trim() === ''

      if (isRequired && blank) {
        errorCount++
        saveError(recordId, header, 'ERROR', 'MISSING_FIELD', `Required field '${header}' is empty or missing.`)
        continue
      }
      if (blank) continue

      if (header.toLowerCase().includes('email') && !EMAIL_RFC5322.test(value)) {
        errorCount++
        saveError(recordId, header, 'ERROR', 'INVALID_FORMAT', `Email value '${value}' fails standard RFC 5322 regex validation.`)
      }

      const type = columnTypes.get(header) || 'varchar(255)'
      if ((type === 'integer' || type === 'decimal') && !isNumeric(value)) {
        errorCount++
        saveError(recordId, header, 'ERROR', 'TYPE_MISMATCH', `Value '${value}' is not a valid ${type}.`)
      }

      if (header.toLowerCase().includes('currency') && !ISO_CURRENCIES.has(String(value).toUpperCase())) {
        warningCount++
        saveError(recordId, header, 'WARNING', 'INVALID_CURRENCY', `Currency code '${value}' is not a recognized ISO 4217 code.`)
      }

      if (header.toLowerCase().includes('date') && !isLikelyDate(value)) {
        warningCount++
        saveError(recordId, header, 'WARNING', 'INVALID_DATE', `Value '${value}' does not look like a valid date (expected yyyy-MM-dd).`)
      }
    }

    if (recordId != null && primaryKeyFields.size > 0) {
      if (seenPks.has(recordId)) {
        errorCount++
        saveError(
          recordId,
          Array.from(primaryKeyFields).join(','),
          'CRITICAL',
          'DUPLICATE_KEY',
          `Duplicate primary key value '${recordId}' detected in source dataset.`
        )
      } else {
        seenPks.add(recordId)
      }
    }
  }

  if (errorsToSave.length) {
    // Batch insert in chunks to stay well under typical statement size limits.
    const CHUNK = 500
    for (let i = 0; i < errorsToSave.length; i += CHUNK) {
      await prisma.validationError.createMany({ data: errorsToSave.slice(i, i + CHUNK) })
    }
  }

  const elapsed = Date.now() - startTime
  const validRecords = Math.max(0, total - errorCount)

  await prisma.migrationJob.update({
    where: { id: job.id },
    data: {
      status: 'COMPLETED',
      completedAt: new Date(),
      totalRecords: total,
      successRecords: validRecords,
      failedRecords: Math.min(total, errorCount),
      executionTimeMs: elapsed,
    },
  })

  return NextResponse.json({
    projectId: project.id,
    jobId: job.id,
    status: 'COMPLETED',
    validationMetrics: {
      totalCheckedRecords: total,
      validRecords,
      errorCount,
      warningCount,
    },
  })
})
