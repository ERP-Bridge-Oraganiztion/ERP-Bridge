import { NextResponse } from 'next/server'
import { withErrorHandling } from '@/lib/errors'
import { requireUser } from '@/lib/auth'
import { SOURCE_SYSTEMS } from '@/lib/sourceSystems'

// Always execute fresh on every request — never statically cache or serve
// stale data for this dynamic, per-project API.
export const dynamic = 'force-dynamic'

export const GET = withErrorHandling(async (request) => {
  await requireUser(request)
  return NextResponse.json({ sourceSystems: SOURCE_SYSTEMS })
})
