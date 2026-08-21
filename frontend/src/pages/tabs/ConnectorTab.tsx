import { useState } from 'react'
import { CheckCircle2, XCircle, FileCheck } from 'lucide-react'
import { Card, CardBody, CardHeader, CardTitle } from '@/components/Card'
import { Button } from '@/components/Button'
import { FieldLabel, Input } from '@/components/Field'
import { FileDropzone } from '@/components/FileDropzone'
import {
  useConnectorList,
  useSourceSystems,
  useTestConnector,
  useSaveConnectorConfig,
  useConnectorStatus,
  useUploadSourceFile,
  useMetadata,
  useIngestFromDatabase,
} from '@/hooks/useConnectors'

const MANUAL_FILE_CONFIG: Record<string, { accept: string; label: string; hint: string }> = {
  'Excel (.xlsx / .xls)': { accept: '.xlsx,.xls', label: 'Excel', hint: 'Excel file (.xlsx or .xls), up to 50MB' },
  'Access (.mdb / .accdb)': { accept: '.mdb,.accdb', label: 'Access', hint: 'Access database (.mdb or .accdb), up to 50MB' },
  'CSV (.csv)': { accept: '.csv', label: 'CSV', hint: 'CSV file (.csv), up to 50MB' },
  'Text (.txt)': { accept: '.txt', label: 'text', hint: 'Text file (.txt), up to 50MB' },
  'TSV (.tsv)': { accept: '.tsv', label: 'TSV', hint: 'TSV file (.tsv), up to 50MB' },
  'XML (.xml)': { accept: '.xml', label: 'XML', hint: 'XML file (.xml), up to 50MB' },
  'JSON (.json)': { accept: '.json', label: 'JSON', hint: 'JSON file (.json), up to 50MB' },
}

export default function ConnectorTab({ projectId, sourceErp }: { projectId: number; sourceErp: string }) {
  const { data: connectors } = useConnectorList()
  const { data: sourceSystems } = useSourceSystems()
  const testConnector = useTestConnector()
  const saveConnector = useSaveConnectorConfig(projectId)
  const uploadFile = useUploadSourceFile(projectId)
  const ingestFromDb = useIngestFromDatabase(projectId)
  const { data: status } = useConnectorStatus(projectId)
  const { data: metadata } = useMetadata(projectId)

  // The project's sourceErp is just a display label (e.g. "SAP ECC",
  // "Odoo"). Whether a *live database connection* is available for it
  // is looked up from the curated source-systems list — every system can
  // still be ingested via CSV/Excel export regardless.
  const sourceSystemMeta = sourceSystems?.find((s) => s.name === sourceErp)
  const liveConnectType = sourceSystemMeta?.liveConnect ?? null
  const supportsLiveConnect = !!liveConnectType

  const discoveredTable = metadata?.discoveredTables?.[0]
  const hasSourceFile = status?.hasSourceFile ?? !!discoveredTable

  const [host, setHost] = useState('')
  const [port, setPort] = useState('3306')
  const [databaseName, setDatabaseName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [tableName, setTableName] = useState('res_partner')
  const [dbTableName, setDbTableName] = useState('customers')

  const connectorMeta = connectors?.find((c) => c.type === liveConnectType)
  const manualFileConfig = MANUAL_FILE_CONFIG[sourceErp]

  function handleTest() {
    if (!liveConnectType) return
    testConnector.mutate({ connectorType: liveConnectType, host, port: Number(port), databaseName, username, password })
  }

  function handleSave() {
    if (!liveConnectType) return
    saveConnector.mutate({ connectorType: liveConnectType, host, port: Number(port), databaseName, username, password })
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Source Connector</CardTitle>
          <span className="font-mono text-[11px] uppercase tracking-widest2 text-graphite-500">{sourceErp}</span>
        </CardHeader>
        <CardBody>
            {manualFileConfig && <div>
            {hasSourceFile && (
              <p className="mb-4 flex items-center gap-1.5 border border-ink bg-graphite-50 px-3 py-2 text-xs text-ink">
                <FileCheck size={14} />
                Source file already uploaded
                {status?.sourceFileName ? <> — <span className="font-mono">{status.sourceFileName}</span></> : null}
                {discoveredTable ? <> ({discoveredTable.columnCount} columns discovered)</> : null}.
                Uploading again below will replace it.
              </p>
            )}
            <p className="mb-4 text-sm text-graphite-600">
              Upload {manualFileConfig.label} data. Only the selected project format is accepted.
            </p>
            <div className="mb-4">
              <FieldLabel>Table name</FieldLabel>
              <Input value={tableName} onChange={(e) => setTableName(e.target.value)} placeholder="res_partner" />
            </div>
            <FileDropzone
              accept={manualFileConfig.accept}
              hint={manualFileConfig.hint}
              onFileSelected={(file) => uploadFile.mutate({ file, tableName })}
            />
            {uploadFile.isSuccess && (
              <p className="mt-3 flex items-center gap-1.5 text-xs text-ink">
                <CheckCircle2 size={14} /> Schema discovered from uploaded file. See the Schema tab.
              </p>
            )}
            {uploadFile.isError && (
              <p className="mt-3 flex items-center gap-1.5 border border-ink bg-graphite-50 px-3 py-2 text-xs text-ink">
                <XCircle size={14} />
                {(uploadFile.error as any)?.response?.data?.message ??
                  'Upload failed. Confirm the file has a header row and try again.'}
              </p>
            )}
          </div>}

          {/* Live database connection — only shown when this source system
              is known to run on a database we can query directly. */}
          {supportsLiveConnect && (
            <div className="mt-6 space-y-4 border-t border-graphite-200 pt-5">
              <p className="text-sm text-graphite-600">
                {sourceErp} runs on {connectorMeta?.displayName ?? liveConnectType}. You can also connect directly and
                pull a table live instead of exporting a file.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel>Host</FieldLabel>
                  <Input value={host} onChange={(e) => setHost(e.target.value)} placeholder="db.internal.corp" />
                </div>
                <div>
                  <FieldLabel>Port</FieldLabel>
                  <Input
                    value={port}
                    onChange={(e) => setPort(e.target.value)}
                    placeholder={liveConnectType === 'POSTGRES' ? '5432' : '3306'}
                  />
                </div>
              </div>
              <div>
                <FieldLabel>Database name</FieldLabel>
                <Input value={databaseName} onChange={(e) => setDatabaseName(e.target.value)} placeholder="odoo_master" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel>Username</FieldLabel>
                  <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="erp_bridge_connector" />
                </div>
                <div>
                  <FieldLabel>Password</FieldLabel>
                  <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
                </div>
              </div>

              {testConnector.data && (
                <p className="flex items-center gap-1.5 border border-ink bg-graphite-50 px-3 py-2 text-xs text-ink">
                  {testConnector.data.status === 'SUCCESS' ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                  {testConnector.data.message} ({testConnector.data.latencyMs}ms)
                </p>
              )}

              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={handleTest} disabled={testConnector.isPending}>
                  {testConnector.isPending ? 'Testing…' : 'Test connection'}
                </Button>
                <Button size="sm" onClick={handleSave} disabled={saveConnector.isPending}>
                  {saveConnector.isPending ? 'Saving…' : 'Save configuration'}
                </Button>
              </div>
              {saveConnector.isSuccess && (
                <p className="text-xs text-graphite-500">Connector configuration saved and encrypted at rest.</p>
              )}

              <div className="mt-2 border-t border-graphite-200 pt-4">
                {hasSourceFile && (
                  <p className="mb-3 flex items-center gap-1.5 border border-ink bg-graphite-50 px-3 py-2 text-xs text-ink">
                    <FileCheck size={14} />
                    Table already ingested
                    {discoveredTable ? <> — <strong>{discoveredTable.tableName}</strong> with {discoveredTable.columnCount} columns</> : null}.
                    Ingesting again below will refresh it.
                  </p>
                )}
                <FieldLabel>Table to ingest</FieldLabel>
                <div className="flex gap-2">
                  <Input value={dbTableName} onChange={(e) => setDbTableName(e.target.value)} placeholder="customers" />
                  <Button
                    size="sm"
                    onClick={() => ingestFromDb.mutate(dbTableName)}
                    disabled={ingestFromDb.isPending || !(saveConnector.isSuccess || status?.configured)}
                  >
                    {ingestFromDb.isPending ? 'Connecting…' : 'Connect & Ingest'}
                  </Button>
                </div>
                <p className="mt-2 text-xs text-graphite-500">
                  Save the configuration above first, then connect live and pull rows from this table
                  (up to 100,000 rows) so it's ready for Schema, Mapping, Validation and Migration.
                </p>
                {ingestFromDb.isSuccess && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-ink">
                    <CheckCircle2 size={14} /> Table ingested successfully. See the Schema tab.
                  </p>
                )}
                {ingestFromDb.isError && (
                  <p className="mt-2 flex items-center gap-1.5 border border-ink bg-graphite-50 px-3 py-2 text-xs text-ink">
                    <XCircle size={14} />
                    {(ingestFromDb.error as any)?.response?.data?.message || 'Could not connect to the database.'}
                  </p>
                )}
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Supported Connectors</CardTitle>
        </CardHeader>
        <CardBody>
          <ul className="divide-y divide-graphite-200">
            {(connectors ?? []).map((c) => (
              <li key={c.type} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                <span className="text-sm text-ink">{c.displayName}</span>
                <span className="font-mono text-[10px] uppercase tracking-widest2 text-graphite-500">
                  {c.stable ? 'Stable' : 'Beta'}
                </span>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>
    </div>
  )
}
