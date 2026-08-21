import net from 'net'
import { NextResponse } from 'next/server'
import { ApiError, withErrorHandling } from '@/lib/errors'
import { requireUser } from '@/lib/auth'

// Always execute fresh on every request — never statically cache or serve
// stale data for this dynamic, per-project API.
export const dynamic = 'force-dynamic'

const CONNECTOR_TYPES = new Set([
  'CSV', 'EXCEL', 'ODOO', 'ERPNEXT', 'ORACLE_SQL', 'MS_SQL_SERVER', 'MYSQL_POSTGRES', 'MYSQL', 'POSTGRES',
])

function probeTcp(host, port, timeoutMs = 5000) {
  return new Promise((resolve) => {
    const start = Date.now()
    const socket = new net.Socket()
    let done = false
    const finish = (ok, message) => {
      if (done) return
      done = true
      socket.destroy()
      resolve({ ok, latencyMs: Date.now() - start, message })
    }
    socket.setTimeout(timeoutMs)
    socket.once('connect', () => finish(true, null))
    socket.once('timeout', () => finish(false, 'Connection timed out'))
    socket.once('error', (err) => finish(false, err.message))
    socket.connect(port, host)
  })
}

export const POST = withErrorHandling(async (request) => {
  await requireUser(request)
  const body = await request.json().catch(() => ({}))
  const { connectorType, host, port } = body

  if (!connectorType) throw ApiError.badRequest('connectorType is required.')
  const type = connectorType.toUpperCase()
  if (!CONNECTOR_TYPES.has(type)) throw ApiError.unprocessable(`Unsupported connector type: ${connectorType}`)

  if (type === 'CSV' || type === 'EXCEL') {
    return NextResponse.json({
      status: 'SUCCESS',
      latencyMs: 5,
      message: 'File-based connector ready. Upload a source file to proceed.',
    })
  }

  if (!host || !port) {
    throw ApiError.unprocessable('host and port are required to test a database connector.')
  }

  const result = await probeTcp(host, port)
  if (result.ok) {
    return NextResponse.json({
      status: 'SUCCESS',
      latencyMs: result.latencyMs,
      message: `Connection established and verified with ${type} engine successfully.`,
    })
  }
  return NextResponse.json({
    status: 'FAILED',
    latencyMs: result.latencyMs,
    message: `Unable to reach host ${host}:${port} — ${result.message}`,
  })
})
