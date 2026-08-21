import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Layout } from '@/components/Layout'
import { useProject } from '@/hooks/useProjects'
import { cn } from '@/lib/cn'
import OverviewTab from './tabs/OverviewTab'
import ConnectorTab from './tabs/ConnectorTab'
import SchemaTab from './tabs/SchemaTab'
import MappingTab from './tabs/MappingTab'
import ValidationTab from './tabs/ValidationTab'
import MigrationTab from './tabs/MigrationTab'
import ExportTab from './tabs/ExportTab'

const TABS = ['Overview', 'Connector', 'Schema', 'Mapping', 'Validation', 'Migration', 'Export'] as const
type Tab = (typeof TABS)[number]

export default function ProjectDetailPage() {
  const { id } = useParams()
  const projectId = Number(id)
  const { data: project, isLoading } = useProject(projectId)
  const [tab, setTab] = useState<Tab>('Overview')

  if (isLoading || !project) {
    return (
      <Layout title="Project">
        <p className="text-sm text-graphite-500">Loading project…</p>
      </Layout>
    )
  }

  return (
    <Layout title={project.name} subtitle={`Project #${project.id} · ${project.sourceErp} → ${project.targetErp}`}>
      <Link to="/projects" className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-graphite-600 hover:text-ink">
        <ArrowLeft size={13} /> Back to projects
      </Link>

      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-graphite-200">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'shrink-0 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
              tab === t ? 'border-ink text-ink' : 'border-transparent text-graphite-500 hover:text-ink'
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Overview' && <OverviewTab project={project} />}
      {tab === 'Connector' && <ConnectorTab projectId={project.id} sourceErp={project.sourceErp} />}
      {tab === 'Schema' && <SchemaTab projectId={project.id} />}
      {tab === 'Mapping' && <MappingTab projectId={project.id} />}
      {tab === 'Validation' && <ValidationTab projectId={project.id} />}
      {tab === 'Migration' && <MigrationTab projectId={project.id} />}
      {tab === 'Export' && <ExportTab projectId={project.id} />}
    </Layout>
  )
}
