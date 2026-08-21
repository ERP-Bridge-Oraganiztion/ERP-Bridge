import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ApiError, withErrorHandling } from '@/lib/errors'
import { requireUser } from '@/lib/auth'
import { findProjectOrThrow } from '@/lib/projects'
import { getMetadataResponse } from '../../metadata/route'
import { decrypt } from '@/lib/crypto'
import { stringifyCsv } from '@/lib/csv'

// Always execute fresh on every request — never statically cache or serve
// stale data for this dynamic, per-project API.
export const dynamic = 'force-dynamic'

const IDENTIFIER_RE = /^[a-zA-Z0-9_]+$/

async function ingestMysql(config, tableName) {
  const mysql = await import('mysql2/promise')
  const connection = await mysql.createConnection({
    host: config.host,
    port: config.port || 3306,
    user: config.username,
    password: decrypt(config.encryptedPassword) || '',
    database: config.databaseName,
    connectTimeout: 10000,
  })

  try {
    const [rows, fields] = await connection.execute(`SELECT * FROM \`${tableName}\` LIMIT 100000`)
    const [pkRows] = await connection.execute(
      `SELECT COLUMN_NAME FROM information_schema.KEY_COLUMN_USAGE
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND CONSTRAINT_NAME = 'PRIMARY'`,
      [config.databaseName, tableName]
    )
    const primaryKeys = new Set(pkRows.map((r) => r.COLUMN_NAME))

    const columns = fields.map((f) => ({
      name: f.name,
      dataType: mapMysqlColumnType(f),
      nullable: !(f.flags & 1), // NOT_NULL flag bit
      primaryKey: primaryKeys.has(f.name),
    }))

    return { columns, rows }
  } finally {
    await connection.end()
  }
}

function mapMysqlColumnType(field) {
  // mysql2 exposes the MySQL protocol type code on `field.type` (a number).
  // See mysql2/lib/constants/types.js for the full list.
  const t = field.type
  const INT_TYPES = new Set([1, 2, 3, 8, 9]) // TINY, SHORT, LONG, LONGLONG, INT24
  const DECIMAL_TYPES = new Set([0, 4, 5, 246]) // DECIMAL, FLOAT, DOUBLE, NEWDECIMAL
  const DATE_TYPES = new Set([7, 10, 12, 14]) // TIMESTAMP, DATE, DATETIME, NEWDATE

  if (INT_TYPES.has(t)) return 'integer'
  if (DECIMAL_TYPES.has(t)) return 'decimal'
  if (DATE_TYPES.has(t)) return 'date'
  return 'varchar(255)'
}

async function ingestPostgres(config, tableName) {
  const { Client } = await import('pg')
  const client = new Client({
    host: config.host,
    port: config.port || 5432,
    user: config.username,
    password: decrypt(config.encryptedPassword) || '',
    database: config.databaseName,
    connectionTimeoutMillis: 10000,
  })
  await client.connect()
  try {
    const pkResult = await client.query(
      `SELECT a.attname AS column_name
       FROM pg_index i
       JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
       WHERE i.indrelid = $1::regclass AND i.indisprimary`,
      [tableName]
    )
    const primaryKeys = new Set(pkResult.rows.map((r) => r.column_name))

    const result = await client.query(`SELECT * FROM ${tableName} LIMIT 100000`)
    const columns = result.fields.map((f) => ({
      name: f.name,
      dataType: mapPgOid(f.dataTypeID),
      nullable: true,
      primaryKey: primaryKeys.has(f.name),
    }))
    return { columns, rows: result.rows }
  } finally {
    await client.end()
  }
}

function mapPgOid(oid) {
  const INT_OIDS = new Set([20, 21, 23])
  const DECIMAL_OIDS = new Set([700, 701, 1700])
  const BOOL_OIDS = new Set([16])
  const DATE_OIDS = new Set([1082, 1114, 1184, 1083])
  if (INT_OIDS.has(oid)) return 'integer'
  if (DECIMAL_OIDS.has(oid)) return 'decimal'
  if (BOOL_OIDS.has(oid)) return 'boolean'
  if (DATE_OIDS.has(oid)) return 'date'
  return 'varchar(255)'
}

function formatCellValue(value) {
  if (value == null) return ''
  if (value instanceof Date) {
    // yyyy-MM-dd HH:mm:ss — matches what the validation engine expects,
    // instead of Date.prototype.toString()'s locale-formatted output
    // (e.g. "Sun May 24 2026 16:40:40 GMT+0000 (Coordinated Universal Time)").
    return value.toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, '')
  }
  return String(value)
}

export const POST = withErrorHandling(async (request, { params }) => {
  await requireUser(request)
  const project = await findProjectOrThrow(params.id)
  const body = await request.json().catch(() => ({}))
  const tableName = body.tableName

  if (!tableName || !tableName.trim()) throw ApiError.badRequest('tableName is required.')
  if (!IDENTIFIER_RE.test(tableName)) {
    throw ApiError.badRequest('Invalid table name: only letters, numbers and underscores are allowed.')
  }

  const config = await prisma.connectorConfig.findUnique({ where: { projectId: project.id } })
  if (!config) {
    throw ApiError.badRequest('Save a connector configuration (host/port/credentials) before ingesting a table.')
  }
  if (!['MYSQL', 'POSTGRES', 'MYSQL_POSTGRES'].includes(config.connectorType)) {
    throw ApiError.badRequest('Live table ingestion is only supported for MySQL/PostgreSQL connectors.')
  }

  let ingested
  try {
    ingested = config.connectorType === 'POSTGRES'
      ? await ingestPostgres(config, tableName)
      : await ingestMysql(config, tableName)
  } catch (e) {
    throw ApiError.unprocessable(`Database connection/query failed: ${e.message}`)
  }

  await prisma.sourceMetadata.deleteMany({ where: { projectId: project.id } })
  for (const col of ingested.columns) {
    await prisma.sourceMetadata.create({
      data: {
        projectId: project.id,
        tableName,
        columnName: col.name,
        dataType: col.dataType,
        nullable: col.nullable,
        isPrimaryKey: col.primaryKey,
      },
    })
  }

  const headers = ingested.columns.map((c) => c.name)
  const stringRows = ingested.rows.map((row) => {
    const out = {}
    for (const h of headers) out[h] = formatCellValue(row[h])
    return out
  })
  const csvText = stringifyCsv(headers, stringRows)

  await prisma.connectorConfig.update({
    where: { projectId: project.id },
    data: { sourceFileName: `source_${project.id}_${tableName}.csv`, sourceData: csvText },
  })

  return NextResponse.json(await getMetadataResponse(project.id))
})
