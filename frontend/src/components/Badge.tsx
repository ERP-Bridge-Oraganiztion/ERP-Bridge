import { cn } from '@/lib/cn'

type Tone = 'solid' | 'outline' | 'dashed' | 'muted'

const TONE_BY_STATUS: Record<string, Tone> = {
  ACTIVE: 'solid',
  RUNNING: 'solid',
  COMPLETED: 'solid',
  SUCCESS: 'solid',
  CREATED: 'outline',
  PENDING: 'outline',
  ARCHIVED: 'muted',
  WARNING: 'dashed',
  STOPPED: 'dashed',
  FAILED: 'dashed',
  ERROR: 'dashed',
  CRITICAL: 'dashed',
}

export function Badge({ status, label }: { status: string; label?: string }) {
  const tone = TONE_BY_STATUS[status?.toUpperCase()] ?? 'outline'
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 border px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-widest2',
        tone === 'solid' && 'border-ink bg-ink text-paper',
        tone === 'outline' && 'border-ink text-ink',
        tone === 'dashed' && 'border-dashed border-ink text-ink',
        tone === 'muted' && 'border-graphite-300 text-graphite-500'
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', tone === 'solid' ? 'bg-paper' : 'bg-ink')} />
      {label ?? status}
    </span>
  )
}
