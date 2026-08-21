import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Trash2 } from 'lucide-react'
import { Layout } from '@/components/Layout'
import { Card, CardBody } from '@/components/Card'
import { Button } from '@/components/Button'
import { Badge } from '@/components/Badge'
import { Modal } from '@/components/Modal'
import { DataTable, type Column } from '@/components/DataTable'
import { Input, Textarea, Select, FieldLabel } from '@/components/Field'
import { EmptyState } from '@/components/EmptyState'
import { useProjects, useCreateProject, useDeleteProject } from '@/hooks/useProjects'
import { useSourceSystems } from '@/hooks/useConnectors'
import { formatDate } from '@/lib/format'
import type { Project } from '@/api/types'

const MANUAL_SOURCES = ['Excel (.xlsx / .xls)', 'Access (.mdb / .accdb)', 'CSV (.csv)', 'Text (.txt)', 'TSV (.tsv)', 'XML (.xml)', 'JSON (.json)']

export default function ProjectsPage() {
  const { data: projects, isLoading } = useProjects()
  const { data: sourceSystems } = useSourceSystems()
  const createProject = useCreateProject()
  const deleteProject = useDeleteProject()

  const [modalOpen, setModalOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [sourceErp, setSourceErp] = useState('')
  const [sourceMode, setSourceMode] = useState<'manual' | 'live'>('manual')

  function handleCreate(e: FormEvent) {
    e.preventDefault()
    const effectiveSourceErp = sourceErp || (sourceMode === 'manual' ? MANUAL_SOURCES[0] : sourceSystems?.[0]?.name) || ''
    createProject.mutate(
      { name, description, sourceErp: effectiveSourceErp, targetErp: 'SAP_S4HANA' },
      {
        onSuccess: () => {
          setModalOpen(false)
          setName('')
          setDescription('')
        },
      }
    )
  }

  const columns: Column<Project>[] = [
    {
      header: 'Project',
      accessor: (p) => (
        <Link to={`/projects/${p.id}`} className="font-medium text-ink hover:underline">
          {p.name}
        </Link>
      ),
    },
    { header: 'Source → Target', accessor: (p) => `${p.sourceErp} → ${p.targetErp}` },
    { header: 'Status', accessor: (p) => <Badge status={p.status} /> },
    { header: 'Created', accessor: (p) => formatDate(p.createdAt) },
    {
      header: '',
      accessor: (p) => (
        <button
          onClick={(e) => {
            e.preventDefault()
            if (confirm(`Delete project "${p.name}"? This cannot be undone.`)) {
              deleteProject.mutate(p.id, {
                onError: (err: any) => {
                  alert(err?.response?.data?.message || 'Could not delete this project. Please try again.')
                },
              })
            }
          }}
          className="text-graphite-400 hover:text-ink"
          aria-label="Delete project"
        >
          <Trash2 size={15} />
        </button>
      ),
      width: '40px',
    },
  ]

  return (
    <Layout title="Projects" subtitle="Manage your legacy ERP to SAP S/4HANA migration projects">
      <div className="mb-4 flex justify-end">
        <Button size="sm" onClick={() => setModalOpen(true)}>
          <Plus size={15} /> New Project
        </Button>
      </div>

      <Card>
        <CardBody className="p-0">
          {isLoading ? (
            <p className="p-5 text-sm text-graphite-500">Loading projects…</p>
          ) : !projects || projects.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title="No projects yet"
                description="Create a project to begin discovering, mapping, and validating source data."
                action={<Button size="sm" onClick={() => setModalOpen(true)}>New Project</Button>}
              />
            </div>
          ) : (
            <DataTable columns={columns} rows={projects} keyFor={(p) => p.id} />
          )}
        </CardBody>
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Migration Project">
        <form onSubmit={handleCreate}>
          <div className="mb-4">
            <FieldLabel>Project name</FieldLabel>
            <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Odoo to SAP ERP Migration" />
          </div>
          <div className="mb-4">
            <FieldLabel>Description</FieldLabel>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Consolidation project for..." />
          </div>
          <div className="mb-5">
            <FieldLabel>Input type</FieldLabel>
            <div className="mb-3 grid grid-cols-2 gap-1 border border-graphite-200 p-1">
              {[
                ['manual', 'Manual Upload'],
                ['live', 'Live Connection'],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setSourceMode(value as typeof sourceMode)
                    setSourceErp('')
                  }}
                  className={sourceMode === value ? 'bg-ink px-2 py-2 text-xs font-medium text-paper' : 'px-2 py-2 text-xs font-medium text-graphite-600 hover:bg-graphite-100'}
                >
                  {label}
                </button>
              ))}
            </div>
            <FieldLabel>
              {sourceMode === 'manual' ? 'File format' : 'Live ERP source'}
            </FieldLabel>
            <Select
              value={sourceErp || (sourceMode === 'manual' ? MANUAL_SOURCES[0] : sourceSystems?.[0]?.name || '')}
              onChange={(e) => setSourceErp(e.target.value)}
            >
              {sourceMode === 'manual' && MANUAL_SOURCES.map((source) => <option key={source} value={source}>{source}</option>)}
              {sourceMode === 'live' && !sourceSystems && <option value="">Loading…</option>}
              {sourceMode === 'live' && Object.entries(
                (sourceSystems ?? []).reduce<Record<string, string[]>>((acc, s) => {
                  acc[s.category] = acc[s.category] || []
                  acc[s.category].push(s.name)
                  return acc
                }, {})
              ).map(([category, names]) => (
                <optgroup key={category} label={category}>
                  {names.map((erp) => <option key={erp} value={erp}>{erp}</option>)}
                </optgroup>
              ))}
            </Select>
            <p className="mt-2 text-xs text-graphite-500">
              {sourceMode === 'manual'
                ? 'Upload and parse this format in the project Connector tab.'
                : 'Database or ERP credentials, connection testing, and table access are configured after project creation.'}
            </p>
          </div>
          {createProject.isError && (
            <p className="mb-4 border border-ink bg-graphite-50 px-3 py-2 text-xs text-ink">
              {(createProject.error as any)?.response?.data?.message ||
                'Could not create project. Check the console/network tab for details.'}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createProject.isPending}>
              {createProject.isPending ? 'Creating…' : 'Create project'}
            </Button>
          </div>
        </form>
      </Modal>
    </Layout>
  )
}