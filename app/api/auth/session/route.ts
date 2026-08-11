import { NextRequest, NextResponse } from 'next/server'
import { SESSION_COOKIE, SESSION_SIG_COOKIE } from '@/lib/auth/cookie-config'

function requiredSessionCookieHeader(request: NextRequest): string | null {
  const cookies = [SESSION_COOKIE, SESSION_SIG_COOKIE]
    .map((name) => {
      const value = request.cookies.get(name)?.value
      return value === undefined ? null : `${name}=${encodeURIComponent(value)}`
    })
    .filter((value): value is string => value !== null)

  return cookies.length > 0 ? cookies.join('; ') : null
}

// Redirect to the actual session endpoint
export async function GET(request: NextRequest) {
  // Get the base URL
  const url = new URL('/api/session', request.url)

  // Forward only the two cookies that /api/session actually verifies. Never
  // proxy unrelated cookies (which may carry credentials for sibling hosts).
  const sessionCookies = requiredSessionCookieHeader(request)
  const response = await fetch(url.toString(), {
    ...(sessionCookies ? { headers: { cookie: sessionCookies } } : {}),
  })

  const data = await response.json()

  return NextResponse.json(data, { status: response.status })
}
