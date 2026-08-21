import { NextResponse } from 'next/server'
import { withErrorHandling } from '@/lib/errors'
import { requireUser } from '@/lib/auth'

const CONNECTORS = [
  { type: 'CSV', displayName: 'Structured CSV Import', stable: true },
  { type: 'EXCEL', displayName: 'Microsoft Excel Sheets', stable: true },
  { type: 'ODOO', displayName: 'Odoo ERP (v15-v17)', stable: true },
  { type: 'ERPNEXT', displayName: 'ERPNext Framework', stable: true },
  { type: 'ORACLE_SQL', displayName: 'Oracle Database Engine', stable: false },
  { type: 'MS_SQL_SERVER', displayName: 'Microsoft SQL Server', stable: false },
  { type: 'MYSQL', displayName: 'MySQL (live connection)', stable: true },
  { type: 'POSTGRES', displayName: 'PostgreSQL (live connection)', stable: true },
]

export const GET = withErrorHandling(async (request) => {
  await requireUser(request)
  return NextResponse.json({ connectors: CONNECTORS })
})
