import { useState } from 'react'
import { PlayCircle } from 'lucide-react'
import { Card, CardBody, CardHeader, CardTitle } from '@/components/Card'
import { Button } from '@/components/Button'
import { Badge } from '@/components/Badge'
import { DataTable, type Column } from '@/components/DataTable'
import { EmptyState } from '@/components/EmptyState'
import { useRunValidation, useValidationReport } from '@/hooks/useValidation'
import type { ValidationErrorItem } from '@/api/types'

export default function ValidationTab({ projectId }: { projectId: number }) {
  const runValidation = useRunValidation(projectId)
  const [jobId, setJobId] = useState<number | undefined>(undefined)
  const { data: report, isLoading } = useValidationReport(projectId, jobId)

  const metrics = runValidation.data?.validationMetrics

  const columns: Column<ValidationErrorItem>[] = [
    { header: 'Table', accessor: (e) => e.tableName },
    { header: 'Record ID', accessor: (e) => <span className="font-mono text-xs">{e.recordId}</span> },
    { header: 'Field', accessor: (e) => e.fieldName },
    { header: 'Severity', accessor: (e) => <Badge status={e.severity} /> },
    { header: 'Type', accessor: (e) => e.errorType },
    { header: 'Description', accessor: (e) => <span className="text-graphite-600">{e.description}</span> },
  ]

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>20-Point Validation Engine</CardTitle>
          <Button
            size="sm"
            onClick={() => runValidation.mutate(undefined, { onSuccess: (data) => setJobId(data.jobId) })}
            disabled={runValidation.isPending}
          >
            <PlayCircle size={15} /> {runValidation.isPending ? 'Running…' : 'Run Validation'}
          </Button>
        </CardHeader>
        <CardBody>
          {metrics ? (
            <div className="grid grid-cols-4 gap-4">
              {[
                ['Checked', metrics.totalCheckedRecords],
                ['Valid', metrics.validRecords],
                ['Errors', metrics.errorCount],
                ['Warnings', metrics.warningCount],
              ].map(([label, value]) => (
                <div key={label as string} className="border border-graphite-200 px-4 py-3">
                  <p className="eyebrow mb-1">{label}</p>
                  <p className="font-display text-2xl font-semibold text-ink">{value}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-graphite-500">
              Run the validation engine to check required fields, email formats, numeric boundaries, ISO
              currency codes, and duplicate primary keys across your source dataset.
            </p>
          )}
          {runValidation.isError && (
            <p className="mt-4 border border-ink bg-graphite-50 px-3 py-2 text-xs text-ink">
              {(runValidation.error as any)?.response?.data?.message ||
                'Validation could not run. Check the console/network tab for details.'}
            </p>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Validation Report</CardTitle>
        </CardHeader>
        <CardBody className="p-0">
          {isLoading ? (
            <p className="p-5 text-sm text-graphite-500">Loading report…</p>
          ) : !report || report.errors.length === 0 ? (
            <div className="p-5">
              <EmptyState title="No validation issues found" description="Run validation to generate a report, or your last run was clean." />
            </div>
          ) : (
            <DataTable columns={columns} rows={report.errors} keyFor={(e) => e.id} />
          )}
        </CardBody>
      </Card>
    </div>
  )
}
