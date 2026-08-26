import { NextResponse } from 'next/server'
import { ApiError, withErrorHandling } from '@/lib/errors'

export const dynamic = 'force-dynamic'

export const POST = withErrorHandling(async (request) => {
  const body = await request.json().catch(() => ({}))
  const identifier = String(body.identifier || '').trim()
  if (!identifier) throw ApiError.badRequest('Email or username is required.')

  // Keep account existence private until an email delivery provider is configured.
  return NextResponse.json({ message: 'If an account matches, password reset instructions will be sent to its email.' })
})
