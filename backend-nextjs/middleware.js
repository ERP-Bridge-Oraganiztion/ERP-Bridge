import { NextResponse } from 'next/server'

// The Vite/React frontend is deployed as its own Vercel project, so every
// /api/v1/** call is cross-origin. Set FRONTEND_ORIGIN to that project's
// URL (or "*" while testing) in the backend's environment variables.
const ALLOWED_ORIGIN = process.env.FRONTEND_ORIGIN || '*'

export function middleware(request) {
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: corsHeaders(),
    })
  }

  const response = NextResponse.next()
  for (const [key, value] of Object.entries(corsHeaders())) {
    response.headers.set(key, value)
  }
  return response
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  }
}

export const config = {
  matcher: '/api/:path*',
}
