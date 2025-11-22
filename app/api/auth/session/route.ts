import { NextRequest, NextResponse } from 'next/server'

// Redirect to the actual session endpoint
export async function GET(request: NextRequest) {
  // Get the base URL
  const url = new URL('/api/session', request.url)

  // Forward the request to /api/session
  const response = await fetch(url.toString(), {
    headers: {
      cookie: request.headers.get('cookie') || '',
    },
  })

  const data = await response.json()

  return NextResponse.json(data, { status: response.status })
}