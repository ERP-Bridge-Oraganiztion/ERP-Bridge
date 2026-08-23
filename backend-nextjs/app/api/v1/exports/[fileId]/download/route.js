import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ApiError, withErrorHandling } from '@/lib/errors'
import { requireUser } from '@/lib/auth'

// Always execute fresh on every request — never statically cache or serve
// stale data for this dynamic, per-project API.
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const MEDIA_TYPES = {
  XLSX: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  JSON: 'application/json',
  CSV: 'text/csv',
}

export const GET = withErrorHandling(async (request, { params }) => {
  await requireUser(request)
  const file = await prisma.exportedFile.findUnique({ where: { id: Number(params.fileId) } })
  if (!file) throw ApiError.notFound(`Exported file ${params.fileId} not found.`)
  if (file.expiresAt && file.expiresAt < new Date()) {
    throw ApiError.badRequest('Download URL for this export has expired (24h limit).')
  }

  const contentType = MEDIA_TYPES[file.fileType] || 'application/octet-stream'
  const body = file.fileType === 'XLSX' ? Buffer.from(file.fileData, 'base64') : file.fileData

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${file.fileName}"`,
    },
  })
})
