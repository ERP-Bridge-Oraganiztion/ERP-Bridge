import { useState, type FormEvent } from 'react'
import { Download, PackageCheck, Radio, CheckCircle2, XCircle } from 'lucide-react'
import { Card, CardBody, CardHeader, CardTitle } from '@/components/Card'
import { Button } from '@/components/Button'
import { Input, FieldLabel, Select } from '@/components/Field'
import { useExport, usePushToSap } from '@/hooks/useMigration'
import { formatBytes } from '@/lib/format'
import { api } from '@/api/client'
import { cn } from '@/lib/cn'

const FORMATS = ['CSV', 'XLSX', 'JSON']

export default function ExportTab({ projectId }: { projectId: number }) {
  const [mode, setMode] = useState<'file' | 'sap'>('file')

  const exportMutation = useExport(projectId)
  const pushToSap = usePushToSap(projectId)

  const [jobId, setJobId] = useState('')
  const [format, setFormat] = useState('CSV')
  const [downloading, setDownloading] = useState(false)

  const [sapJobId, setSapJobId] = useState('')
  const [sapEndpoint, setSapEndpoint] = useState('')
  const [sapUsername, setSapUsername] = useState('')
  const [sapPassword, setSapPassword] = useState('')

  function handleFileSubmit(e: FormEvent) {
    e.preventDefault()
    exportMutation.mutate({ jobId: Number(jobId), format })
  }

  function handleSapSubmit(e: FormEvent) {
    e.preventDefault()
    pushToSap.mutate({
      jobId: Number(sapJobId),
      endpointUrl: sapEndpoint,
      username: sapUsername || undefined,
      password: sapPassword || undefined,
    })
  }

  async function handleDownload() {
    if (!exportMutation.data) return
    setDownloading(true)
    try {
      const path = exportMutation.data.downloadUrl.replace(/^\/api\/v1/, '')
      const response = await api.get(path, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.download = exportMutation.data.fileName
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Send Data to SAP</CardTitle>
      </CardHeader>
      <CardBody>
        <div className="mb-5 flex gap-1 border-b border-graphite-200">
          <button
            onClick={() => setMode('file')}
            className={cn(
              'border-b-2 px-4 py-2 text-sm font-medium transition-colors',
              mode === 'file' ? 'border-ink text-ink' : 'border-transparent text-graphite-500 hover:text-ink'
            )}
          >
            File Export
          </button>
          <button
            onClick={() => setMode('sap')}
            className={cn(
              'border-b-2 px-4 py-2 text-sm font-medium transition-colors',
              mode === 'sap' ? 'border-ink text-ink' : 'border-transparent text-graphite-500 hover:text-ink'
            )}
          >
            SAP Connection
          </button>
        </div>

        {mode === 'file' ? (
          <>
            <p className="mb-5 text-sm text-graphite-600">
              Builds a compliant SAP LSMW-ready output file from a <span className="font-medium text-ink">completed</span> migration
              job. Enter the job ID from the Migration tab once it shows status <span className="font-medium">COMPLETED</span>,
              then import that file into SAP via LSMW or Migration Cockpit.
            </p>

            <form onSubmit={handleFileSubmit} className="mb-6 flex flex-wrap items-end gap-3">
              <div>
                <FieldLabel>Migration Job ID</FieldLabel>
                <Input required value={jobId} onChange={(e) => setJobId(e.target.value)} placeholder="e.g. 501" className="w-40" />
              </div>
              <div>
                <FieldLabel>Format</FieldLabel>
                <Select value={format} onChange={(e) => setFormat(e.target.value)} className="w-32">
                  {FORMATS.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </Select>
              </div>
              <Button type="submit" disabled={exportMutation.isPending}>
                <PackageCheck size={15} /> {exportMutation.isPending ? 'Building…' : 'Build export'}
              </Button>
            </form>

            {exportMutation.isError && (
              <p className="mb-4 border border-ink bg-graphite-50 px-3 py-2 text-xs text-ink">
                {(exportMutation.error as any)?.response?.data?.message ??
                  'Export failed. The job must have status COMPLETED and have transformed output available.'}
              </p>
            )}

            {exportMutation.data && (
              <div className="flex items-center justify-between border border-ink px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-ink">{exportMutation.data.fileName}</p>
                  <p className="mt-0.5 font-mono text-[11px] uppercase tracking-widest2 text-graphite-500">
                    {exportMutation.data.fileType} · {formatBytes(exportMutation.data.fileSizeBytes)} · expires in 24h
                  </p>
                </div>
                <Button variant="secondary" onClick={handleDownload} disabled={downloading}>
                  <Download size={15} /> {downloading ? 'Downloading…' : 'Download'}
                </Button>
              </div>
            )}
          </>
        ) : (
          <>
            <p className="mb-5 text-sm text-graphite-600">
              Push transformed records straight to a live SAP endpoint (e.g. an OData service like
              <span className="font-mono text-xs"> API_BUSINESS_PARTNER</span>) over HTTPS — no file download/import step.
              Up to 500 records per push.
            </p>

            <form onSubmit={handleSapSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel>Migration Job ID</FieldLabel>
                  <Input required value={sapJobId} onChange={(e) => setSapJobId(e.target.value)} placeholder="e.g. 501" />
                </div>
                <div>
                  <FieldLabel>SAP Endpoint URL</FieldLabel>
                  <Input
                    required
                    value={sapEndpoint}
                    onChange={(e) => setSapEndpoint(e.target.value)}
                    placeholder="https://sap-host/sap/opu/odata/sap/API_BUSINESS_PARTNER/A_BusinessPartner"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel>Username</FieldLabel>
                  <Input value={sapUsername} onChange={(e) => setSapUsername(e.target.value)} placeholder="SAP service user" />
                </div>
                <div>
                  <FieldLabel>Password</FieldLabel>
                  <Input type="password" value={sapPassword} onChange={(e) => setSapPassword(e.target.value)} placeholder="••••••••" />
                </div>
              </div>
              <Button type="submit" disabled={pushToSap.isPending}>
                <Radio size={15} /> {pushToSap.isPending ? 'Pushing…' : 'Push to SAP'}
              </Button>
            </form>

            {pushToSap.isError && (
              <p className="mt-4 border border-ink bg-graphite-50 px-3 py-2 text-xs text-ink">
                {(pushToSap.error as any)?.response?.data?.message ?? 'Could not push data to the SAP endpoint.'}
              </p>
            )}

            {pushToSap.data && (
              <div className="mt-4 flex items-center gap-2 border border-ink px-4 py-3 text-sm text-ink">
                {pushToSap.data.status === 'SUCCESS' ? (
                  <CheckCircle2 size={16} />
                ) : (
                  <XCircle size={16} />
                )}
                <div>
                  <p className="font-medium">{pushToSap.data.message}</p>
                  <p className="mt-0.5 font-mono text-[11px] uppercase tracking-widest2 text-graphite-500">
                    {pushToSap.data.recordsSent} sent · {pushToSap.data.recordsFailed} failed
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </CardBody>
    </Card>
  )
}
