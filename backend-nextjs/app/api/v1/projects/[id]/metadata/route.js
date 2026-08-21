import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withErrorHandling } from '@/lib/errors'
import { requireUser } from '@/lib/auth'
import { findProjectOrThrow } from '@/lib/projects'

// Always execute fresh on every request — never statically cache or serve
// stale data for this dynamic, per-project API.
export const dynamic = 'force-dynamic'

export async function getMetadataResponse(projectId) {
  const project = await findProjectOrThrow(projectId)
  const all = await prisma.sourceMetadata.findMany({
    where: { projectId: project.id },
    orderBy: { id: 'asc' },
  })

  const grouped = new Map()
  for (const m of all) {
    if (!grouped.has(m.tableName)) grouped.set(m.tableName, [])
    grouped.get(m.tableName).push(m)
  }

  const tables = Array.from(grouped.entries()).map(([tableName, columns]) => ({
    tableName,
    columnCount: columns.length,
    columns: columns.map((c) => ({
      name: c.columnName,
      dataType: c.dataType,
      nullable: c.nullable,
      primaryKey: c.isPrimaryKey,
    })),
  }))

  return { projectId: project.id, sourceErp: project.sourceErp, discoveredTables: tables }
}

export const GET = withErrorHandling(async (request, { params }) => {
  await requireUser(request)
  return NextResponse.json(await getMetadataResponse(params.id))
})
