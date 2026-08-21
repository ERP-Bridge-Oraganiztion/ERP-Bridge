import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ApiError, withErrorHandling } from '@/lib/errors'
import { requireUser } from '@/lib/auth'
import { findProjectOrThrow } from '@/lib/projects'
import { parseSourceFile } from '@/lib/sourceFile'
import { getMetadataResponse } from '../metadata/route'

// Always execute fresh on every request — never statically cache or serve
// stale data for this dynamic, per-project API.
export const dynamic = 'force-dynamic'

function isBlank(v) {
  return v == null || String(v).trim() === ''
}

function inferType(rows, header) {
  let allInt = true, allDecimal = true, allBoolean = true, any = false
  for (const row of rows) {
    const v = row[header]
    if (isBlank(v)) continue
    any = true
    if (allInt && !/^-?\d+$/.test(v)) allInt = false
    if (allDecimal && !/^-?\d+(\.\d+)?$/.test(v)) allDecimal = false
    if (allBoolean && v.toLowerCase() !== 'true' && v.toLowerCase() !== 'false') allBoolean = false
  }
  if (!any) return 'varchar(255)'
  if (allInt) return 'integer'
  if (allDecimal) return 'decimal'
  if (allBoolean) return 'boolean'
  return 'varchar(255)'
}

export const POST = withErrorHandling(async (request, { params }) => {
  await requireUser(request)
  const project = await findProjectOrThrow(params.id)

  const formData = await request.formData()
  const file = formData.get('file')
  const tableName = (formData.get('tableName') || 'res_partner').toString()

  if (!file || typeof file === 'string') {
    throw ApiError.badRequest('A "file" part (multipart/form-data) is required.')
  }
  if (file.size > 50 * 1024 * 1024) {
    throw ApiError.badRequest('Uploaded file exceeds the 50MB limit.')
  }

  const { headers, rows, connectorType, sourceData } = await parseSourceFile(file)
  const sampled = rows.slice(0, 200)

  if (headers.length === 0) {
    throw ApiError.unprocessable('Uploaded file has no header row / columns detected.')
  }

  await prisma.sourceMetadata.deleteMany({ where: { projectId: project.id } })

  for (const header of headers) {
    const nullable = sampled.some((r) => isBlank(r[header]))
    const primaryKey = header.toLowerCase() === 'id' || header.toLowerCase() === `${tableName.toLowerCase()}_id`
    const dataType = inferType(sampled, header)

    await prisma.sourceMetadata.create({
      data: {
        projectId: project.id,
        tableName,
        columnName: header,
        dataType,
        nullable,
        isPrimaryKey: primaryKey,
      },
    })
  }

  await prisma.connectorConfig.upsert({
    where: { projectId: project.id },
    update: { connectorType, sourceFileName: file.name, sourceData },
    create: {
      projectId: project.id,
      connectorType,
      encryptedPassword: '',
      sourceFileName: file.name,
      sourceData,
    },
  })

  return NextResponse.json(await getMetadataResponse(project.id))
})
