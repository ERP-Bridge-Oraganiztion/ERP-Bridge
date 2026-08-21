import { Link } from 'react-router-dom'
import { Button } from '@/components/Button'

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-paper px-4 text-center">
      <p className="font-mono text-xs uppercase tracking-widest2 text-graphite-500">Error 404</p>
      <h1 className="font-display text-2xl font-semibold text-ink">Page not found</h1>
      <p className="max-w-sm text-sm text-graphite-500">
        The page you're looking for doesn't exist or may have been moved.
      </p>
      <Link to="/" className="mt-3">
        <Button size="sm">Back to dashboard</Button>
      </Link>
    </div>
  )
}
