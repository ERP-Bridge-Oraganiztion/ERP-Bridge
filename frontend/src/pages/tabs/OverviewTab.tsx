import { Card, CardBody, CardHeader, CardTitle } from '@/components/Card'
import { Badge } from '@/components/Badge'
import { formatDate } from '@/lib/format'
import type { Project } from '@/api/types'

export default function OverviewTab({ project }: { project: Project }) {
  const rows: [string, string][] = [
    ['Project ID', `#${project.id}`],
    ['Source ERP', project.sourceErp],
    ['Target', project.targetErp],
    ['Created', formatDate(project.createdAt)],
    ['Last Updated', formatDate(project.updatedAt)],
  ]

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
          <Badge status={project.status} />
        </CardHeader>
        <CardBody>
          <p className="mb-5 text-sm leading-relaxed text-graphite-700">
            {project.description || 'No description provided for this migration project.'}
          </p>
          <dl className="grid grid-cols-2 gap-4">
            {rows.map(([label, value]) => (
              <div key={label}>
                <dt className="eyebrow mb-1">{label}</dt>
                <dd className="text-sm font-medium text-ink">{value}</dd>
              </div>
            ))}
          </dl>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Migration Pipeline</CardTitle>
        </CardHeader>
        <CardBody>
          <ol className="space-y-3">
            {['Connect Source', 'Discover Schema', 'Map Fields', 'Validate', 'Migrate', 'Export'].map((step, i) => (
              <li key={step} className="flex items-center gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center border border-ink font-mono text-[11px] text-ink">
                  {i + 1}
                </span>
                <span className="text-sm text-graphite-700">{step}</span>
              </li>
            ))}
          </ol>
        </CardBody>
      </Card>
    </div>
  )
}
