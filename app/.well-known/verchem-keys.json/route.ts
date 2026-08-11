import { NextResponse } from 'next/server'
import { getPublishedPublicKeys } from '@/lib/answer-cards/signing-key'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export function GET(): NextResponse {
  return NextResponse.json(
    { keys: getPublishedPublicKeys() },
    {
      headers: {
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
        'Content-Type': 'application/json',
      },
    }
  )
}
