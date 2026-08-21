import { NextResponse } from 'next/server'
import { withErrorHandling } from '@/lib/errors'
import { requireUser } from '@/lib/auth'
import { toUserResponse } from '@/lib/dto'

// Always execute fresh on every request — never statically cache or serve
// stale data for this dynamic, per-project API.
export const dynamic = 'force-dynamic'

export const GET = withErrorHandling(async (request) => {
  const user = await requireUser(request)
  return NextResponse.json(toUserResponse(user))
})
