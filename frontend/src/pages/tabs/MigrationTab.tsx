import { useState } from 'react'
import { PlayCircle, StopCircle } from 'lucide-react'
import { Card, CardBody, CardHeader, CardTitle } from '@/components/Card'
import { Button } from '@/components/Button'
import { Badge } from '@/components/Badge'
import { ProgressBar } from '@/components/ProgressBar'
import { useStartMigration, useMigrationStatus, useStopMigration } from '@/hooks/useMigration'
import { formatPercent } from '@/lib/format'

export default function MigrationTab({ projectId }: { projectId: number }) {
  const [jobId, setJobId] = useState<number | undefined>(undefined)
  const startMigration = useStartMigration(projectId)
  const stopMigration = useStopMigration(projectId)

  const isPolling = !!jobId
  const { data: status } = useMigrationStatus(projectId, jobId, isPolling)

  const running = status?.status === 'RUNNING'

  return (
    <Card>
      <CardHeader>
        <CardTitle>Migration Execution</CardTitle>
        <div className="flex gap-2">
          {running ? (
            <Button size="sm" variant="danger" onClick={() => stopMigration.mutate(jobId)}>
              <StopCircle size={15} /> Stop
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => startMigration.mutate(undefined, { onSuccess: (data) => setJobId(data.jobId) })}
              disabled={startMigration.isPending}
            >
              <PlayCircle size={15} /> {startMigration.isPending ? 'Starting…' : 'Start Migration'}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardBody>
        {!status ? (
          <p className="text-sm text-graphite-500">
            Starts the asynchronous transformation pipeline: reads the ingested source data, applies your
            mapping rules, and writes a UDM-normalized staging file consumed by Export.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-graphite-500">Job #{status.jobId}</span>
              <Badge status={status.status} />
            </div>
            <ProgressBar percent={status.progressPercent} />
            <div className="grid grid-cols-4 gap-4">
              {[
                ['Progress', formatPercent(status.progressPercent)],
                ['Processed', status.recordsProcessed],
                ['Succeeded', status.recordsSucceeded],
                ['Failed', status.recordsFailed],
              ].map(([label, value]) => (
                <div key={label as string} className="border border-graphite-200 px-4 py-3">
                  <p className="eyebrow mb-1">{label}</p>
                  <p className="font-display text-xl font-semibold text-ink">{value}</p>
                </div>
              ))}
            </div>
            {status.status === 'COMPLETED' && (
              <p className="text-xs text-graphite-500">
                Migration complete. Head to the Export tab to build the SAP-ready output bundle for job #{status.jobId}.
              </p>
            )}
          </div>
        )}
        {startMigration.isError && (
          <p className="mt-4 border border-ink bg-graphite-50 px-3 py-2 text-xs text-ink">
            Could not start migration. Configure at least one mapping rule and ingest source data first.
          </p>
        )}
      </CardBody>
    </Card>
  )
}
