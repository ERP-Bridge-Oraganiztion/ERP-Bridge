import type { ReactNode } from 'react'

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center border border-dashed border-graphite-300 px-6 py-16 text-center">
      <p className="font-display text-sm font-semibold text-ink">{title}</p>
      {description && <p className="mt-1.5 max-w-sm text-sm text-graphite-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
