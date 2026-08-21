import { Card, CardBody, CardHeader, CardTitle } from '@/components/Card'
import { EmptyState } from '@/components/EmptyState'
import { DataTable, type Column } from '@/components/DataTable'
import { useMetadata } from '@/hooks/useConnectors'
import type { ColumnMetadata } from '@/api/types'

export default function SchemaTab({ projectId }: { projectId: number }) {
  const { data, isLoading } = useMetadata(projectId)

  const columns: Column<ColumnMetadata>[] = [
    { header: 'Column', accessor: (c) => <span className="font-medium text-ink">{c.name}</span> },
    { header: 'Data Type', accessor: (c) => <span className="font-mono text-xs">{c.dataType}</span> },
    { header: 'Nullable', accessor: (c) => (c.nullable ? 'Yes' : 'No') },
    { header: 'Primary Key', accessor: (c) => (c.primaryKey ? 'Yes' : 'No') },
  ]

  if (isLoading) return <p className="text-sm text-graphite-500">Loading schema…</p>

  const tables = data?.discoveredTables ?? []

  if (tables.length === 0) {
    return (
      <EmptyState
        title="No schema discovered yet"
        description="Upload a source file or test a database connector on the Connector tab to discover table structure."
      />
    )
  }

  return (
    <div className="space-y-4">
      {tables.map((table) => (
        <Card key={table.tableName}>
          <CardHeader>
            <CardTitle>{table.tableName}</CardTitle>
            <span className="font-mono text-[11px] uppercase tracking-widest2 text-graphite-500">
              {table.columnCount} columns
            </span>
          </CardHeader>
          <CardBody className="p-0">
            <DataTable columns={columns} rows={table.columns} keyFor={(c) => c.name} />
          </CardBody>
        </Card>
      ))}
    </div>
  )
}
