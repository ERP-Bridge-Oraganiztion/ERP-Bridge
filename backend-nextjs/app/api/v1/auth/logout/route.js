import { NextResponse } from 'next/server'
import { withErrorHandling } from '@/lib/errors'

// Always execute fresh on every request — never statically cache or serve
// stale data for this dynamic, per-project API.
export const dynamic = 'force-dynamic'

export const POST = withErrorHandling(async () => {
  // Stateless JWT: the client just discards the token.
  return NextResponse.json({ status: 'SUCCESS', message: 'User session invalidated successfully.' })
})
