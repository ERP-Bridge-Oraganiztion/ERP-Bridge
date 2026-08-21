import type { ReactNode } from 'react'

export interface Column<T> {
  header: string
  accessor: (row: T) => ReactNode
  width?: string
}

export function DataTable<T>({
  columns,
  rows,
  keyFor,
  emptyLabel = 'No records to display.',
}: {
  columns: Column<T>[]
  rows: T[]
  keyFor: (row: T) => string | number
  emptyLabel?: string
}) {
  if (rows.length === 0) {
    return (
      <div className="border border-dashed border-graphite-300 px-4 py-10 text-center text-sm text-graphite-500">
        {emptyLabel}
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.header} style={{ width: col.width }}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={keyFor(row)}>
              {columns.map((col) => (
                <td key={col.header}>{col.accessor(row)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
