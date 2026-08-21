import { Link } from 'react-router-dom'
import { ArrowUpRight, FolderKanban, CheckCircle2, AlertTriangle, Layers } from 'lucide-react'
import { Layout } from '@/components/Layout'
import { Card, CardBody } from '@/components/Card'
import { Badge } from '@/components/Badge'
import { EmptyState } from '@/components/EmptyState'
import { Button } from '@/components/Button'
import { useProjects } from '@/hooks/useProjects'
import { formatDate } from '@/lib/format'

export default function DashboardPage() {
  const { data: projects, isLoading } = useProjects()

  const total = projects?.length ?? 0
  const active = projects?.filter((p) => p.status === 'ACTIVE').length ?? 0
  const completed = projects?.filter((p) => p.status === 'COMPLETED').length ?? 0
  const failed = projects?.filter((p) => p.status === 'FAILED').length ?? 0

  const stats = [
    { label: 'Total Projects', value: total, icon: FolderKanban },
    { label: 'Active', value: active, icon: Layers },
    { label: 'Completed', value: completed, icon: CheckCircle2 },
    { label: 'Failed', value: failed, icon: AlertTriangle },
  ]

  return (
    <Layout title="Dashboard" subtitle="Real-time overview of your ERP → SAP migration portfolio">
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardBody>
              <div className="flex items-start justify-between">
                <p className="eyebrow">{label}</p>
                <Icon size={16} className="text-graphite-400" />
              </div>
              <p className="mt-3 font-display text-3xl font-semibold text-ink">{value}</p>
            </CardBody>
          </Card>
        ))}
      </div>

      <Card>
        <div className="flex items-center justify-between border-b border-graphite-200 px-5 py-4">
          <h3 className="font-display text-base font-semibold text-ink">Recent Projects</h3>
          <Link to="/projects" className="flex items-center gap-1 text-xs font-medium text-graphite-600 hover:text-ink">
            View all <ArrowUpRight size={13} />
          </Link>
        </div>
        <CardBody>
          {isLoading ? (
            <p className="text-sm text-graphite-500">Loading projects…</p>
          ) : total === 0 ? (
            <EmptyState
              title="No migration projects yet"
              description="Create your first project to start mapping legacy ERP data into SAP S/4HANA."
              action={
                <Link to="/projects">
                  <Button size="sm">New Project</Button>
                </Link>
              }
            />
          ) : (
            <div className="divide-y divide-graphite-200">
              {projects!.slice(0, 6).map((p) => (
                <Link
                  key={p.id}
                  to={`/projects/${p.id}`}
                  className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0 hover:opacity-70"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{p.name}</p>
                    <p className="mt-0.5 font-mono text-[11px] uppercase tracking-widest2 text-graphite-500">
                      {p.sourceErp} → {p.targetErp} · {formatDate(p.createdAt)}
                    </p>
                  </div>
                  <Badge status={p.status} />
                </Link>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </Layout>
  )
}
