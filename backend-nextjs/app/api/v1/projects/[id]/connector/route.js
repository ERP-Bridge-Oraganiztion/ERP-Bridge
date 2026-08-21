import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ApiError, withErrorHandling } from '@/lib/errors'
import { requireUser } from '@/lib/auth'
import { encrypt } from '@/lib/crypto'
import { findProjectOrThrow } from '@/lib/projects'

// Always execute fresh on every request — never statically cache or serve
// stale data for this dynamic, per-project API.
export const dynamic = 'force-dynamic'

const CONNECTOR_TYPES = new Set([
  'CSV', 'EXCEL', 'ODOO', 'ERPNEXT', 'ORACLE_SQL', 'MS_SQL_SERVER', 'MYSQL_POSTGRES', 'MYSQL', 'POSTGRES',
])

export const GET = withErrorHandling(async (request, { params }) => {
  await requireUser(request)
  const config = await prisma.connectorConfig.findUnique({ where: { projectId: Number(params.id) } })

  if (!config) {
    return NextResponse.json({
      configured: false,
      connectorType: null,
      hasSourceFile: false,
      sourceFileName: null,
      host: null,
      port: null,
      databaseName: null,
      username: null,
    })
  }

  return NextResponse.json({
    configured: true,
    connectorType: config.connectorType,
    hasSourceFile: !!config.sourceData,
    sourceFileName: config.sourceFileName,
    host: config.host,
    port: config.port,
    databaseName: config.databaseName,
    username: config.username,
  })
})

export const POST = withErrorHandling(async (request, { params }) => {
  await requireUser(request)
  const project = await findProjectOrThrow(params.id)
  const body = await request.json().catch(() => ({}))
  const { connectorType, host, port, databaseName, username, password } = body

  if (!connectorType) throw ApiError.badRequest('connectorType is required.')
  const type = connectorType.toUpperCase()
  if (!CONNECTOR_TYPES.has(type)) throw ApiError.unprocessable(`Unsupported connector type: ${connectorType}`)

  const encryptedPassword = encrypt(password || '')

  await prisma.connectorConfig.upsert({
    where: { projectId: project.id },
    update: { connectorType: type, host, port, databaseName, username, encryptedPassword },
    create: {
      projectId: project.id,
      connectorType: type,
      host,
      port,
      databaseName,
      username,
      encryptedPassword,
    },
  })

  return NextResponse.json({ status: 'SUCCESS', message: 'Connector configuration saved.' })
})